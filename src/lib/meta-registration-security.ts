export class TrackingRequestError extends Error {
  constructor(public status: number, public code: string, public retryAfter = 0) {
    super(code);
  }
}

/** Bounded process-local protection. NOT a distributed rate limit/consent store. */
export class RegistrationLimits {
  private rates = new Map<string, { minute: number; hour: number; minuteCount: number; hourCount: number }>();
  private preferences = new Map<string, { revision: number; allowed: boolean; expires: number; controller: AbortController }>();
  private users = new Set<string>();
  private preflight = 0;
  private active = 0;
  private cooldowns = new Map<string, number>();
  constructor(private now = Date.now) {}

  enterPreflight() {
    if (this.preflight >= 16) throw new TrackingRequestError(503, "busy", 10);
    this.preflight++;
    let released = false;
    return () => { if (!released) { released = true; this.preflight--; } };
  }

  checkRate(userId: string, sessionId: string) {
    const now = this.now();
    for (const [key, value] of this.rates) if (now - value.hour >= 3_600_000) this.rates.delete(key);
    const keys = [`u:${userId}`, `s:${sessionId}`];
    for (const key of keys) {
      let bucket = this.rates.get(key);
      if (!bucket) {
        if (this.rates.size >= 4096) throw new TrackingRequestError(503, "busy", 60);
        bucket = { minute: now, hour: now, minuteCount: 0, hourCount: 0 };
        this.rates.set(key, bucket);
      }
      if (now - bucket.minute >= 60_000) { bucket.minute = now; bucket.minuteCount = 0; }
      const minuteMax = key.startsWith("u:") ? 16 : 10;
      const hourMax = key.startsWith("u:") ? 64 : 40;
      if (bucket.minuteCount >= minuteMax || bucket.hourCount >= hourMax) {
        const wait = bucket.hourCount >= hourMax ? bucket.hour + 3_600_000 - now : bucket.minute + 60_000 - now;
        throw new TrackingRequestError(429, "rate_limited", Math.max(1, Math.ceil(wait / 1000)));
      }
    }
    for (const key of keys) {
      const bucket = this.rates.get(key)!;
      bucket.minuteCount++; bucket.hourCount++;
    }
  }

  enterWork(userId: string) {
    if (this.active >= 4 || this.users.has(userId)) throw new TrackingRequestError(429, "busy", 10);
    this.active++; this.users.add(userId);
    let released = false;
    return () => { if (!released) { released = true; this.active--; this.users.delete(userId); } };
  }

  observePreference(sessionId: string, revision: number, allowed: boolean) {
    const now = this.now();
    for (const [key, value] of this.preferences) {
      if (value.expires <= now) { value.controller.abort(); this.preferences.delete(key); }
    }
    let entry = this.preferences.get(sessionId);
    if (!entry || !allowed || revision > entry.revision) {
      if (!entry && this.preferences.size >= 4096) throw new TrackingRequestError(503, "busy", 60);
      entry?.controller.abort();
      entry = {
        revision: Math.max(revision, entry?.revision ?? 0), allowed,
        expires: now + 3_600_000, controller: new AbortController(),
      };
      this.preferences.set(sessionId, entry);
    }
    const captured = entry;
    return {
      signal: captured.controller.signal,
      // A client-reported revision is an ordering hint, NOT evidence of consent.
      current: () => this.preferences.get(sessionId) === captured && captured.allowed &&
        captured.revision === revision && !captured.controller.signal.aborted,
    };
  }

  pause(provider: string, seconds: number) {
    this.cooldowns.set(provider, Math.max(this.cooldowns.get(provider) ?? 0, this.now() + seconds * 1000));
  }
  checkProvider(provider: string) {
    const seconds = Math.ceil(((this.cooldowns.get(provider) ?? 0) - this.now()) / 1000);
    if (seconds > 0) throw new TrackingRequestError(429, "provider_throttled", seconds);
  }
}

export const registrationLimits = new RegistrationLimits();

export function retryAfterSeconds(value: string | null, now = Date.now()): number {
  const seconds = value && /^\d+$/.test(value) ? Number(value) : value ? (Date.parse(value) - now) / 1000 : 30;
  return Math.min(3600, Math.max(1, Math.ceil(Number.isFinite(seconds) ? seconds : 30)));
}

/** Includes auth, body reads, Clerk calls, and delivery. Uncancellable SDK work
 * retains its concurrency slot until it settles; it cannot start follow-up work. */
export function executionBudget(external: AbortSignal, milliseconds = 12_000) {
  const controller = new AbortController();
  const cancel = () => controller.abort(new TrackingRequestError(409, "cancelled"));
  if (external.aborted) cancel(); else external.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new TrackingRequestError(504, "deadline", 30)), milliseconds);
  const pending = new Set<Promise<unknown>>();
  async function run<T>(operation: () => Promise<T>): Promise<T> {
    controller.signal.throwIfAborted();
    const task = Promise.resolve().then(() => { controller.signal.throwIfAborted(); return operation(); });
    pending.add(task);
    void task.then(() => pending.delete(task), () => pending.delete(task));
    let abort: () => void = () => {};
    try {
      return await Promise.race([task, new Promise<never>((_, reject) => {
        abort = () => reject(controller.signal.reason);
        controller.signal.addEventListener("abort", abort, { once: true });
        if (controller.signal.aborted) abort();
      })]);
    } finally { controller.signal.removeEventListener("abort", abort); }
  }
  return {
    signal: controller.signal, run,
    finish(release: () => void) {
      clearTimeout(timer); external.removeEventListener("abort", cancel);
      controller.abort(new TrackingRequestError(409, "finished"));
      void Promise.allSettled([...pending]).then(release);
    },
  };
}

export async function readSmallJson(request: Request, run: ReturnType<typeof executionBudget>["run"], maxBytes = 1024) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new TrackingRequestError(413, "body_too_large");
  }
  if (!request.body) throw new TrackingRequestError(400, "invalid");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, text = "";
  try {
    while (true) {
      const { done, value } = await run(() => reader.read());
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new TrackingRequestError(413, "body_too_large");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof TrackingRequestError) throw error;
    throw new TrackingRequestError(400, "invalid");
  } finally { void reader.cancel().catch(() => {}); }
}

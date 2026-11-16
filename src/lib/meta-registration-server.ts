import { createHmac } from "node:crypto";
import { isIP } from "node:net";

function validIp(value: string | undefined | null): string | undefined {
  const ip = value?.trim();
  // Reject lists, ports, zone identifiers, and malformed/untrusted values.
  return ip && !ip.includes("%") && isIP(ip) !== 0 ? ip : undefined;
}

/** Trust only Vercel's documented ingress metadata on a Vercel deployment.
 * Never use arbitrary forwarded chains or a request header claiming Vercel.
 * Behind another proxy, this may identify that proxy rather than the visitor.
 * https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for */
export function vercelClientIp(request: Request, onVercel: boolean): string | undefined {
  return onVercel ? validIp(request.headers.get("x-vercel-forwarded-for")) : undefined;
}

export const REGISTRATION_METADATA_KEY = "dropclarityMetaRegistrationV1";
export const REGISTRATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export type RegistrationRecord = {
  sessionId: string; eventId: string; registeredAt: number; sentAt?: number;
};
type Session = {
  id: string; userId: string; clientId: string; status: string;
  latestActivity?: { ipAddress?: string };
};
export type RegistrationDependencies = {
  getSession(id: string): Promise<Session>;
  getUser(id: string): Promise<{ createdAt: number; privateMetadata: Record<string, unknown> }>;
  getClient(id: string): Promise<{ signUpId: string | null }>;
  getSignUp(id: string): Promise<{
    status: string; createdUserId: string | null; createdSessionId: string | null;
  }>;
  saveRecord(userId: string, record: RegistrationRecord): Promise<unknown>;
  fetch: typeof fetch;
  pixelId: string; signingSecret: string; accessToken?: string; testEventCode?: string;
  now(): number;
  run?<T>(operation: () => Promise<T>): Promise<T>;
  signal?: AbortSignal;
  isConsentCurrent?(): boolean;
  diagnostic?(reason: "tracking_busy" | "missing_meta_access_token" | "missing_client_ip" |
    "missing_user_agent" | "meta_http_error" | "meta_invalid_ack", upstreamStatus?: number): void;
};
export type RegistrationRequest = {
  userId: string; sessionId: string; attemptId?: string;
  consent: boolean; privacyBlocked: boolean; userAgent: string; origin: string;
  // Populated by the server from Vercel ingress, NEVER from the JSON body.
  requestIp?: string;
};
export type RegistrationStatus = "ineligible" | "eligible" | "sent" | "retry";

// No waiting queue: reject excess work instead of accumulating promises.
const active = new Set<string>();
export async function processRegistration(
  input: RegistrationRequest, deps: RegistrationDependencies,
): Promise<RegistrationStatus> {
  const key = `${deps.pixelId}:${input.userId}`;
  if (active.has(key) || active.size >= 4) {
    deps.diagnostic?.("tracking_busy");
    return "retry";
  }
  active.add(key);
  try { return await verifyAndSend(input, deps); }
  finally { active.delete(key); }
}

async function verifyAndSend(
  input: RegistrationRequest, deps: RegistrationDependencies,
): Promise<RegistrationStatus> {
  const run = deps.run ?? (<T>(operation: () => Promise<T>) => operation());
  const session = await run(() => deps.getSession(input.sessionId));
  if (session.id !== input.sessionId || session.userId !== input.userId ||
      session.status !== "active") return "ineligible";
  const user = await run(() => deps.getUser(input.userId));
  const stored = user.privateMetadata[REGISTRATION_METADATA_KEY];
  let record: RegistrationRecord | undefined;
  if (stored && typeof stored === "object") {
    const candidate = stored as RegistrationRecord;
    if (typeof candidate.sessionId === "string" && typeof candidate.eventId === "string" &&
        candidate.registeredAt === user.createdAt) record = candidate;
  }
  if (!record) {
    // Backend attempts outlive the transient frontend completion fields.
    const client = await run(() => deps.getClient(session.clientId));
    const attempts = [...new Set([input.attemptId, client.signUpId].filter(
      (id): id is string => typeof id === "string" && /^sua_[a-zA-Z0-9]+$/.test(id),
    ))];
    for (const attemptId of attempts) {
      let signup;
      try { signup = await run(() => deps.getSignUp(attemptId)); }
      catch (error) {
        if ((error as { status?: number }).status === 404) continue;
        throw error;
      }
      if (signup.status !== "complete" || signup.createdUserId !== input.userId ||
          signup.createdSessionId !== input.sessionId) continue;
      record = {
        sessionId: input.sessionId,
        // Never disclose Clerk IDs as Meta event identifiers.
        eventId: createHmac("sha256", deps.signingSecret)
          .update(`dropclarity-registration-v1:${deps.pixelId}:${attemptId}`).digest("hex"),
        registeredAt: user.createdAt,
      };
      if (deps.now() - record.registeredAt >= REGISTRATION_WINDOW_MS) return "ineligible";
      await run(() => deps.saveRecord(input.userId, record!));
      break;
    }
  }
  if (!record || record.sessionId !== input.sessionId || record.registeredAt > deps.now() ||
      deps.now() - record.registeredAt >= REGISTRATION_WINDOW_MS) return "ineligible";
  if (record.sentAt) return "sent";
  if (!input.consent || input.privacyBlocked || deps.isConsentCurrent?.() === false) return "eligible";
  if (!deps.accessToken) { deps.diagnostic?.("missing_meta_access_token"); return "retry"; }
  const ip = validIp(session.latestActivity?.ipAddress) ?? validIp(input.requestIp);
  if (!ip) { deps.diagnostic?.("missing_client_ip"); return "retry"; }
  if (!input.userAgent) { deps.diagnostic?.("missing_user_agent"); return "retry"; }

  // Same dataset as PageView. No DOM access, profile matching, or business data.
  const response = await run(() => {
    deps.signal?.throwIfAborted();
    // Check again inside the actual dispatch operation, after any async work.
    if (deps.isConsentCurrent?.() === false) throw new Error("consent_withdrawn");
    return deps.fetch(`https://graph.facebook.com/v27.0/${deps.pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${deps.accessToken}` },
    body: JSON.stringify({
      data: [{
        event_name: "CompleteRegistration", event_time: Math.floor(record.registeredAt / 1000),
        event_id: record.eventId, action_source: "website",
        event_source_url: `${new URL(input.origin).origin}/`,
        user_data: { client_ip_address: ip, client_user_agent: input.userAgent },
      }],
      ...(deps.testEventCode ? { test_event_code: deps.testEventCode } : {}),
    }),
    signal: deps.signal ? AbortSignal.any([deps.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    });
  });
  if (!response.ok) {
    deps.diagnostic?.("meta_http_error", response.status);
    void response.body?.cancel().catch(() => {});
    return "retry";
  }
  const acknowledgement = await run(() => response.json());
  if (acknowledgement.events_received !== 1 || acknowledgement.error) {
    deps.diagnostic?.("meta_invalid_ack", response.status);
    return "retry";
  }
  // A lost acknowledgement/write is retried with the original event_id.
  await run(() => deps.saveRecord(input.userId, { ...record!, sentAt: deps.now() }));
  return "sent";
}

import { auth, clerkClient } from "@clerk/nextjs/server";
import { processRegistration, REGISTRATION_METADATA_KEY, vercelClientIp } from "@/lib/meta-registration-server";
import {
  executionBudget, readSmallJson, registrationLimits, retryAfterSeconds, TrackingRequestError,
} from "@/lib/meta-registration-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  let stage = "request";
  let reported = false;
  const diagnostic = (reason: string, upstreamStatus?: number) => {
    if (reported) return;
    reported = true;
    // Only fixed internal reason/stage labels and HTTP status numbers. Never
    // serialize errors, identifiers, headers, IPs, tokens, URLs, or payloads.
    try {
      console.warn("meta_registration_failure", {
        reason, stage,
        ...(Number.isInteger(upstreamStatus) && upstreamStatus! >= 100 && upstreamStatus! <= 599 ? { upstreamStatus } : {}),
      });
    } catch { /* Logging must not change tracking or app behavior. */ }
  };
  const respond = (status: string, code = 200, retryAfter = 0) => {
    if (code >= 400) diagnostic(status === "retry" ? "tracking_failed" : status);
    return Response.json({ status }, {
      status: code, headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
    });
  };
  if (request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return respond("forbidden", 403);
  let releasePreflight: (() => void) | undefined;
  let releaseWork: (() => void) | undefined;
  const budget = executionBudget(request.signal);
  try {
    releasePreflight = registrationLimits.enterPreflight();
    stage = "authentication";
    const { userId, sessionId } = await budget.run(() => auth());
    if (!userId || !sessionId) return respond("unauthorized", 401);
    stage = "request_body";
    const body = await readSmallJson(request, budget.run) as {
      marketingConsent?: unknown; consentRevision?: unknown; attemptId?: unknown;
    } | null;
    if (!body || typeof body !== "object" || typeof body.marketingConsent !== "boolean" ||
        !Number.isSafeInteger(body.consentRevision) || (body.consentRevision as number) < 0 ||
        (body.consentRevision as number) > Date.now() + 60_000 ||
        (body.attemptId !== undefined &&
          (typeof body.attemptId !== "string" || !/^sua_[a-zA-Z0-9]{1,100}$/.test(body.attemptId)))) {
      return respond("invalid", 400);
    }
    const privacyBlocked = request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1";
    const allowed = body.marketingConsent && !privacyBlocked;
    // Process withdrawal BEFORE rate/concurrency/provider checks. Within this
    // instance it invalidates older pending grants, even under overload.
    stage = "request_limits";
    const preference = registrationLimits.observePreference(sessionId, body.consentRevision as number, allowed);
    registrationLimits.checkRate(userId, sessionId);
    registrationLimits.checkProvider("clerk");
    if (allowed) registrationLimits.checkProvider("meta");
    releaseWork = registrationLimits.enterWork(userId);
    stage = "configuration";
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
    const signingSecret = process.env.META_EVENT_SIGNING_SECRET;
    if (!/^\d+$/.test(pixelId)) { diagnostic("invalid_pixel_id"); return respond("retry", 503, 60); }
    if (!signingSecret || signingSecret.length < 32) { diagnostic("invalid_signing_secret"); return respond("retry", 503, 60); }
    stage = "clerk_client_setup";
    const clerk = await budget.run(() => clerkClient());
    const status = await processRegistration({
      userId, sessionId, attemptId: body.attemptId as string | undefined,
      consent: allowed, privacyBlocked,
      userAgent: (request.headers.get("user-agent") ?? "").slice(0, 512), origin: new URL(request.url).origin,
      requestIp: vercelClientIp(request, process.env.VERCEL === "1"),
    }, {
      getSession: id => { stage = "clerk_session"; return clerk.sessions.getSession(id); },
      getUser: id => { stage = "clerk_user"; return clerk.users.getUser(id); },
      getClient: id => { stage = "clerk_client"; return clerk.clients.getClient(id); },
      getSignUp: id => { stage = "clerk_signup"; return clerk.signUps.get(id); },
      saveRecord: (id, record) => {
        stage = "clerk_metadata";
        return clerk.users.updateUserMetadata(id, { privateMetadata: { [REGISTRATION_METADATA_KEY]: record } });
      },
      diagnostic,
      run: budget.run,
      signal: allowed ? AbortSignal.any([budget.signal, preference.signal]) : budget.signal,
      isConsentCurrent: () => !request.signal.aborted && preference.current(),
      fetch: async (url, options) => {
        stage = "meta_delivery";
        registrationLimits.checkProvider("meta");
        const response = await fetch(url, options);
        if (response.status === 429 || response.status >= 500) {
          diagnostic("meta_provider_error", response.status);
          const seconds = response.status === 429 ? retryAfterSeconds(response.headers.get("retry-after")) : 30;
          registrationLimits.pause("meta", seconds);
          void response.body?.cancel().catch(() => {});
          throw new TrackingRequestError(response.status === 429 ? 429 : 503, "provider_throttled", seconds);
        }
        return response;
      },
      pixelId, signingSecret, accessToken: process.env.META_CONVERSIONS_API_ACCESS_TOKEN,
      testEventCode: process.env.META_TEST_EVENT_CODE, now: Date.now,
    });
    return respond(status, status === "retry" ? 503 : 200, status === "retry" ? 30 : 0);
  } catch (error) {
    if (error instanceof TrackingRequestError) return respond(error.code, error.status, error.retryAfter);
    const provider = error as { status?: number; statusCode?: number; retryAfter?: number };
    if (provider?.status === 429 || provider?.statusCode === 429) {
      const seconds = Math.ceil(Math.min(3600, Math.max(30, Number(provider.retryAfter) || 30)));
      registrationLimits.pause("clerk", seconds);
      return respond("provider_throttled", 429, seconds);
    }
    diagnostic("tracking_failed", provider?.status ?? provider?.statusCode);
    return respond("retry", 503, 30);
  } finally {
    budget.finish(() => { releaseWork?.(); releasePreflight?.(); });
  }
}

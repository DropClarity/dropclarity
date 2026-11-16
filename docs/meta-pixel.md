# Meta registration tracking

PageView continues to use the existing consent-gated image pixel unchanged.
CompleteRegistration uses Meta's supported Conversions API and the SAME dataset
ID. No Meta JavaScript SDK, second pixel, database, webhook, or Cloudflare worker
change is introduced. Authentication UI, signup redirects, billing, uploads,
analysis and PostHog are unchanged.

## Verification and persistence

The earliest useful correlation point is creation of a Clerk signup attempt,
BEFORE it completes. The root initializer uses Clerk Core 3's reactive useSignUp
signal to retain only its opaque attempt ID in sessionStorage (maximum seven
days). It does not require frontend status/createdUserId/createdSessionId to
survive navigation. This minimal authentication correlation reference may be
retained before marketing consent; it contains no profile or business data.

Once Clerk reports an active authenticated session, the browser calls the
same-origin /api/meta-registration endpoint. Clerk Backend API retrieves the
persisted signup attempt and verifies its completed state, createdUserId AND
createdSessionId against authenticated auth() values. It also tries the backend
client's associated signUpId if browser storage is unavailable or lost. A recent
account creation timestamp alone NEVER establishes eligibility. If neither
reference can be recovered, the endpoint fails closed rather than count a login.

Verified eligibility is retained in the namespaced Clerk private metadata field
`dropclarityMetaRegistrationV1`, using the same metadata mechanism already used
for billing. The update merges this field without replacing billing metadata.
It contains only the original session ID, opaque event ID, registration time,
and (after acknowledgement) delivery time. This survives page refreshes and
redirects. No signup webhook or new persistent database is required.

Consent received later can send the event during the ORIGINAL signup session,
within Meta's seven-day event-time limit. A subsequent sign-in session cannot
qualify. Clearing browser storage cannot create a duplicate once Clerk stores
the delivery marker. Retain that marker for the account lifetime to prevent
replays; browser attempt references are removed after server verification.

## Consent and privacy

The banner appearance, footer preference control, and PageView behavior are
unchanged. PageView is off until explicit marketing acceptance. Registration
verification may run without consent, but NO request to Meta occurs until the
browser grants consent. The endpoint also enforces request GPC/DNT headers.
Rejection/withdrawal blocks new marketing requests from the normal browser flow.
Pending browser requests are aborted, including on cross-tab storage changes.
The browser also reports an increasing preference revision with its choice.
This is a CLIENT-REPORTED ordering hint, NOT server-verifiable proof of consent.
The endpoint rejects stale revisions and invalidates pending grants on withdrawal
within the SAME running instance, before rate/concurrency checks when reached.
It rechecks the gate and cancellation immediately before Meta dispatch and
passes cancellation through to the outbound fetch.

These controls cannot guarantee cross-instance revocation: a withdrawal may hit
one Vercel instance while pending delivery runs on another; ingress disconnects
may not propagate, and requests can be reordered. Process-local gates expire
after one hour or disappear on instance restart. Forged first-party requests can
still assert consent. Already-dispatched events cannot be recalled.

Clerk private metadata supports deep merge, not an atomic compare-and-dispatch
or shared lock. Storing a boolean there would NOT solve the race safely, so no
supposedly authoritative consent record has been added. Strict enforcement needs
a shared coordinator (e.g. a Cloudflare Durable Object keyed by consent scope)
that orders grant/revoke/dispatch and supplies global limits. That infrastructure
is not configured in this repository and was not introduced. If strict shared
revocation is a deployment requirement, keep CAPI disabled until it is available.
PostHog continues independently as disclosed in the policy.

Registration uses no image request. The server sends only CompleteRegistration,
the original registration time, an HMAC-derived opaque event ID, the site origin
with `/`, and IP/user-agent network metadata. The IP is UNHASHED and comes from
the verified Clerk session, not an untrusted forwarded-IP header. User-Agent is
UNHASHED (limited to 512 characters). These are personal/pseudonymous network
identifiers, not anonymous data. No names, email, raw Clerk
identifiers, external_id, cookies, filenames, uploaded content, customer/job
information, financial data, referrer, URL queries or DOM content are sent.
No advanced matching or automatic event collection is enabled.

## Delivery and duplicate prevention

The server writes `sentAt` ONLY after Meta returns an HTTP success AND
`events_received: 1` without an error. Failed/blocked/malformed responses and
missing configuration remain retryable. Requests time out, and the browser
retries briefly, on navigation, on connectivity recovery, or on refresh.
There is no background marketing queue that bypasses browser consent.

A stable event_id is persisted BEFORE delivery, retained on every retry and
used with Meta's deduplication. Concurrent requests in one instance are rejected
rather than queued, with Retry-After;
Clerk private metadata prevents normal repeat sends across instances/reloads.
Concurrent instances or a lost acknowledgement can produce repeated HTTP
attempts with the SAME event ID. This is normal-operation exactly-once counting,
not an impossible guarantee of exactly-once distributed network delivery.
Meta's deduplication window is finite: an outage after Meta accepts an event but
before Clerk records sentAt can leave an uncertain outcome, especially if a
retry happens outside that window. No compare-and-swap database is introduced.

## Abuse protection and deadlines

All limits below are IN-MEMORY, per running Vercel instance, and reset on cold
start. They are not account-wide or globally distributed protections:

- Each user: 16 requests/minute and 64/hour across sessions.
- Each session: 10 requests/minute and 40/hour.
- At most four tracking operations, at most one per user; NO waiting queue.
- At most 16 preflight requests (including authentication and body parsing).
- Rate and consent maps are capped at 4096 entries each; full maps fail closed.
- JSON is read as a stream with a 1024-BYTE limit, including chunked bodies.
  Oversized Content-Length is rejected before reading. Invalid UTF-8 is rejected.
- The whole request has a 12-second budget, including auth, body reading, Clerk
  calls, and Meta response reading. Vercel maxDuration is 15 seconds. Deadline
  expiry returns 504 and prevents subsequent steps/dispatch. Meta fetch also
  has a 10-second timeout and obeys cancellation.
- The Clerk SDK cannot forcibly cancel every in-flight request. Timed-out work
  retains its concurrency/preflight slot until those calls settle, preventing
  abandoned calls from accumulating. It cannot start follow-up tracking work.
- Meta 429/5xx and Clerk 429 responses create per-instance cooldowns. Retry-After
  is bounded to one hour; browser retries honor it. Limits return 429/503 with
  Retry-After, without blocking authentication or changing account access.

Multi-instance abuse can still consume shared Clerk/hosting quotas. Use existing
Vercel/Cloudflare edge controls if configured; this code does not provision them
or claim they exist. A global limit needs the shared coordinator described above.

## Configuration before enabling registration delivery

Keep the existing `NEXT_PUBLIC_META_PIXEL_ID` in Vercel -> DropClarity project ->
Settings -> Environment Variables. It is the same numeric Pixel/Dataset ID for
PageView and registration. Do not change it or install another pixel.

Add **server-only** `META_CONVERSIONS_API_ACCESS_TOKEN` using a token generated
for that dataset in Meta Events Manager's Conversions API setup. Never prefix
this variable with NEXT_PUBLIC_, put it in source code, or expose it to browsers.
Existing `CLERK_SECRET_KEY` is also required (already used by app routes).
Add **server-only** `META_EVENT_SIGNING_SECRET`: at least 32 characters of
cryptographically random secret material. It is mandatory; there is no fallback
to the Clerk authentication secret. Keep it stable across instances/redeploys.
It HMACs a namespaced dataset/signup-attempt reference to produce the event ID.
Existing persisted IDs are reused even if the secret rotates, so retries do not
change IDs. Avoid rotation during concurrent first-time eligibility writes.
No Cloudflare Worker bindings, new Clerk webhook settings or packages were added.
If the Meta token is absent, PageView still works and verified registrations stay
pending rather than being marked sent. Only deploy after approval.

For local testing, put these settings in ignored `.env.local`, restart Next.js,
and optionally set server-only `META_TEST_EVENT_CODE` from Events Manager's
Test Events tab. The optional test code applies ONLY to server registration
requests. Remove it after testing (Meta says test-code events may still be used
for measurement). Browser PageView uses the normal browser Test Events workflow.

## Validation

Run `node scripts/test-meta-pixel.mjs`, `npx.cmd tsc --noEmit`, `npm.cmd run lint`,
and `npm.cmd run build`. Tests mock Clerk and Meta; they do not create real
accounts, send live conversions, or prove receipt in Events Manager.

Before deployment, run the app locally with a test Clerk instance, the matching
Meta dataset/token and test code, then:

1. Reject marketing, create a NEW account and complete verification/tasks.
   Expect /api/meta-registration to return eligible, with no request to Meta.
2. Accept marketing after arriving on the destination page or after refresh.
   Expect the endpoint to return sent, then one server CompleteRegistration in
   Events Manager. Verify PageView remains a separate browser event.
3. Refresh/navigate and sign out/in: no additional registration. Test an older
   account, incomplete signup, pending Clerk tasks, GPC and DNT: no conversion.
4. Temporarily use an invalid Meta token locally: endpoint returns retry/503,
   no sentAt is stored, and fixing the token plus refreshing retries safely.
5. Test email verification, all enabled OAuth methods, sign-in-to-sign-up
   transfers, and hard redirects. Confirm the reactive attempt ID OR backend
   client association is available. No account data should appear in payloads.

A server 503 can mean missing configuration, Clerk lookup failure, unavailable
session IP, Meta rejection, timeout or a metadata write failure. Responses do
not expose tokens or customer data. Use provider dashboards and the local mocks
for investigation; do not enable payload logging in production.

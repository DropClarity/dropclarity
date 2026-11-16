# Meta Pixel setup

No deployment has been performed. No changes to PostHog, Clerk UI/redirects,
billing, uploads, or analysis are required by this integration.

## Configuration

In Vercel, open the **DropClarity project → Settings → Environment Variables**.
Add `NEXT_PUBLIC_META_PIXEL_ID` with the numeric Pixel/Dataset ID from Meta
Events Manager (not an access token). Select **Production**. For testing, use a
separate test pixel in **Preview** and/or **Development**. Save the variable.
Next.js embeds public variables at build time: a new build/deployment is required
after setting or changing it. Deploy only after approval.

For local testing add `NEXT_PUBLIC_META_PIXEL_ID=YOUR_NUMERIC_ID` to `.env.local`
and restart the dev server. Missing/invalid IDs disable tracking.

## Built-in marketing consent

The site includes a compact responsive banner with equally styled Accept
marketing and Reject marketing buttons. Meta defaults to OFF until explicit
acceptance. The choice persists in this browser; Cookie preferences in the footer
reopens the controls for review or withdrawal. No external consent manager is
required for these Meta controls. PostHog and other existing analytics are
unchanged and are explicitly outside this marketing choice.

The banner calls `setMarketingConsent(true)` / `setMarketingConsent(false)` from
`src/lib/meta-pixel.ts`. GPC and DNT override acceptance. If saving fails, tracking
stays off even if a previous grant was saved. The banner explains unavailable
storage and browser privacy overrides. A rejection clears the pending signup
receipt; registration deduplication markers remain to prevent repeat conversion.

If replacing this banner with an external consent manager, save `granted` or `denied` to localStorage key
`dropclarity_marketing_consent`, then dispatch
`window.dispatchEvent(new Event('dropclarity:marketing-consent-changed'))`.
Initialize this choice from the manager's saved state on each page load; propagate
withdrawal through the same interface. Global Privacy Control and Do Not Track
override a grant. Storage failures keep tracking disabled.

For a consenting developer's local test only, the browser console equivalent is:

```js
localStorage.setItem('dropclarity_marketing_consent', 'granted');
window.dispatchEvent(new Event('dropclarity:marketing-consent-changed'));
```

Replace `granted` with `denied` and dispatch again to test withdrawal. This is a
manual test procedure; normal visitors should use the banner. Events that
already reached Meta cannot be withdrawn by this code.

## Transport and privacy

The integration uses Meta's documented IMG pixel transport, appended to the DOM
at runtime. It does not load `fbevents.js`, perform automatic event detection,
read forms, or enable advanced matching. It sends only the Pixel ID, standard
event name, a sanitized URL, empty referrer, timestamp, and random event ID.
HTTP referrers are suppressed per image. Only fixed application routes are
allowed in the URL; unknown paths map to `/`. Queries and hashes are never sent.
No Clerk IDs, email, names, filenames, job/customer data, prices, or upload
contents are sent. Meta still receives browser network metadata such as IP and
user agent, and may receive its own cookies subject to browser controls.

This intentionally trades SDK features, first-party `_fbp`/`_fbc` cookies and
click-ID attribution for isolation from customer data. No Meta script can read
the application's DOM. Image transport has limitations compared with Meta's
recommended SDK; confirm receipt in Events Manager, especially iOS in-app
browsers. See https://developers.facebook.com/documentation/meta-pixel/advanced.

## Event rules

- PageView: initial consented load and each pathname navigation, including Back
  and Forward. Query/hash-only changes do not create events. Consent granted
  later sends the current page only; declined visits are not replayed.
- CompleteRegistration: requires Clerk's `signUp.status === 'complete'`,
  `createdUserId`, and `createdSessionId` matching the active signed-in user and
  session. A short-lived receipt survives redirect/reload in this tab. Both the
  user and session must be under 30 minutes old; age alone never proves signup.
  Receipts are stored only with marketing consent. A grant within this window
  may send the registration if Clerk's completed attempt is still available.
  Incomplete/failed
  attempts, existing-account sign-ins, and older returning users do not qualify.
- Registration attempts are claimed in localStorage per pixel/user before
  sending, with an in-memory guard and Web Lock for concurrent tabs where
  supported. Clerk IDs stay local. Storage failures suppress conversion.
  Blocked/failed requests are not retried. This is at-most-once browser tracking,
  not guaranteed delivery or global deduplication across cleared storage/devices.
  Signup state lost by Clerk before it can be observed suppresses conversion;
  there is no unsafe age-based fallback or server-side Conversions API.

## Test before launch

1. In Meta Events Manager choose the matching dataset/pixel, open **Test events**,
   and use the browser website test option to open your local or approved preview
   URL. Use a fresh browser profile with tracking blockers disabled for the test.
2. Before granting marketing consent, verify DevTools Network has no requests to
   `facebook.com/tr`. Grant test consent: expect exactly one PageView. Navigate
   through site links and Back/Forward: one PageView per pathname transition.
   Reload: one new PageView. Confirm events appear in Test events.
3. Create a genuinely NEW Clerk test account (test email and each enabled OAuth
   method). Complete verification and required session tasks. Expect exactly one
   CompleteRegistration after the session becomes active. Refresh and navigate:
   no additional registration. Sign out/in with that account and with an older
   account: no registration. Abandon/fail signup: no registration.
4. Reject/revoke consent: no further Meta requests on navigation or signup.
   Repeat with GPC/DNT enabled. Verify grant after refusal sends only current
   PageView, not browsing history.
5. Inspect each `tr` request: `dl` has only origin and a fixed route, `dr` is empty,
   no Referer header, and no customer information or query/hash values. Test a
   dashboard URL containing synthetic private query values and an unknown path.
6. Review Meta Diagnostics after testing. Image pixels may not be reported by
   browser helpers the same way as the full JS SDK; network requests plus Events
   Manager receipt are the decisive checks.

Automated local checks: `node scripts/test-meta-pixel.mjs`, `npx.cmd tsc --noEmit`,
and `npx.cmd eslint src/components/MetaPixelInitializer.tsx src/lib/meta-pixel.ts`.

Privacy/cookie disclosures are included in `/privacy-policy#cookies`. Before
launch, review the disclosures for your business. These controls cover Meta;
they do not make a broader compliance determination about existing analytics.
In Events Manager keep
automatic advanced matching and automatic events disabled; do not install a
second pixel via GTM, Vercel, or Meta's event setup tool. Associate the dataset
with the correct ad account, verify domain ownership if requested by Meta, and
select CompleteRegistration as the campaign's conversion event. Conversions API
is optional and is not installed by this change. No access token or Clerk
webhook is required for this browser-only integration.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import { isIP } from 'node:net';
import { test } from 'node:test';
import ts from 'typescript';

function load(file, globals = {}, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: k => { if (k in imports) return imports[k]; throw Error(`Unexpected import: ${k}`); },
    Date, Map, Set, URL, URLSearchParams, AbortSignal, AbortController,
    TextDecoder, setTimeout, clearTimeout, ...globals,
  });
  return exports;
}
function storage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}
const serviceImports = { 'node:crypto': crypto, 'node:net': { isIP } };
const service = load('src/lib/meta-registration-server.ts', {}, serviceImports);
function fixture() {
  const now = Date.now();
  const metadata = { stripeCustomerId: 'unrelated-billing-value' };
  const calls = [];
  const session = { id: 'session_first', userId: 'user_new', clientId: 'client_one', status: 'active', latestActivity: { ipAddress: '192.0.2.1' } };
  const signup = { status: 'complete', createdUserId: session.userId, createdSessionId: session.id };
  const input = { userId: session.userId, sessionId: session.id, attemptId: 'sua_new', consent: true, privacyBlocked: false, userAgent: 'Test Browser', origin: 'https://www.dropclarity.com/private?job=secret' };
  let proofReads = 0;
  const deps = {
    getSession: async () => session,
    getUser: async () => ({ createdAt: now - 1000, privateMetadata: metadata }),
    getClient: async () => ({ signUpId: 'sua_new' }),
    getSignUp: async id => { proofReads++; if (id !== 'sua_new') throw Object.assign(Error('Unknown'), { status: 404 }); return signup; },
    saveRecord: async (_, record) => { metadata[service.REGISTRATION_METADATA_KEY] = structuredClone(record); },
    fetch: async (url, options) => {
      assert.equal(metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined, 'no marker before acknowledgement');
      calls.push({ url, options, payload: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ events_received: 1 }) };
    },
    now: () => now, pixelId: '123456789', signingSecret: 'test-signing-secret', accessToken: 'test-token',
  };
  return { input, deps, metadata, session, signup, calls, proofReads: () => proofReads };
}

test('new registration uses durable server proof, minimal CAPI payload and preserves billing metadata', async () => {
  const f = fixture();
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
  const payload = f.calls[0].payload;
  const event = payload.data[0];
  assert.equal(event.event_name, 'CompleteRegistration');
  assert.equal(event.event_source_url, 'https://www.dropclarity.com/');
  assert.equal(event.action_source, 'website');
  assert.match(event.event_id, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(event.user_data).sort(), ['client_ip_address', 'client_user_agent']);
  assert.equal(JSON.stringify(payload).includes('user_new'), false);
  assert.equal(JSON.stringify(payload).includes('session_first'), false);
  assert.equal(JSON.stringify(payload).includes('secret'), false);
  assert.equal(f.metadata.stripeCustomerId, 'unrelated-billing-value');
  assert.ok(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt);
});

test('refreshes, later visits, and concurrent requests do not resend an accepted registration', async () => {
  const f = fixture();
  await Promise.all([1, 2, 3].map(() => service.processRegistration(f.input, f.deps)));
  await service.processRegistration(f.input, f.deps);
  const reloadedService = load('src/lib/meta-registration-server.ts', {}, serviceImports);
  await reloadedService.processRegistration(f.input, f.deps);
  assert.equal(f.calls.length, 1);
});

test('ordinary sign-in, another user, pending tasks, and incomplete signup cannot convert', async () => {
  for (const change of [
    f => { f.input.sessionId = f.session.id = 'session_second'; },
    f => { f.signup.createdUserId = 'different_user'; },
    f => { f.session.status = 'pending'; },
    f => { f.signup.status = 'missing_requirements'; },
    f => { f.input.attemptId = undefined; f.deps.getClient = async () => ({ signUpId: null }); },
  ]) {
    const f = fixture(); change(f);
    assert.equal(await service.processRegistration(f.input, f.deps), 'ineligible');
    assert.equal(f.calls.length, 0);
  }
});

test('backend client association recovers signup when frontend completion fields disappeared', async () => {
  const f = fixture();
  delete f.input.attemptId;
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
});

test('consent granted after signup and redirect recovers private metadata without transient signup', async () => {
  const f = fixture();
  f.input.consent = false;
  assert.equal(await service.processRegistration(f.input, f.deps), 'eligible');
  assert.equal(f.calls.length, 0);
  assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
  delete f.input.attemptId;
  f.deps.getClient = async () => { throw Error('Transient client state gone'); };
  f.deps.getSignUp = async () => { throw Error('Transient signup state gone'); };
  f.input.consent = true;
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
  assert.equal(f.calls.length, 1);
});

test('privacy signals override consent; later sign-in cannot consume original eligibility', async () => {
  const f = fixture();
  f.input.privacyBlocked = true;
  assert.equal(await service.processRegistration(f.input, f.deps), 'eligible');
  assert.equal(f.calls.length, 0);
  f.input.privacyBlocked = false;
  f.input.sessionId = f.session.id = 'session_new_login';
  assert.equal(await service.processRegistration(f.input, f.deps), 'ineligible');
  assert.equal(f.calls.length, 0);
});

test('failed HTTP, invalid acknowledgements, and missing token never set sentAt and can retry', async () => {
  for (const result of [
    { ok: false, json: async () => ({ error: 'rejected' }) },
    { ok: true, json: async () => ({ events_received: 0 }) },
    { ok: true, json: async () => ({ events_received: 1, error: 'invalid' }) },
  ]) {
    const f = fixture();
    const originalFetch = f.deps.fetch;
    f.deps.fetch = async () => result;
    assert.equal(await service.processRegistration(f.input, f.deps), 'retry');
    const eventId = f.metadata[service.REGISTRATION_METADATA_KEY].eventId;
    assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
    f.deps.fetch = originalFetch;
    assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
    assert.equal(f.calls[0].payload.data[0].event_id, eventId);
  }
  const f = fixture(); delete f.deps.accessToken;
  assert.equal(await service.processRegistration(f.input, f.deps), 'retry');
  assert.equal(f.calls.length, 0);
});

test('network failure and lost metadata acknowledgement retain stable retry ID', async () => {
  const f = fixture();
  const fetch = f.deps.fetch;
  f.deps.fetch = async () => { throw Error('Network unavailable'); };
  await assert.rejects(service.processRegistration(f.input, f.deps));
  const id = f.metadata[service.REGISTRATION_METADATA_KEY].eventId;
  assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
  f.deps.fetch = fetch;
  const save = f.deps.saveRecord;
  f.deps.saveRecord = async (_, record) => { if (record.sentAt) throw Error('Clerk unavailable'); return save(_, record); };
  await assert.rejects(service.processRegistration(f.input, f.deps));
  f.deps.saveRecord = save;
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
  assert.equal(f.calls[0].payload.data[0].event_id, id);
  assert.equal(f.calls[1].payload.data[0].event_id, id);
});

test('Meta seven-day limit is enforced and test code remains optional and server-side', async () => {
  const f = fixture(); f.deps.testEventCode = 'TEST123';
  await service.processRegistration(f.input, f.deps);
  assert.equal(f.calls[0].payload.test_event_code, 'TEST123');
  const old = fixture(); old.deps.now = () => Date.now() + service.REGISTRATION_WINDOW_MS;
  assert.equal(await service.processRegistration(old.input, old.deps), 'ineligible');
  assert.equal(old.calls.length, 0);
});

function browser() {
  const listeners = new Map();
  const images = [];
  const globals = {
    Event, crypto: crypto.webcrypto, localStorage: storage(), sessionStorage: storage(),
    navigator: { doNotTrack: '0' },
    window: {
      location: { origin: 'https://www.dropclarity.com' },
      addEventListener: (k, fn) => { if (!listeners.has(k)) listeners.set(k, new Set()); listeners.get(k).add(fn); },
      removeEventListener: (k, fn) => listeners.get(k)?.delete(fn),
      dispatchEvent: e => { for (const fn of listeners.get(e.type) ?? []) fn(); },
    },
    document: { createElement: () => ({ style: {}, remove() {} }), body: { appendChild: image => images.push(image) } },
    process: { env: { NEXT_PUBLIC_META_PIXEL_ID: '123456789' } },
  };
  return { globals, images };
}

test('PageView, consent, GPC/DNT, storage failure and URL privacy are unchanged', () => {
  const { globals, images } = browser();
  const lib = load('src/lib/meta-pixel.ts', globals);
  assert.equal(lib.sendMetaEvent('123', 'PageView', '/'), false);
  lib.setMarketingConsent(true);
  for (const flag of ['globalPrivacyControl', 'doNotTrack']) {
    globals.navigator[flag] = flag === 'doNotTrack' ? '1' : true;
    assert.equal(lib.sendMetaEvent('123', 'PageView', '/'), false);
    globals.navigator[flag] = flag === 'doNotTrack' ? '0' : false;
  }
  assert.equal(lib.sendMetaEvent('123', 'PageView', '/jobs/customer?file=private'), true);
  const request = new URL(images[0].src);
  assert.equal(request.searchParams.get('dl'), 'https://www.dropclarity.com/');
  assert.equal(request.searchParams.get('dr'), '');
  assert.equal(images[0].referrerPolicy, 'no-referrer');
  globals.localStorage.setItem = () => { throw Error('Blocked'); };
  assert.equal(lib.setMarketingConsent(false), false);
  assert.equal(lib.hasMarketingConsent(), false);
});

test('opaque attempt survives redirects/refresh; no profile data or invalid IDs are retained', () => {
  const { globals } = browser();
  const lib = load('src/lib/meta-registration-client.ts', globals);
  lib.rememberSignupAttempt('email@example.com');
  assert.equal(lib.readSignupAttempt(), undefined);
  lib.rememberSignupAttempt('sua_valid');
  const reloaded = load('src/lib/meta-registration-client.ts', globals);
  assert.equal(reloaded.readSignupAttempt(), 'sua_valid');
  reloaded.forgetSignupAttempt();
  assert.equal(lib.readSignupAttempt(), undefined);
  globals.sessionStorage.getItem = () => { throw Error('Blocked'); };
  assert.equal(lib.readSignupAttempt(), undefined);
});

test('initializer preserves navigation PageViews and verifies signup without sending marketing before consent', async () => {
  const { globals, images } = browser();
  const calls = [];
  const lib = load('src/lib/meta-pixel.ts', globals);
  const attempts = load('src/lib/meta-registration-client.ts', globals);
  let effects = [], cleanups = [], path = '/', signupId = 'sua_new';
  const clerk = { session: null };
  let auth = {};
  const timers = [];
  const imports = {
    react: { useEffect: fn => effects.push(fn) },
    '@clerk/nextjs': { useClerk: () => clerk, useAuth: () => auth, useSignUp: () => ({ signUp: { id: signupId } }) },
    'next/navigation': { usePathname: () => path },
    '@/lib/meta-pixel': lib, '@/lib/meta-registration-client': attempts,
  };
  const component = load('src/components/MetaPixelInitializer.tsx', {
    ...globals, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {},
    fetch: async (_, options) => { calls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ status: calls.at(-1).marketingConsent ? 'sent' : 'eligible' }) }; },
  }, imports);
  async function render() {
    cleanups.forEach(fn => fn?.()); effects = [];
    component.default(); cleanups = effects.map(fn => fn());
    await new Promise(resolve => setImmediate(resolve));
  }
  await render();
  assert.equal(calls.length, 0);
  assert.equal(attempts.readSignupAttempt(), 'sua_new');
  signupId = undefined; path = '/pricing';
  auth = { userId: 'user_new', sessionId: 'session_first' };
  clerk.session = { id: 'session_first', status: 'active' };
  await render();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].attemptId, 'sua_new');
  assert.equal(calls[0].marketingConsent, false);
  assert.equal(images.length, 0);
  lib.setMarketingConsent(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 2);
  assert.equal(calls[1].marketingConsent, true);
  assert.equal(images.length, 1);
  await render();
  assert.equal(calls.length, 2, 'effect replay cannot duplicate registration');
  assert.equal(images.length, 1);
  path = '/dashboard'; await render();
  assert.equal(images.length, 2);
  lib.setMarketingConsent(false);
  path = '/app'; await render();
  assert.equal(images.length, 2);
  lib.setMarketingConsent(true);
  assert.equal(images.length, 3);
  cleanups.forEach(fn => fn?.());
});

test('route rejects cross-origin/unauthenticated requests and enforces privacy headers', async () => {
  let authResult = {}, captured;
  const fakeClerk = { sessions: {}, users: {}, clients: {}, signUps: {} };
  const route = load('src/app/api/meta-registration/route.ts', {
    Request, Response, process: { env: { NEXT_PUBLIC_META_PIXEL_ID: '123', META_EVENT_SIGNING_SECRET: 'x'.repeat(32) } }, fetch: async () => {},
  }, {
    '@clerk/nextjs/server': { auth: async () => authResult, clerkClient: async () => fakeClerk },
    '@/lib/meta-registration-server': { ...service, processRegistration: async input => { captured = input; return 'eligible'; } },
    '@/lib/meta-registration-security': load('src/lib/meta-registration-security.ts'),
  });
  function request(origin, body = { marketingConsent: true, consentRevision: 0 }, extra = {}) {
    return new Request('https://www.dropclarity.com/api/meta-registration', {
      method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body),
    });
  }
  assert.equal((await route.POST(request('https://evil.example'))).status, 403);
  assert.equal((await route.POST(request('https://www.dropclarity.com'))).status, 401);
  authResult = { userId: 'user_new', sessionId: 'session_first' };
  assert.equal((await route.POST(request('https://www.dropclarity.com', { marketingConsent: true, attemptId: 'bad' }))).status, 400);
  for (const header of ['sec-gpc', 'dnt']) {
    const response = await route.POST(request('https://www.dropclarity.com', { marketingConsent: true, consentRevision: 0 }, { [header]: '1' }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(captured.privacyBlocked, true);
  }
});

test('initializer honors Retry-After and retries a failed request instead of treating it as delivered', async () => {
  const { globals } = browser();
  const lib = load('src/lib/meta-pixel.ts', globals);
  lib.setMarketingConsent(true);
  const attempts = load('src/lib/meta-registration-client.ts', globals);
  const effects = [], timers = [];
  let calls = 0;
  const component = load('src/components/MetaPixelInitializer.tsx', {
    ...globals,
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimeout: () => {},
    fetch: async () => {
      calls++;
      if (calls === 1) return { ok: false, headers: new Headers({ 'Retry-After': '120' }) };
      return { ok: true, json: async () => ({ status: 'sent' }) };
    },
  }, {
    react: { useEffect: fn => effects.push(fn) },
    '@clerk/nextjs': {
      useClerk: () => ({ session: { id: 'session_first', status: 'active' } }),
      useAuth: () => ({ userId: 'user_new', sessionId: 'session_first' }),
      useSignUp: () => ({ signUp: { id: 'sua_new' } }),
    },
    'next/navigation': { usePathname: () => '/dashboard' },
    '@/lib/meta-pixel': lib, '@/lib/meta-registration-client': attempts,
  });
  component.default();
  const cleanups = effects.map(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(attempts.readSignupAttempt(), 'sua_new', 'failed request must retain correlation');
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 120_000);
  timers.shift().fn();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  assert.equal(attempts.readSignupAttempt(), undefined);
  globals.window.dispatchEvent(new Event(lib.META_CONSENT_EVENT));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2, 'acknowledged request must not resend');
  cleanups.forEach(fn => fn?.());
});

const security = load('src/lib/meta-registration-security.ts');

test('rate limits cover user across sessions and individual sessions; concurrency never queues', () => {
  let now = 0;
  const limits = new security.RegistrationLimits(() => now);
  for (let i = 0; i < 16; i++) limits.checkRate('one-user', `session-${i}`);
  assert.throws(() => limits.checkRate('one-user', 'another-session'), e => e.status === 429 && e.retryAfter > 0);
  now = 60_001;
  limits.checkRate('one-user', 'another-session');
  const sessionLimits = new security.RegistrationLimits();
  for (let i = 0; i < 10; i++) sessionLimits.checkRate(`user-${i}`, 'one-session');
  assert.throws(() => sessionLimits.checkRate('different-user', 'one-session'), e => e.status === 429);
  const release = limits.enterWork('u1');
  assert.throws(() => limits.enterWork('u1'), e => e.status === 429);
  const others = ['u2', 'u3', 'u4'].map(u => limits.enterWork(u));
  assert.throws(() => limits.enterWork('u5'), e => e.status === 429);
  release(); release(); others.forEach(fn => fn());
  limits.enterWork('u5')();
  const preflight = Array.from({ length: 16 }, () => limits.enterPreflight());
  assert.throws(() => limits.enterPreflight(), e => e.status === 503);
  preflight.forEach(fn => fn());
});

test('streaming body limit counts bytes, stops oversized/chunked bodies, and rejects invalid UTF-8', async () => {
  async function read(chunks, extra = {}) {
    let index = 0, cancelled = false;
    const request = new Request('https://www.dropclarity.com/api/meta-registration', {
      method: 'POST', duplex: 'half', headers: { 'Content-Type': 'application/json', ...extra },
      body: new ReadableStream({
        pull(controller) { if (index < chunks.length) controller.enqueue(chunks[index++]); else controller.close(); },
        cancel() { cancelled = true; },
      }, { highWaterMark: 0 }),
    });
    const budget = security.executionBudget(request.signal, 1000);
    try { return await security.readSmallJson(request, budget.run); }
    finally { budget.finish(() => {}); assert.ok(index <= chunks.length); void cancelled; }
  }
  const bytes = value => new TextEncoder().encode(value);
  assert.deepEqual(JSON.parse(JSON.stringify(await read([bytes('{"ok":'), bytes('true}')]))), { ok: true });
  await assert.rejects(read([bytes('x'.repeat(700)), bytes('x'.repeat(700)), bytes('unread')]), e => e.status === 413);
  await assert.rejects(read([bytes('é'.repeat(600))]), e => e.status === 413);
  await assert.rejects(read([bytes('{}')], { 'Content-Length': '9999' }), e => e.status === 413);
  await assert.rejects(read([new Uint8Array([0xff])]), e => e.status === 400);
});

test('overall deadline stops slow auth/Clerk work and retains slots until uncancellable work settles', async () => {
  let complete, released = false, followedUp = false;
  const budget = security.executionBudget(new AbortController().signal, 10);
  const pending = new Promise(resolve => { complete = resolve; });
  await assert.rejects(budget.run(() => pending), e => e.status === 504);
  budget.finish(() => { released = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(released, false, 'abandoned provider calls must still occupy bounded slots');
  await assert.rejects(budget.run(async () => { followedUp = true; }), e => e.status === 504);
  assert.equal(followedUp, false);
  complete();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(released, true);
});

test('slow request bodies are cancelled by the same overall deadline', async () => {
  const request = new Request('https://www.dropclarity.com/api/meta-registration', {
    method: 'POST', duplex: 'half', body: new ReadableStream({ pull() {} }),
  });
  const budget = security.executionBudget(request.signal, 10);
  await assert.rejects(security.readSmallJson(request, budget.run), e => e.status === 504);
  budget.finish(() => {});
});

test('withdrawal aborts old grants and rejects stale revisions within an instance, not globally', () => {
  const limits = new security.RegistrationLimits();
  const grant = limits.observePreference('session', 100, true);
  assert.equal(grant.current(), true);
  limits.observePreference('session', 200, false);
  assert.equal(grant.signal.aborted, true);
  assert.equal(grant.current(), false);
  assert.equal(limits.observePreference('session', 100, true).current(), false);
  assert.equal(limits.observePreference('session', 200, true).current(), false);
  assert.equal(limits.observePreference('session', 300, true).current(), true);
  const differentInstance = new security.RegistrationLimits();
  assert.equal(differentInstance.observePreference('session', 100, true).current(), true,
    'process-local state cannot enforce another Vercel instance withdrawal');
});

test('withdrawal during Clerk verification prevents dispatch; persisted event ID survives secret rotation', async () => {
  const f = fixture();
  const limits = new security.RegistrationLimits();
  const grant = limits.observePreference(f.input.sessionId, 1, true);
  let continueLookup;
  f.deps.getUser = () => new Promise(resolve => { continueLookup = () => resolve({ createdAt: f.deps.now() - 1000, privateMetadata: f.metadata }); });
  f.deps.isConsentCurrent = grant.current;
  const result = service.processRegistration(f.input, f.deps);
  await new Promise(resolve => setImmediate(resolve));
  limits.observePreference(f.input.sessionId, 2, false);
  continueLookup();
  assert.equal(await result, 'eligible');
  assert.equal(f.calls.length, 0);
  const id = f.metadata[service.REGISTRATION_METADATA_KEY].eventId;
  const nextGrant = limits.observePreference(f.input.sessionId, 3, true);
  f.deps.getUser = async () => ({ createdAt: f.deps.now() - 1000, privateMetadata: f.metadata });
  f.deps.isConsentCurrent = nextGrant.current;
  f.deps.signingSecret = 'a-different-dedicated-signing-secret';
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
  assert.equal(f.calls[0].payload.data[0].event_id, id);
});

test('deadline prevents Meta dispatch after a late Clerk result', async () => {
  const f = fixture();
  const budget = security.executionBudget(new AbortController().signal, 10);
  let complete;
  f.deps.getUser = () => new Promise(resolve => { complete = () => resolve({ createdAt: f.deps.now() - 1000, privateMetadata: f.metadata }); });
  f.deps.run = budget.run;
  f.deps.signal = budget.signal;
  await assert.rejects(service.processRegistration(f.input, f.deps), e => e.status === 504);
  complete(); budget.finish(() => {});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.calls.length, 0);
  assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY], undefined);
});

test('provider cooldowns honor bounded Retry-After and expire without queued retries', () => {
  let now = 1000;
  const limits = new security.RegistrationLimits(() => now);
  limits.pause('meta', security.retryAfterSeconds('120'));
  assert.throws(() => limits.checkProvider('meta'), e => e.status === 429 && e.retryAfter === 120);
  limits.checkProvider('clerk');
  now += 120_001; limits.checkProvider('meta');
  assert.equal(security.retryAfterSeconds('99999999'), 3600);
  assert.equal(security.retryAfterSeconds('nonsense'), 30);
});

test('browser withdrawal aborts pending registration and reports the newer denial revision', async () => {
  const { globals } = browser();
  const lib = load('src/lib/meta-pixel.ts', globals);
  lib.setMarketingConsent(true);
  const effects = [], timers = [], calls = [];
  let aborted = false;
  const component = load('src/components/MetaPixelInitializer.tsx', {
    ...globals, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {},
    fetch: async (_, options) => {
      const body = JSON.parse(options.body); calls.push(body);
      if (!body.marketingConsent) return { ok: true, json: async () => ({ status: 'eligible' }) };
      return new Promise((_, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(Error('Aborted')); }, { once: true }));
    },
  }, {
    react: { useEffect: fn => effects.push(fn) },
    '@clerk/nextjs': {
      useClerk: () => ({ session: { id: 'session_first', status: 'active' } }),
      useAuth: () => ({ userId: 'user_new', sessionId: 'session_first' }),
      useSignUp: () => ({ signUp: { id: 'sua_new' } }),
    },
    'next/navigation': { usePathname: () => '/' },
    '@/lib/meta-pixel': lib, '@/lib/meta-registration-client': load('src/lib/meta-registration-client.ts', globals),
  });
  component.default(); const cleanups = effects.map(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  lib.setMarketingConsent(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(aborted, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].marketingConsent, false);
  assert.ok(calls[1].consentRevision > calls[0].consentRevision);
  assert.equal(timers.length, 0, 'withdrawn request cannot schedule another marketing retry');
  cleanups.forEach(fn => fn?.());
});

function hardenedRouteFixture(overrides = {}) {
  const f = fixture();
  const diagnostics = [];
  const guards = load('src/lib/meta-registration-security.ts');
  let clerkReads = 0;
  const fakeClerk = {
    sessions: { getSession: async () => { clerkReads++; return f.session; } },
    users: { getUser: f.deps.getUser, updateUserMetadata: async (_, patch) => f.deps.saveRecord(_, patch.privateMetadata[service.REGISTRATION_METADATA_KEY]) },
    clients: { getClient: f.deps.getClient }, signUps: { get: f.deps.getSignUp },
  };
  const route = load('src/app/api/meta-registration/route.ts', {
    Request, Response,
    console: { warn: (...args) => diagnostics.push(args) },
    process: { env: {
      NEXT_PUBLIC_META_PIXEL_ID: f.deps.pixelId, META_EVENT_SIGNING_SECRET: 'dedicated-secret-with-at-least-32-random-characters',
      META_CONVERSIONS_API_ACCESS_TOKEN: f.deps.accessToken, ...overrides.env,
    } },
    fetch: (...args) => (overrides.fetch ?? f.deps.fetch)(...args),
  }, {
    '@clerk/nextjs/server': { auth: async () => ({ userId: f.input.userId, sessionId: f.input.sessionId }), clerkClient: async () => fakeClerk },
    '@/lib/meta-registration-server': service,
    '@/lib/meta-registration-security': overrides.guards ?? guards,
  });
  function request(consent = true, revision = 1, headers = {}) {
    return new Request('https://www.dropclarity.com/api/meta-registration', {
      method: 'POST', headers: { origin: 'https://www.dropclarity.com', 'Content-Type': 'application/json', 'User-Agent': 'Test Browser', ...headers },
      body: JSON.stringify({ marketingConsent: consent, consentRevision: revision, attemptId: 'sua_new' }),
    });
  }
  return { ...f, guards, fakeClerk, route, request, diagnostics, clerkReads: () => clerkReads };
}

test('actual route rate-limits before Clerk reads and still processes withdrawal when quota is exhausted', async () => {
  const f = hardenedRouteFixture();
  f.signup.status = 'missing_requirements';
  const grant = f.guards.registrationLimits.observePreference(f.input.sessionId, 1, true);
  for (let i = 0; i < 10; i++) assert.equal((await f.route.POST(f.request())).status, 200);
  const denied = await f.route.POST(f.request(false, 2));
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('retry-after')) > 0);
  assert.equal(f.clerkReads(), 10);
  assert.equal(grant.signal.aborted, true);
  assert.equal(f.calls.length, 0);
});

test('Meta throttling returns Retry-After and prevents further Clerk/Meta calls during cooldown', async () => {
  let attempts = 0;
  const f = hardenedRouteFixture({ fetch: async () => {
    attempts++;
    return new Response('{}', { status: 429, headers: { 'Retry-After': '120' } });
  } });
  const first = await f.route.POST(f.request());
  assert.equal(first.status, 429);
  assert.equal(first.headers.get('retry-after'), '120');
  assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
  const next = await f.route.POST(f.request());
  assert.equal(next.status, 429);
  assert.equal(f.clerkReads(), 1);
  assert.equal(attempts, 1);
});

test('Clerk throttling is isolated to tracking and respected before subsequent backend reads', async () => {
  const f = hardenedRouteFixture();
  let attempts = 0;
  f.fakeClerk.sessions.getSession = async () => { attempts++; throw Object.assign(Error('Throttled'), { status: 429 }); };
  assert.equal((await f.route.POST(f.request())).status, 429);
  assert.equal((await f.route.POST(f.request())).status, 429);
  assert.equal(attempts, 1);
  assert.equal(f.calls.length, 0);
});

test('dedicated signing secret is required: Clerk secret is never used as fallback', async () => {
  const f = hardenedRouteFixture({ env: { META_EVENT_SIGNING_SECRET: undefined, CLERK_SECRET_KEY: 'must-not-be-used' } });
  const response = await f.route.POST(f.request());
  assert.equal(response.status, 503);
  assert.equal(f.clerkReads(), 0);
  assert.equal(f.calls.length, 0);
});

test('overall route deadline aborts Meta delivery and never acknowledges a timed-out event', async () => {
  const guards = load('src/lib/meta-registration-security.ts');
  const originalBudget = guards.executionBudget;
  guards.executionBudget = signal => originalBudget(signal, 10);
  let aborted = false;
  const f = hardenedRouteFixture({ guards, fetch: async (_, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => { aborted = true; reject(options.signal.reason); }, { once: true });
  }) });
  const response = await f.route.POST(f.request());
  assert.equal(response.status, 504);
  assert.equal(aborted, true);
  assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
});

test('Vercel IP fallback accepts only a single valid platform IP and is disabled elsewhere', () => {
  const request = headers => new Request('https://www.dropclarity.com/api/meta-registration', { headers });
  assert.equal(service.vercelClientIp(request({ 'x-vercel-forwarded-for': '203.0.113.7' }), true), '203.0.113.7');
  assert.equal(service.vercelClientIp(request({ 'x-vercel-forwarded-for': '2001:db8::7' }), true), '2001:db8::7');
  assert.equal(service.vercelClientIp(request({ 'x-vercel-forwarded-for': '203.0.113.7', 'vercel': '1' }), false), undefined);
  assert.equal(service.vercelClientIp(request({ 'x-forwarded-for': '203.0.113.7', 'cf-connecting-ip': '203.0.113.8', 'x-real-ip': '203.0.113.9' }), true), undefined);
  for (const ip of ['bad', '203.0.113.7, 203.0.113.8', '203.0.113.7:443', '[2001:db8::1]', 'fe80::1%eth0']) {
    assert.equal(service.vercelClientIp(request({ 'x-vercel-forwarded-for': ip }), true), undefined);
  }
});

test('verified Clerk IP remains preferred over the platform fallback', async () => {
  const f = fixture();
  f.input.requestIp = '203.0.113.8';
  assert.equal(await service.processRegistration(f.input, f.deps), 'sent');
  assert.equal(f.calls[0].payload.data[0].user_data.client_ip_address, '192.0.2.1');
});

test('actual Vercel route delivers with missing Clerk activity and adds no new Meta fields', async () => {
  const f = hardenedRouteFixture({ env: { VERCEL: '1' } });
  delete f.session.latestActivity;
  const response = await f.route.POST(f.request(true, 1, { 'x-vercel-forwarded-for': '203.0.113.8' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'sent');
  const event = f.calls[0].payload.data[0];
  assert.equal(event.user_data.client_ip_address, '203.0.113.8');
  assert.deepEqual(Object.keys(event).sort(), ['action_source', 'event_id', 'event_name', 'event_source_url', 'event_time', 'user_data']);
  assert.deepEqual(Object.keys(event.user_data).sort(), ['client_ip_address', 'client_user_agent']);
  assert.equal(f.diagnostics.length, 0);
});

test('fallback never bypasses consent, GPC, or DNT', async () => {
  for (const headers of [{ 'sec-gpc': '1' }, { dnt: '1' }, {}]) {
    const f = hardenedRouteFixture({ env: { VERCEL: '1' } });
    delete f.session.latestActivity;
    const consent = Object.keys(headers).length > 0;
    const response = await f.route.POST(f.request(consent, 1, { 'x-vercel-forwarded-for': '203.0.113.8', ...headers }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'eligible');
    assert.equal(f.calls.length, 0);
  }
});

test('missing token, IP and User-Agent yield distinct sanitized reasons without marking sent', async () => {
  for (const reason of ['missing_meta_access_token', 'missing_client_ip', 'missing_user_agent']) {
    const f = hardenedRouteFixture({ env: reason === 'missing_meta_access_token' ? { META_CONVERSIONS_API_ACCESS_TOKEN: undefined } : {} });
    const headers = {};
    if (reason === 'missing_client_ip') {
      delete f.session.latestActivity;
      // Client-supplied headers must not become trusted in local/self-hosted mode.
      headers['x-vercel-forwarded-for'] = '203.0.113.8';
      headers.vercel = '1';
    }
    if (reason === 'missing_user_agent') headers['User-Agent'] = '';
    const response = await f.route.POST(f.request(true, 1, headers));
    assert.equal(response.status, 503);
    assert.equal(f.calls.length, 0);
    assert.equal(f.metadata[service.REGISTRATION_METADATA_KEY].sentAt, undefined);
    assert.equal(f.diagnostics.length, 1);
    assert.equal(f.diagnostics[0][1].reason, reason);
    const log = JSON.stringify(f.diagnostics);
    for (const value of ['192.0.2.1', '203.0.113.8', 'Test Browser', 'test-token', 'user_new', 'session_first', 'sua_new']) {
      assert.equal(log.includes(value), false);
    }
  }
});

test('Meta and Clerk failures log only static stage/reason and numeric status, not error contents', async () => {
  const secretCanary = 'sensitive@example.invalid secret-token customer-job-data';
  const meta = hardenedRouteFixture({ fetch: async () => new Response(secretCanary, { status: 401 }) });
  assert.equal((await meta.route.POST(meta.request())).status, 503);
  assert.equal(meta.diagnostics.length, 1);
  assert.equal(meta.diagnostics[0][1].reason, 'meta_http_error');
  assert.equal(meta.diagnostics[0][1].upstreamStatus, 401);
  assert.equal(meta.diagnostics[0][1].stage, 'meta_delivery');
  assert.equal(JSON.stringify(meta.diagnostics).includes(secretCanary), false);
  const clerk = hardenedRouteFixture();
  clerk.fakeClerk.sessions.getSession = async () => { throw Object.assign(Error(secretCanary), { status: 403 }); };
  assert.equal((await clerk.route.POST(clerk.request())).status, 503);
  assert.equal(clerk.diagnostics.length, 1);
  assert.equal(clerk.diagnostics[0][1].reason, 'tracking_failed');
  assert.equal(clerk.diagnostics[0][1].stage, 'clerk_session');
  assert.equal(clerk.diagnostics[0][1].upstreamStatus, 403);
  assert.equal(JSON.stringify(clerk.diagnostics).includes(secretCanary), false);
});

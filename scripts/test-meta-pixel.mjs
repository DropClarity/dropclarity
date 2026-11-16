import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

function storage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}
function load(file, globals, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: k => imports[k], ...globals });
  return exports;
}

(async () => {
  const images = [];
  const listeners = new Map();
  const globals = {
    URLSearchParams, Date, Set, Event,
    crypto: webcrypto,
    localStorage: storage(), sessionStorage: storage(),
    navigator: { doNotTrack: '0' },
    window: {
      location: { origin: 'https://dropclarity.com' },
      addEventListener: (k, fn) => listeners.set(k, fn),
      removeEventListener: k => listeners.delete(k),
      dispatchEvent: e => listeners.get(e.type)?.(),
    },
    document: {
      createElement: () => ({ style: {}, remove() {} }),
      body: { appendChild: image => images.push(image) },
    },
    process: { env: { NEXT_PUBLIC_META_PIXEL_ID: '123456789' } },
  };
  const lib = load('src/lib/meta-pixel.ts', globals);
  assert.equal(lib.sendMetaEvent('123', 'PageView', '/'), false);
  lib.setMarketingConsent(true);
  globals.navigator.globalPrivacyControl = true;
  assert.equal(lib.hasMarketingConsent(), false);
  globals.navigator.globalPrivacyControl = false;
  globals.navigator.doNotTrack = '1';
  assert.equal(lib.hasMarketingConsent(), false);
  globals.navigator.doNotTrack = '0';
  assert.equal(lib.sendMetaEvent('invalid', 'PageView', '/'), false);
  lib.sendMetaEvent('123', 'PageView', '/jobs/private-customer');
  const request = new URL(images.pop().src);
  assert.equal(request.searchParams.get('dl'), 'https://dropclarity.com/');
  assert.equal(request.searchParams.get('dr'), '');
  assert.equal(lib.metaPageUrl('https://dropclarity.com', '/dashboard?job=secret'), 'https://dropclarity.com/');
  const createElement = globals.document.createElement;
  globals.document.createElement = () => { throw new Error('Browser restriction'); };
  assert.equal(lib.sendMetaEvent('123', 'PageView', '/'), false, 'transport failures cannot escape into the app');
  globals.document.createElement = createElement;

  let effect, emission, cleanup;
  let path = '/';
  const clerk = {
    session: null, user: null,
    addListener: fn => { emission = fn; return () => {}; },
  };
  const componentImports = {
    react: { useEffect: fn => { effect = fn; } },
    '@clerk/nextjs': { useClerk: () => clerk },
    'next/navigation': { usePathname: () => path },
    '@/lib/meta-pixel': lib,
  };
  let component = load('src/components/MetaPixelInitializer.tsx', globals, componentImports);
  function render() {
    cleanup?.();
    component.default();
    cleanup = effect();
  }
  function emit(signUp = {}) {
    clerk.client = { signUp };
    emission({ client: clerk.client });
  }
  function count(event) { return images.filter(i => new URL(i.src).searchParams.get('ev') === event).length; }
  render(); render();
  assert.equal(count('PageView'), 1, 'Strict Mode must not double count');
  path = '/pricing'; render();
  path = '/'; render();
  assert.equal(count('PageView'), 3, 'return navigation must count');
  lib.setMarketingConsent(false);
  path = '/dashboard'; render();
  assert.equal(count('PageView'), 3);
  lib.setMarketingConsent(true);
  assert.equal(count('PageView'), 4, 'grant sends only current page');
  assert.equal(images.at(-1).referrerPolicy, 'no-referrer');

  clerk.user = { id: 'existing', createdAt: new Date() };
  clerk.session = { id: 'login', status: 'active', createdAt: new Date() };
  emit();
  assert.equal(count('CompleteRegistration'), 0, 'login is not signup');
  const completed = { status: 'complete', createdUserId: 'new', createdSessionId: 'first' };
  emit(completed);
  assert.equal(count('CompleteRegistration'), 0, 'mismatched session cannot convert');
  clerk.user = { id: 'new', createdAt: new Date() };
  clerk.session = { id: 'first', status: 'active', createdAt: new Date() };
  emit(completed); emit(completed); render(); emit(completed);
  assert.equal(count('CompleteRegistration'), 1, 'signup sends once across rerenders');
  component = load('src/components/MetaPixelInitializer.tsx', globals, componentImports);
  render(); emit(completed);
  assert.equal(count('CompleteRegistration'), 1, 'durable marker prevents registration on reload');
  globals.sessionStorage.removeItem('dropclarity_meta_signup_receipt');
  clerk.user = { id: 'returning', createdAt: new Date(Date.now() - 86400000) };
  clerk.session = { id: 'old', status: 'active', createdAt: new Date(Date.now() - 86400000) };
  emit({ status: 'complete', createdUserId: 'returning', createdSessionId: 'old' });
  assert.equal(count('CompleteRegistration'), 1, 'retained signup record cannot convert returning user');
  lib.setMarketingConsent(false);
  assert.equal(globals.sessionStorage.getItem('dropclarity_meta_signup_receipt'), null, 'withdrawal clears pending signup');
  const previousCount = images.length;
  lib.sendMetaEvent('123', 'PageView', '/');
  assert.equal(images.length, previousCount, 'withdrawal blocks future requests');
  assert.equal(lib.marketingPreference(), 'denied');
  lib.setMarketingConsent(true);
  const originalSetItem = globals.localStorage.setItem;
  globals.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  assert.equal(lib.setMarketingConsent(false), false);
  assert.equal(lib.hasMarketingConsent(), false, 'failed write must override old grant');
  assert.equal(lib.marketingPreference(), 'unavailable');
  assert.equal(lib.sendMetaEvent('123', 'PageView', '/'), false);
  globals.localStorage.setItem = originalSetItem;
  assert.equal(lib.setMarketingConsent(false), true);
  assert.equal(lib.marketingPreference(), 'denied');
  cleanup();
  console.log('Meta Pixel checks passed: consent, privacy, navigation, signup evidence, and deduplication.');
})().catch(error => { console.error(error); process.exitCode = 1; });

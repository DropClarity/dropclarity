"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  browserDisallowsMarketing, marketingPreference, META_CONSENT_EVENT,
  setMarketingConsent,
} from "@/lib/meta-pixel";

const openEvent = "dropclarity:open-cookie-preferences";
function subscribe(callback: () => void) {
  window.addEventListener(META_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(META_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  return `${marketingPreference()}:${browserDisallowsMarketing()}`;
}

export function CookiePreferencesButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(openEvent))}
      className="min-h-11 w-fit text-left text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
      Cookie preferences
    </button>
  );
}

export default function CookieConsent() {
  const status = useSyncExternalStore(subscribe, snapshot, () => "pending:false");
  const [editing, setEditing] = useState(false);
  const [dismissedUnavailable, setDismissedUnavailable] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [preference, blocked] = status.split(":");
  const visible = editing || preference === "unset" ||
    (preference === "unavailable" && !dismissedUnavailable);

  useEffect(() => {
    function open() {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setEditing(true);
    }
    window.addEventListener(openEvent, open);
    return () => window.removeEventListener(openEvent, open);
  }, []);

  useEffect(() => {
    if (editing) heading.current?.focus();
  }, [editing]);

  function close() {
    if (preference === "unavailable") setDismissedUnavailable(true);
    setEditing(false);
    opener.current?.focus();
  }
  function choose(granted: boolean) {
    const saved = setMarketingConsent(granted);
    if (saved) close();
    else setEditing(true);
  }

  if (!visible) return null;
  const buttonClass = "min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:border-violet-400 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";

  return (
    <section aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-40 max-h-[60dvh] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-[0_4px_24px_rgba(15,23,42,0.10)] sm:bottom-5 sm:left-5">
      <h2 ref={heading} tabIndex={-1} id="cookie-consent-title" className="text-sm font-extrabold tracking-tight focus:outline-none">
        Your privacy matters
      </h2>
      <p id="cookie-consent-description" className="mt-1 text-[13px] leading-5 text-slate-600">
        We use optional cookies to measure advertising performance. You can accept or reject them anytime.
      </p>
      {editing && (preference === "granted" || preference === "denied") && <p className="mt-2 text-xs leading-5 text-slate-600" role="status">
        Marketing tracking: {blocked === "true" ? "off — blocked by your browser privacy preference" : preference === "granted" ? "allowed" : "off"}.
      </p>}
      {blocked === "true" && <p className="mt-2 text-xs leading-5 text-slate-600">
        Your browser’s Global Privacy Control or Do Not Track signal keeps optional advertising tracking off.
      </p>}
      {preference === "unavailable" && <p className="mt-2 text-xs leading-5 text-slate-600" role="status">
        Your browser cannot save this preference. Optional advertising tracking stays off; you may be asked again next visit.
      </p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link href="/privacy-policy#cookies" className="mr-auto inline-flex min-h-11 items-center text-xs font-semibold text-violet-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">Privacy &amp; Cookies</Link>
        <button type="button" className={buttonClass} onClick={() => choose(true)}>Accept</button>
        <button type="button" className={buttonClass} onClick={() => choose(false)}>Reject</button>
        {editing && preference !== "unset" && <button type="button" className={buttonClass} onClick={close}>Close</button>}
      </div>
    </section>
  );
}

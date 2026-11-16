"use client";

import { useEffect } from "react";
import { useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { hasMarketingConsent, marketingConsentRevision, META_CONSENT_EVENT, sendMetaEvent } from "@/lib/meta-pixel";
import { forgetSignupAttempt, readSignupAttempt, rememberSignupAttempt } from "@/lib/meta-registration-client";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
let observedPath: string | null = null;
let pageSent = false;
const requests = new Map<string, Promise<{ status: string; retryAfter: number }>>();
const controllers = new Map<string, { sessionId: string; consent: boolean; controller: AbortController }>();
const settled = new Set<string>();

export default function MetaPixelInitializer() {
  const clerk = useClerk();
  const { sessionId, userId } = useAuth();
  // Capture the reactive attempt ID before verification, not completion fields.
  const { signUp } = useSignUp();
  const attemptId = signUp?.id;
  const pathname = usePathname();

  useEffect(() => {
    if (/^\d+$/.test(pixelId)) rememberSignupAttempt(attemptId);
  }, [attemptId]);

  useEffect(() => {
    if (!/^\d+$/.test(pixelId) || !pathname) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    async function registration() {
      if (disposed || !userId || !sessionId || clerk.session?.status !== "active" ||
          clerk.session.id !== sessionId) return;
      if (timer) { clearTimeout(timer); timer = undefined; }
      const consent = hasMarketingConsent();
      const revision = marketingConsentRevision();
      const key = `${sessionId}:${consent}:${revision}`;
      if (settled.has(key)) return;
      let task = requests.get(key);
      if (!task) {
        const controller = new AbortController();
        controllers.set(key, { sessionId, consent, controller });
        task = (async () => {
          try {
            const response = await fetch("/api/meta-registration", {
              method: "POST", credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ attemptId: readSignupAttempt(), marketingConsent: consent, consentRevision: revision }),
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
            });
            const header = response.headers?.get("retry-after");
            const seconds = header && /^\d+$/.test(header) ? Number(header) : 0;
            const retryAfter = Math.min(3_600_000, Math.max(0, seconds * 1000));
            if (!response.ok) return { status: "retry", retryAfter };
            const result = await response.json();
            return { status: typeof result.status === "string" ? result.status : "retry", retryAfter };
          } catch { return { status: "retry", retryAfter: 0 }; }
          finally { controllers.delete(key); }
        })();
        requests.set(key, task);
      }
      const { status, retryAfter } = await task;
      if (requests.get(key) === task) requests.delete(key);
      if (status === "sent" || (!consent && status === "eligible")) {
        settled.add(key);
        if (clerk.session?.id === sessionId) forgetSignupAttempt();
      }
      if (status === "ineligible" && failures >= 3) settled.add(key);
      if (!disposed && consent === hasMarketingConsent() && revision === marketingConsentRevision() &&
          (status === "retry" || status === "ineligible") && failures < 3) {
        timer = setTimeout(() => { failures += 1; void registration(); }, Math.max(retryAfter, [1000, 5000, 30000][failures]));
      }
    }

    function update() {
      if (!hasMarketingConsent()) {
        // Abort pending work before reporting withdrawal to the endpoint. This
        // also propagates cross-tab withdrawals via the storage listener.
        for (const pending of controllers.values()) {
          if (pending.sessionId === sessionId && pending.consent) pending.controller.abort();
        }
      }
      if (observedPath !== pathname) { observedPath = pathname; pageSent = false; }
      if (!pageSent && sendMetaEvent(pixelId, "PageView", pathname!)) pageSent = true;
      void registration();
    }
    update();
    window.addEventListener(META_CONSENT_EVENT, update);
    window.addEventListener("storage", update);
    window.addEventListener("online", update);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener(META_CONSENT_EVENT, update);
      window.removeEventListener("storage", update);
      window.removeEventListener("online", update);
    };
  }, [clerk, pathname, sessionId, userId, attemptId]);

  return null;
}

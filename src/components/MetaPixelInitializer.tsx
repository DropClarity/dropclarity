"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  hasMarketingConsent, META_CONSENT_EVENT, sendMetaEvent,
} from "@/lib/meta-pixel";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const receiptKey = "dropclarity_meta_signup_receipt";
// Module state survives Strict Mode's effect replay, but resets on a full load.
let observedPath: string | null = null;
let pageSent = false;
const registrations = new Set<string>();

type Receipt = { userId: string; sessionId: string; expires: number };

export default function MetaPixelInitializer() {
  const clerk = useClerk();
  const pathname = usePathname();

  useEffect(() => {
    if (!/^\d+$/.test(pixelId) || !pathname) return;
    let disposed = false;

    function pageView() {
      if (observedPath !== pathname) {
        observedPath = pathname;
        pageSent = false;
      }
      if (!pageSent && sendMetaEvent(pixelId, "PageView", pathname!)) pageSent = true;
    }

    async function registration() {
      if (!hasMarketingConsent()) return;
      const session = clerk.session;
      const user = clerk.user;
      if (!session || !user || session.status !== "active") return;
      // Clerk may retain a completed attempt. Never turn a later visit into a
      // registration, even if the visitor only grants consent on that visit.
      const cutoff = Date.now() - 30 * 60 * 1000;
      if (!user.createdAt || user.createdAt.getTime() < cutoff ||
          session.createdAt.getTime() < cutoff) return;
      // A time window never establishes newness: the completed Clerk sign-up
      // must identify BOTH this user and this exact first session.
      try {
        const raw = sessionStorage.getItem(receiptKey);
        if (!raw) return;
        const receipt: Receipt = JSON.parse(raw);
        if (receipt.userId !== user.id || receipt.sessionId !== session.id ||
            receipt.expires < Date.now()) return;
        const key = `dropclarity_meta_registered:${pixelId}:${user.id}`;
        const sendOnce = () => {
          if (disposed || !hasMarketingConsent() || clerk.session?.id !== receipt.sessionId ||
              registrations.has(key) || localStorage.getItem(key)) return;
          // Claim before sending: at-most-once attempts, no retries on ad blockers.
          localStorage.setItem(key, "1");
          registrations.add(key);
          sendMetaEvent(pixelId, "CompleteRegistration", pathname!);
          sessionStorage.removeItem(receiptKey);
        };
        // Serialize claims across tabs where Web Locks is available.
        if (navigator.locks) await navigator.locks.request(key, sendOnce);
        else sendOnce();
      } catch {
        // Fail closed if durable deduplication is unavailable.
      }
    }

    function rememberSignup(signup: typeof clerk.client.signUp | undefined) {
      if (hasMarketingConsent() && signup?.status === "complete" &&
          signup.createdUserId && signup.createdSessionId) {
        try {
          const prior = sessionStorage.getItem(receiptKey);
          const receipt: Receipt | null = prior ? JSON.parse(prior) : null;
          // Do not extend a receipt's lifetime on subsequent Clerk emissions.
          if (!receipt || receipt.sessionId !== signup.createdSessionId) {
            sessionStorage.setItem(receiptKey, JSON.stringify({
              userId: signup.createdUserId,
              sessionId: signup.createdSessionId,
              expires: Date.now() + 30 * 60 * 1000,
            } satisfies Receipt));
          }
        } catch { /* Tracking must never interrupt authentication. */ }
      }
    }
    const unsubscribe = clerk.addListener(({ client }) => {
      rememberSignup(client.signUp);
      void registration();
    });

    function update() {
      pageView();
      rememberSignup(clerk.client?.signUp);
      void registration();
    }
    update();
    window.addEventListener(META_CONSENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener(META_CONSENT_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [clerk, pathname]);

  return null;
}

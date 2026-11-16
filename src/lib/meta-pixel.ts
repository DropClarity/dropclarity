// Deliberately use Meta's IMG transport: no third-party script gets DOM access.
export const META_CONSENT_KEY = "dropclarity_marketing_consent";
export const META_CONSENT_EVENT = "dropclarity:marketing-consent-changed";
const revisionKey = "dropclarity_marketing_consent_revision";
let storageFailed = false;

export function marketingPreference(): "granted" | "denied" | "unset" | "unavailable" {
  try {
    if (storageFailed) return "unavailable";
    const value = localStorage.getItem(META_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unavailable";
  }
}

export function browserDisallowsMarketing(): boolean {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  return privacy.globalPrivacyControl === true || navigator.doNotTrack === "1";
}

export function hasMarketingConsent(): boolean {
  try {
    return !browserDisallowsMarketing() && marketingPreference() === "granted";
  } catch {
    return false;
  }
}

/** Ordering hint for best-effort cancellation; not server-verified consent. */
export function marketingConsentRevision(): number {
  try {
    const value = Number(localStorage.getItem(revisionKey) ?? "0");
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

/** Call from a consent manager ONLY after an explicit marketing choice. */
export function setMarketingConsent(granted: boolean): boolean {
  try {
    const revision = Math.max(Date.now(), marketingConsentRevision() + 1);
    localStorage.setItem(revisionKey, String(revision));
    localStorage.setItem(META_CONSENT_KEY, granted ? "granted" : "denied");
    storageFailed = false;
  } catch {
    // A failed rejection must override even a previously saved grant.
    storageFailed = true;
  }
  if (!granted) {
    try { sessionStorage.removeItem("dropclarity_meta_signup_receipt"); } catch { /* Optional storage. */ }
  }
  window.dispatchEvent(new Event(META_CONSENT_EVENT));
  return !storageFailed;
}

const safePaths = new Set([
  "/", "/pricing", "/how-it-works", "/faq", "/contact", "/privacy-policy",
  "/terms-of-service", "/billing-policy", "/app", "/dashboard",
]);

export function metaPageUrl(origin: string, pathname: string): string {
  // Unknown/dynamic routes must never expose identifiers through a path.
  return origin + (safePaths.has(pathname) ? pathname : "/");
}

export function sendMetaEvent(
  pixelId: string,
  event: "PageView",
  pathname: string,
): boolean {
  if (!/^\d+$/.test(pixelId) || !hasMarketingConsent()) return false;
  try {
    const params = new URLSearchParams({
      id: pixelId,
      ev: event,
      dl: metaPageUrl(window.location.origin, pathname),
      dr: "",
      // Avoid browser cache suppressing repeated visits to the same route.
      ts: String(Date.now()),
      eid: crypto.randomUUID(),
    });
    const image = document.createElement("img");
    image.width = 1;
    image.height = 1;
    image.alt = "";
    image.style.display = "none";
    image.referrerPolicy = "no-referrer";
    image.onload = image.onerror = () => image.remove();
    image.src = `https://www.facebook.com/tr?${params}`;
    // Append to DOM, including for Meta's iOS in-app browser image handling.
    document.body.appendChild(image);
    return true;
  } catch {
    // Browser restrictions or transport failures must never interrupt the app.
    return false;
  }
}

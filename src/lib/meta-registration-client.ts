// Minimal auth correlation only; no user/profile information is stored.
const attemptKey = "dropclarity_signup_attempt_v1";
const windowMs = 7 * 24 * 60 * 60 * 1000;

export function rememberSignupAttempt(id: string | undefined | null): void {
  if (!id || !/^sua_[a-zA-Z0-9]+$/.test(id)) return;
  try {
    if (readSignupAttempt() !== id) sessionStorage.setItem(attemptKey, JSON.stringify({ id, expires: Date.now() + windowMs }));
  } catch { /* Backend client lookup remains available if storage is blocked. */ }
}

export function readSignupAttempt(): string | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(attemptKey) ?? "null");
    if (typeof value?.id === "string" && /^sua_[a-zA-Z0-9]+$/.test(value.id) &&
        typeof value.expires === "number" && value.expires > Date.now()) return value.id;
    sessionStorage.removeItem(attemptKey);
  } catch { /* Unavailable storage must not affect signup. */ }
}

export function forgetSignupAttempt(): void {
  try { sessionStorage.removeItem(attemptKey); } catch { /* Optional storage. */ }
}

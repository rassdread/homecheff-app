/**
 * Canonical public origin for links in e-mails and redirects.
 * Prefer NEXT_PUBLIC_APP_URL (available client + server), then APP_URL, then NEXTAUTH_URL.
 * In production, never emit localhost if misconfigured.
 */
export function getPublicAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://homecheff.eu";

  let base = String(raw).trim().replace(/\/$/, "");
  if (!base) base = "https://homecheff.eu";

  if (process.env.NODE_ENV === "production") {
    if (/localhost|127\.0\.0\.1/i.test(base)) {
      return "https://homecheff.eu";
    }
  }

  return base;
}

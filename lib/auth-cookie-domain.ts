/**
 * SSO tussen *.homecheff.eu (bijv. growth.homecheff.eu en homecheff.eu):
 * zelfde JWT + zelfde session-cookie domain.
 *
 * - Lokaal / preview (*.vercel.app): geen domain → host-only cookie (geen regressie).
 * - Productie op homecheff.eu-boom: standaard `.homecheff.eu`.
 *
 * Override: NEXTAUTH_COOKIE_DOMAIN=.homecheff.eu | none | false
 */
export function getNextAuthSharedCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  const explicit = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim();
  if (explicit) {
    const lower = explicit.toLowerCase();
    if (lower === "none" || lower === "false" || lower === "0") {
      return undefined;
    }
    return explicit.startsWith(".") ? explicit : `.${explicit}`;
  }

  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const urlStr = raw.startsWith("http") ? raw : raw ? `https://${raw}` : "";
  if (!urlStr) return undefined;

  try {
    const host = new URL(urlStr).hostname;
    if (host === "homecheff.eu" || host.endsWith(".homecheff.eu")) {
      return ".homecheff.eu";
    }
  } catch {
    /* ignore */
  }

  return undefined;
}

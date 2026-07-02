/**
 * Alleen paden die veilig zijn om te herstellen na app-start (geen auth/checkout/admin).
 * Gebruikt door native shell + client-side route persistence + push deep links.
 */

const DENY_PREFIXES = [
  "/login",
  "/register",
  "/checkout",
  "/admin",
  "/api/",
  "/_next/",
] as const;

const DENY_SUBSTRINGS = [
  "callback",
  "signin",
  "signout",
  "error",
  "csrf",
] as const;

function normalizePath(path: string): string {
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep */
  }
  const q = p.indexOf("?");
  const h = p.indexOf("#");
  const cut = Math.min(
    q === -1 ? p.length : q,
    h === -1 ? p.length : h
  );
  p = p.slice(0, cut);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function matchesAllowed(normalized: string): boolean {
  if (normalized === "/") return true;
  if (
    normalized === "/messages" ||
    normalized.startsWith("/messages/")
  )
    return true;
  if (normalized === "/profile" || normalized.startsWith("/profile/")) {
    return !normalized.startsWith("/profile/delete");
  }
  if (
    normalized === "/verkoper/dashboard" ||
    normalized.startsWith("/verkoper/dashboard/")
  )
    return true;
  if (normalized.startsWith("/product/")) return true;
  if (normalized.startsWith("/user/")) return true;
  if (normalized.startsWith("/orders/")) return true;
  if (normalized === "/verkoper/orders" || normalized.startsWith("/verkoper/orders/"))
    return true;
  if (normalized === "/mijn-hcp" || normalized.startsWith("/mijn-hcp/")) return true;
  if (normalized.startsWith("/bezorger/")) return true;
  if (normalized === "/notifications" || normalized.startsWith("/notifications/"))
    return true;
  if (normalized === "/settings/app") return true;
  if (normalized === "/settings" || normalized.startsWith("/settings/")) return true;
  if (normalized === "/app") return true;
  return false;
}

export function isSafeRestorablePath(path: string): boolean {
  const n = normalizePath(path);
  const lower = n.toLowerCase();
  for (const d of DENY_PREFIXES) {
    if (lower === d || lower.startsWith(d + "/") || lower.startsWith(d))
      return false;
  }
  for (const s of DENY_SUBSTRINGS) {
    if (lower.includes(s)) return false;
  }
  return matchesAllowed(n);
}

/** Pad voor navigatie (met trailing slash conform Next-config). */
export function toTrailingSlashPath(path: string): string {
  const n = normalizePath(path);
  if (n === "/") return "/";
  return `${n}/`;
}

export function parseInternalPathFromUnknownInput(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.includes("://") || t.startsWith("//")) return null;
  const pathOnly = t.startsWith("/") ? t : `/${t}`;
  if (!isSafeRestorablePath(pathOnly)) return null;
  return toTrailingSlashPath(pathOnly);
}

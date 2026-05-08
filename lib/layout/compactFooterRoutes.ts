/**
 * Paden waar de site-footer op mobiel minimaal wordt (app-achtige flows).
 * Desktop: volledige footer blijft beschikbaar.
 */

const COMPACT_PREFIXES = [
  "/messages",
  "/profile",
  "/verkoper",
  "/delivery",
  "/orders",
  "/user/",
  "/product/",
  "/recipe/",
  "/garden/",
  "/design/",
  "/inspiratie/",
  "/dorpsplein",
  "/favorites",
  "/sell",
  "/checkout",
] as const;

/** Home / discover: alleen exact `/` (feed), niet elke subroute. */
export function isCompactMobileFooterPath(pathname: string | null): boolean {
  if (!pathname || pathname.length > 512) return false;
  if (pathname === "/") return true;
  return COMPACT_PREFIXES.some((p) => pathname.startsWith(p));
}

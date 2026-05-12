/**
 * Padprefixen waar de vaste bottom navigation verborgen is (web + native).
 * Houd gelijk met `BottomNavigation` — gebruikt voor ondermarge zodat content niet onder de balk valt.
 *
 * Verkoper-dashboard (`/verkoper/*`) hoort bij de hoofd-app: bottom nav blijft zichtbaar (mobiel + native).
 */
export const BOTTOM_NAV_HIDDEN_PATH_PREFIXES = [
  '/admin',
  '/delivery',
  '/login',
  '/register',
  '/auth',
  '/signin',
] as const;

/** @deprecated — alle shells gebruiken dezelfde lijst; optie blijft voor API-compat. */
export type BottomNavVisibilityOptions = {
  nativeShell?: boolean;
};

export function isBottomNavigationHidden(
  pathname: string | null | undefined,
  _options?: BottomNavVisibilityOptions
): boolean {
  if (!pathname) return false;
  return BOTTOM_NAV_HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

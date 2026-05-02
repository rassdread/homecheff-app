/**
 * Padprefixen waar de vaste bottom navigation verborgen is.
 * Houd gelijk met `BottomNavigation` — gebruikt voor ondermarge zodat content niet onder de balk valt.
 */
export const BOTTOM_NAV_HIDDEN_PATH_PREFIXES = [
  '/admin',
  '/delivery',
  '/verkoper',
  '/login',
  '/register',
  '/auth',
  '/signin',
] as const;

export function isBottomNavigationHidden(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  return BOTTOM_NAV_HIDDEN_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

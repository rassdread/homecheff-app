/**
 * Padprefixen waar de vaste bottom navigation verborgen is (web + native default).
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

/** In Capacitor-shell: verkoper-dashboard hoort bij de hoofd-app; bottom nav blijft zichtbaar. */
const BOTTOM_NAV_HIDDEN_NATIVE_EXCEPT_VERKOPER: readonly string[] = [
  '/admin',
  '/delivery',
  '/login',
  '/register',
  '/auth',
  '/signin',
];

export type BottomNavVisibilityOptions = {
  /** `true` = Capacitor native: `/verkoper` niet verbergen (dashboard blijft bereikbaar via tab). */
  nativeShell?: boolean;
};

export function isBottomNavigationHidden(
  pathname: string | null | undefined,
  options?: BottomNavVisibilityOptions
): boolean {
  if (!pathname) return false;
  const prefixes = options?.nativeShell
    ? BOTTOM_NAV_HIDDEN_NATIVE_EXCEPT_VERKOPER
    : BOTTOM_NAV_HIDDEN_PATH_PREFIXES;
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

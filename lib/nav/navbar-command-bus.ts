/**
 * WX 1B.4.1 — Bridge between homepage landscape work bar and NavBar mobile menu.
 * Presentation only: no create/auth/feed state. NavBar remains menu owner.
 */

export const NAVBAR_TOGGLE_MENU_EVENT = "hc:navbar-toggle-menu";
export const NAVBAR_CLOSE_MENU_EVENT = "hc:navbar-close-menu";

type MenuOpenListener = (open: boolean) => void;

let menuOpen = false;
const listeners = new Set<MenuOpenListener>();

export function publishNavbarMobileMenuOpen(open: boolean): void {
  menuOpen = Boolean(open);
  listeners.forEach((listener) => {
    try {
      listener(menuOpen);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

export function getNavbarMobileMenuOpen(): boolean {
  return menuOpen;
}

export function subscribeNavbarMobileMenuOpen(
  listener: MenuOpenListener,
): () => void {
  listeners.add(listener);
  listener(menuOpen);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleNavbarMobileMenu(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAVBAR_TOGGLE_MENU_EVENT));
}

export function closeNavbarMobileMenu(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAVBAR_CLOSE_MENU_EVENT));
}

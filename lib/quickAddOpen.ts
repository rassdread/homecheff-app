/** CustomEvent-naam: opent dezelfde quick-add-flow als de +-knop (BottomNavigation). */
export const QUICK_ADD_OPEN_EVENT = "homecheff:openQuickAdd";

export function dispatchOpenQuickAdd(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(QUICK_ADD_OPEN_EVENT));
}

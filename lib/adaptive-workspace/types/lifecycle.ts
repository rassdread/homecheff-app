import type { WidgetLifecycleState } from "./workspace";

/**
 * Allowed lifecycle transitions (contract data).
 * HIDDEN ≠ unmounted. Profile/mode changes MUST NOT imply DESTROYED.
 */
export const WIDGET_LIFECYCLE_TRANSITIONS: Readonly<
  Record<WidgetLifecycleState, readonly WidgetLifecycleState[]>
> = {
  REGISTERED: ["ELIGIBLE", "DESTROYED"],
  ELIGIBLE: ["PLACED", "SUSPENDED", "DESTROYED"],
  PLACED: ["ACTIVE", "VISIBLE", "HIDDEN", "SUSPENDED", "DESTROYED"],
  ACTIVE: ["VISIBLE", "HIDDEN", "SUSPENDED", "PLACED", "DESTROYED"],
  VISIBLE: ["ACTIVE", "HIDDEN", "SUSPENDED", "DESTROYED"],
  HIDDEN: ["VISIBLE", "ACTIVE", "SUSPENDED", "DESTROYED"],
  SUSPENDED: ["ELIGIBLE", "PLACED", "VISIBLE", "HIDDEN", "DESTROYED"],
  DESTROYED: [],
};

export function isAllowedLifecycleTransition(
  from: WidgetLifecycleState,
  to: WidgetLifecycleState,
): boolean {
  return WIDGET_LIFECYCLE_TRANSITIONS[from].includes(to);
}

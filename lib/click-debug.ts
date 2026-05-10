/**
 * Dev-only: eerste tap / geblokkeerde acties traceren (create flow, navigatie).
 */
export function clickDebug(
  component: string,
  target: string,
  action: string,
  blockedReason?: string
): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof console === "undefined" || typeof console.debug !== "function") return;
  console.debug("[click-debug]", { component, target, action, blockedReason });
}

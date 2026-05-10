/**
 * Dev-only tracing for quick-add / create-intent (no production noise).
 */
export function createFlowDebug(
  phase: string,
  detail: Record<string, unknown> & { blockedReason?: string }
): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof console === "undefined" || typeof console.debug !== "function") return;
  console.debug("[create-flow-debug]", phase, detail);
}

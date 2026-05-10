import { createFlowDebug } from "@/lib/create-flow-debug";

/** Dialog / overlay roots that must stay interactive alongside scroll-locked forms */
export const CREATE_FLOW_DIALOG_SELECTOR = "[data-create-flow-dialog]";

export function isInsideCreateFlowDialog(el: EventTarget | null): boolean {
  if (!el || typeof (el as Node).nodeType !== "number") return false;
  const t = el as HTMLElement;
  if (typeof t.closest !== "function") return false;
  return !!t.closest(CREATE_FLOW_DIALOG_SELECTOR);
}

/**
 * Clears aggressive body/html locks used by inspiration create modals (Chrome scroll fix).
 * Safe to call when no modal is open — idempotent for empty inline styles.
 */
export function forceUnlockDocumentScroll(): void {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.width = "";
  body.style.overflow = "";
  body.style.touchAction = "";
  html.style.overflow = "";
  html.style.touchAction = "";
  createFlowDebug("body-lock-cleared", {});
}

export type ResetCreateFlowUiOptions = {
  keepDraft?: boolean;
};

/**
 * Central teardown for create-flow UI locks so no invisible layer leaves the app untappable.
 */
export function resetCreateFlowUiState(opts: ResetCreateFlowUiOptions = {}): void {
  createFlowDebug("reset-ui-state", { keepDraft: !!opts.keepDraft });
  forceUnlockDocumentScroll();
}

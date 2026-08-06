/**
 * Cross-component request to open the discovery filters (if collapsed)
 * and focus the manual place/postcode input.
 *
 * GeoFeed owns the input ref; HomeDesktopLeftSidebar owns the legacy
 * collapsed "Ontdekken" disclosure. Without this bridge, "Wijzig locatie"
 * / choose-place focused a null ref while the place field stayed unmounted.
 */

export const HC_PLACE_INPUT_FOCUS_EVENT = 'hc:focus-place-input';

export type PlaceInputFocusDetail = {
  /** Why focus was requested — diagnostics only. */
  reason?: string;
};

export function requestPlaceInputFocus(detail?: PlaceInputFocusDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(HC_PLACE_INPUT_FOCUS_EVENT, {
      detail: detail ?? {},
    }),
  );
}

export function subscribePlaceInputFocusRequest(
  handler: (detail: PlaceInputFocusDetail) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const detail =
      event instanceof CustomEvent
        ? ((event.detail as PlaceInputFocusDetail | undefined) ?? {})
        : {};
    handler(detail);
  };
  window.addEventListener(HC_PLACE_INPUT_FOCUS_EVENT, listener);
  return () => window.removeEventListener(HC_PLACE_INPUT_FOCUS_EVENT, listener);
}

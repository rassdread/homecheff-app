/**
 * Models the mobile filter-sheet focus lifecycle for deterministic tests.
 * Soft-keyboard appearance cannot be asserted in CI — we assert focus retention
 * across parent re-renders (the factual break that killed Android keyboards).
 */

export type FocusActor = 'body' | 'close-button' | 'place-input' | 'other';

export type SheetFocusSimOptions = {
  /**
   * When true, models the pre-fix bug: effect deps include unstable onClose,
   * so each parent re-render runs cleanup that restores previousFocus.
   */
  effectDepsIncludeUnstableOnClose: boolean;
  parentRendersWhileOpen: number;
  userTapsPlaceInputAfterOpen: boolean;
};

export type SheetFocusSimResult = {
  focusStolenByCleanupCount: number;
  activeAfterRenders: FocusActor;
  retainedPlaceFocus: boolean;
};

/**
 * Simulate open → optional user tap → N parent re-renders (e.g. each keystroke).
 */
export function simulateMobileSheetFocusLifecycle(
  options: SheetFocusSimOptions,
): SheetFocusSimResult {
  let active: FocusActor = 'body';
  let previousOnOpen: FocusActor = 'body';
  let cleanup: (() => void) | null = null;
  let focusStolenByCleanupCount = 0;
  let onCloseIdentity = 0;

  const runOpenEffect = () => {
    cleanup?.();
    previousOnOpen = active;
    // Sheet open autofocus targets place when focusPlaceOnOpen
    active = 'place-input';
    const capturedPrevious = previousOnOpen;
    const capturedOnCloseId = onCloseIdentity;
    cleanup = () => {
      if (options.effectDepsIncludeUnstableOnClose) {
        // Bug: cleanup runs on every onClose identity change
        if (active === 'place-input') {
          focusStolenByCleanupCount += 1;
        }
        active = capturedPrevious;
        void capturedOnCloseId;
      }
      // Fixed path: cleanup only runs when open flips false — not modeled here
      // during in-open parent renders.
    };
  };

  // Open sheet
  runOpenEffect();

  if (options.userTapsPlaceInputAfterOpen) {
    active = 'place-input';
  }

  for (let i = 0; i < options.parentRendersWhileOpen; i += 1) {
    if (options.effectDepsIncludeUnstableOnClose) {
      onCloseIdentity += 1;
      runOpenEffect(); // cleanup steals, then re-focuses programmatically
      // Programmatic re-focus after cleanup does NOT open soft keyboard on Android,
      // but DOM activeElement may briefly be place-input again.
    }
    // Fixed: unstable onClose does not re-run effect — active stays.
  }

  return {
    focusStolenByCleanupCount,
    activeAfterRenders: active,
    retainedPlaceFocus: active === 'place-input' && focusStolenByCleanupCount === 0,
  };
}

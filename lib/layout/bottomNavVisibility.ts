/**
 * Bottom nav visibility. The web bar stays at every width.
 * Native landscape collapses it. The component stays mounted for quick-add listeners.
 *
 * WX 1B.4: Landscape Work Posture collapses the native bottom button menu.
 * Driven by AvailableSpace posture, not by device/UA classes.
 */

/**
 * Visual visibility for the fixed tab bar.
 * Native landscape collapses the bar. The web bar stays, including wide desktop windows.
 */
export const BOTTOM_NAV_DESKTOP_HEADER_MIN_PX = 1280;

/**
 * The five-item bar stays on the web at every width. The desktop header does not replace it.
 * Native landscape still collapses the bar.
 */
export function bottomNavBarVisibleClass(
  isNativeShell: boolean,
  landscapeWorkCollapsed: boolean,
  _usableWidthPx = 0,
): string {
  if (isNativeShell && landscapeWorkCollapsed) return 'hidden';
  if (isNativeShell) return 'block';
  return 'block';
}

/** Flow spacer below content — only when tab bar is visible. */
export function bottomNavFlowSpacerClass(
  isNativeShell: boolean,
  suppressed: boolean,
): string {
  if (suppressed) return 'h-0';
  if (isNativeShell) return 'h-[5.75rem] md:h-[7.25rem]';
  return 'max-xl:h-20 max-xl:md:h-[5.75rem] xl:h-0';
}

/**
 * Bottom nav visibility — web hides tab bar at lg+; native/PWA keeps it.
 * Component stays mounted for quick-add event listeners.
 *
 * WX 1B.4: Landscape Work Posture collapses the bottom button menu
 * (portrait navigation affordance). Driven by AvailableSpace posture,
 * not by device/UA classes.
 */

/** Wrapper around the fixed tab bar (not modals/inputs). */
export function bottomNavBarWrapperClass(isNativeShell: boolean): string {
  if (isNativeShell) return 'block';
  /** Align with NavBar xl split — compact tabs until desktop nav has room. */
  return 'max-xl:block xl:hidden';
}

/**
 * Visual visibility for the fixed tab bar.
 * Landscape Work Posture always collapses the bar (nav remains via NavBar).
 */
export function bottomNavBarVisibleClass(
  isNativeShell: boolean,
  landscapeWorkCollapsed: boolean,
): string {
  if (landscapeWorkCollapsed) return 'hidden';
  return bottomNavBarWrapperClass(isNativeShell);
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

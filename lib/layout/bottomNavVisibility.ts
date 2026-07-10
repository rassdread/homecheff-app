/**
 * Bottom nav visibility — web hides tab bar at lg+; native/PWA keeps it.
 * Component stays mounted for quick-add event listeners.
 */

/** Wrapper around the fixed tab bar (not modals/inputs). */
export function bottomNavBarWrapperClass(isNativeShell: boolean): string {
  if (isNativeShell) return 'block';
  return 'max-lg:block lg:hidden';
}

/** Flow spacer below content — only when tab bar is visible. */
export function bottomNavFlowSpacerClass(
  isNativeShell: boolean,
  suppressed: boolean,
): string {
  if (suppressed) return 'h-0';
  if (isNativeShell) return 'h-[5.75rem] md:h-[7.25rem]';
  return 'max-lg:h-20 max-lg:md:h-[5.75rem] lg:h-0';
}

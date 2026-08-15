/**
 * Shared interaction boundary for actionable controls inside clickable cards.
 * Child actions (Edit, delete, share, menus) must not activate parent navigation.
 */
import type { KeyboardEvent, SyntheticEvent } from 'react';

export function stopCardNavigation(e: SyntheticEvent): void {
  e.stopPropagation();
}

export function stopCardNavigationKeyDown(e: KeyboardEvent): void {
  // Prevent Space/Enter on nested controls from bubbling to card handlers.
  if (e.key === 'Enter' || e.key === ' ') {
    e.stopPropagation();
  }
}

/** Spread onto owner-action toolbars nested in clickable listing cards. */
export function cardActionBoundaryProps() {
  return {
    'data-card-action': 'true',
    onClick: stopCardNavigation,
    onMouseDown: stopCardNavigation,
    onPointerDown: stopCardNavigation,
    onTouchStart: stopCardNavigation,
    onKeyDown: stopCardNavigationKeyDown,
  } as const;
}

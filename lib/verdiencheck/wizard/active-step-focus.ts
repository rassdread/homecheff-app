/**
 * After a logical VerdienCheck step change, put the new question in view
 * and focus the heading — never an amount input (avoids mobile keyboard).
 */

export const VERDIENCHECK_ACTIVE_STEP_ID = 'verdiencheck-active-step';
export const VERDIENCHECK_STEP_HEADING_ID = 'verdiencheck-step-heading';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function findScrollOwner(start: HTMLElement | null): HTMLElement | Window {
  let node: HTMLElement | null = start?.parentElement ?? null;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

function headerOffsetPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--hc-top-nav-height')
    .trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed + 12;
  return 76;
}

function focusWithoutPageJump(el: HTMLElement | null | undefined): void {
  if (!el) return;
  el.focus({ preventScroll: true });
}

export function positionVerdienCheckActiveStep(input: {
  container: HTMLElement | null;
  heading: HTMLElement | null;
  invalidTarget?: HTMLElement | null;
  mode: 'step' | 'invalid';
}): void {
  if (typeof window === 'undefined') return;
  // Always park the question heading. Scrolling the error to the header offset
  // hides the question on short or zoomed viewports.
  const scrollTarget = input.heading ?? input.container;
  if (!scrollTarget) {
    focusWithoutPageJump(
      input.mode === 'invalid' ? input.invalidTarget : input.heading,
    );
    return;
  }

  const reduce = prefersReducedMotion();
  const owner = findScrollOwner(scrollTarget);
  const offset = headerOffsetPx();
  const rect = scrollTarget.getBoundingClientRect();

  if (owner === window) {
    const top = window.scrollY + rect.top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  } else {
    const ownerEl = owner as HTMLElement;
    const ownerRect = ownerEl.getBoundingClientRect();
    const top = ownerEl.scrollTop + (rect.top - ownerRect.top) - offset;
    ownerEl.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }

  const focusTarget =
    input.mode === 'invalid' && input.invalidTarget
      ? input.invalidTarget
      : input.heading ?? input.container;
  focusWithoutPageJump(focusTarget);
}

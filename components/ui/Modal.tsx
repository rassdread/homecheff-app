'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** id of the element that labels the dialog (aria-labelledby). */
  labelledById?: string;
  /** Accessible name when there is no visible title element. */
  ariaLabel?: string;
  /** Overlay/backdrop classes. Defaults to the platform standard centered overlay. */
  overlayClassName?: string;
  /** Close when the backdrop (not the panel) is clicked. Default true. */
  closeOnOverlayClick?: boolean;
  /** Close on Escape. Default true (safe a11y improvement). */
  closeOnEscape?: boolean;
  /** Lock body scroll while open. Default true. */
  lockScroll?: boolean;
  /** Extra attributes to spread on the overlay root (e.g. data-* hooks). */
  overlayProps?: React.HTMLAttributes<HTMLDivElement>;
};

const DEFAULT_OVERLAY =
  'fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4';

/**
 * Gedeelde Modal-overlay (Phase 6B). Consolideert het `fixed inset-0` +
 * `bg-black/50` + gecentreerd paneel patroon dat door de hele app hand-matig
 * herhaald werd. Geen redesign: het paneel (de `children`) levert de aanroeper
 * zelf aan, met exact dezelfde styling als voorheen. De Modal voegt uitsluitend
 * gedeelde a11y/gedrag toe: `role="dialog"`, `aria-modal`, Escape-sluiten,
 * scroll-lock en focus-herstel.
 */
export function Modal({
  open,
  onClose,
  children,
  labelledById,
  ariaLabel,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  lockScroll = true,
  overlayProps,
}: ModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    const onKey = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Move focus into the dialog for screen-reader / keyboard users.
    queueMicrotask(() => {
      const root = overlayRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? root).focus?.();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, closeOnEscape, onClose]);

  React.useEffect(() => {
    if (!open || !lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, lockScroll]);

  if (!open) return null;

  return (
    <div
      {...overlayProps}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      aria-label={labelledById ? undefined : ariaLabel}
      tabIndex={-1}
      className={cn(overlayClassName ?? DEFAULT_OVERLAY, overlayProps?.className)}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

export default Modal;

'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  /**
   * Screen-reader label. When provided, the spinner is announced as a live
   * status region. When omitted, the spinner is decorative (aria-hidden) and
   * the surrounding context is expected to convey the busy state.
   */
  srLabel?: string;
};

/**
 * Gedeelde laad-spinner (Phase 6B). Wrapt de bestaande `Loader2 + animate-spin`
 * die overal in de app hand-matig gebruikt werd, met dezelfde sizing-systematiek
 * als `ui/Button` (xs/sm/md/lg). Voegt geen nieuw design toe: identieke afmetingen
 * en `currentColor`, zodat bestaande kleur- en marge-classes via `className` blijven werken.
 */
const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function Spinner({ size = 'sm', className, srLabel }: SpinnerProps) {
  const icon = (
    <Loader2
      className={cn('animate-spin', SIZE_CLASSES[size], className)}
      aria-hidden={srLabel ? undefined : true}
    />
  );

  if (srLabel) {
    return (
      <span role="status" aria-live="polite" className="inline-flex">
        {icon}
        <span className="sr-only">{srLabel}</span>
      </span>
    );
  }

  return icon;
}

export default Spinner;

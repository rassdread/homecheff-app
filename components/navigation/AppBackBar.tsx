'use client';

import type { ReactNode } from 'react';
import BackButton from '@/components/navigation/BackButton';
import { cn } from '@/lib/utils';

type Props = {
  fallbackUrl?: string;
  label?: string;
  sticky?: boolean;
  className?: string;
  title?: string;
  backVariant?: 'default' | 'minimal' | 'floating';
  /** App bars: label matches `fallbackUrl` — avoid `router.back()` to wrong screen. Override with `auto` for history-first. */
  backNavMode?: 'auto' | 'explicit';
  /** Extra row content (e.g. actions) to the right of the title */
  endSlot?: ReactNode;
  /** Chrome titles should not steal the page H1. Default remains h2 for existing bars. */
  titleTag?: 'h2' | 'p';
  /** Accessible name for the back control when the visible label is not “Terug”. */
  backAriaLabel?: string;
};

export default function AppBackBar({
  fallbackUrl,
  label,
  sticky = false,
  className,
  title,
  backVariant = 'minimal',
  backNavMode = 'explicit',
  endSlot,
  titleTag = 'h2',
  backAriaLabel,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90',
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] pb-2.5 px-0.5',
        sticky && 'sticky top-0 z-30',
        className
      )}
    >
      <BackButton
        fallbackUrl={fallbackUrl}
        label={label}
        variant={backVariant}
        backNavMode={backNavMode}
        ariaLabel={backAriaLabel}
        className="shrink-0"
      />
      {title ? (
        titleTag === 'p' ? (
          <p className="min-w-0 w-full basis-full text-sm font-semibold leading-tight text-gray-800 break-words sm:w-auto sm:flex-1 sm:basis-auto sm:truncate sm:text-base">
            {title}
          </p>
        ) : (
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 sm:text-base">
            {title}
          </h2>
        )
      ) : null}
      {endSlot ? <div className="ml-auto flex shrink-0 items-center gap-2">{endSlot}</div> : null}
    </div>
  );
}

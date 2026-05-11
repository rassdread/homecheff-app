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
  /** Extra row content (e.g. actions) to the right of the title */
  endSlot?: ReactNode;
};

export default function AppBackBar({
  fallbackUrl,
  label,
  sticky = false,
  className,
  title,
  backVariant = 'minimal',
  endSlot,
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
        className="shrink-0"
      />
      {title ? (
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 sm:text-base">
          {title}
        </h2>
      ) : null}
      {endSlot ? <div className="ml-auto flex shrink-0 items-center gap-2">{endSlot}</div> : null}
    </div>
  );
}

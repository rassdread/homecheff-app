'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useHomeHeroCollapsed } from '@/hooks/useHomeHeroCollapsed';

const hideButtonClass = cn(
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5',
  'rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold',
  'text-white bg-black/45 border border-white/70 shadow-sm backdrop-blur-[2px]',
  '[-webkit-text-fill-color:#ffffff]',
  'hover:bg-black/55 hover:border-white',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
  'touch-manipulation select-none',
  'motion-reduce:transition-none transition-colors',
);

const showButtonClass = cn(
  'flex w-full min-h-[44px] items-center justify-center gap-1.5',
  'rounded-xl px-3 py-2 text-sm font-semibold text-white',
  '[-webkit-text-fill-color:#ffffff]',
  'bg-gradient-to-r from-primary-brand via-[#007a5c] to-emerald-800',
  'border border-white/30 shadow-md',
  'hover:brightness-[1.04] active:brightness-95',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100',
  'touch-manipulation select-none',
);

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function HomeHeroCollapsible({ children, className }: Props) {
  const { tOr } = useTranslation();
  const { collapsed, toggle } = useHomeHeroCollapsed();
  const hideLabel = tOr('homePhase1.heroHideLabel', 'Hide hero', 'Hero verbergen');
  const showLabel = tOr('homePhase1.heroShowLabel', 'Show hero', 'Hero tonen');

  if (collapsed) {
    return (
      <div
        className={cn('min-w-0', className)}
        data-hc-hero-collapsible="collapsed"
      >
        <button
          type="button"
          onClick={toggle}
          className={showButtonClass}
          aria-expanded={false}
          aria-controls="home-hero-expanded"
          aria-label={showLabel}
          data-testid="home-hero-show"
        >
          <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span>{showLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn('min-w-0', className)}
      data-hc-hero-collapsible="expanded"
    >
      <div id="home-hero-expanded">{children}</div>
      <div
        className={cn(
          'flex justify-center px-3 py-1.5',
          'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
          'border-b border-primary-brand/30',
        )}
      >
        <button
          type="button"
          onClick={toggle}
          className={hideButtonClass}
          aria-expanded
          aria-controls="home-hero-expanded"
          aria-label={hideLabel}
          data-testid="home-hero-hide"
        >
          <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span>{hideLabel}</span>
        </button>
      </div>
    </div>
  );
}

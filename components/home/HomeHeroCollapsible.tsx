'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useHomeHeroCollapsed } from '@/hooks/useHomeHeroCollapsed';

const hideButtonClass = cn(
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5',
  'rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold',
  'text-white bg-black/35 border border-white/50 shadow-sm backdrop-blur-[2px]',
  'hover:bg-black/45 hover:border-white/70',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
  'touch-manipulation select-none',
  'motion-reduce:transition-none transition-colors',
);

const showButtonClass = cn(
  'flex w-full min-h-[44px] items-center justify-center gap-1.5',
  'rounded-xl px-3 py-2 text-sm font-semibold text-white',
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
  const { t } = useTranslation();
  const { collapsed, toggle } = useHomeHeroCollapsed();
  const panelRef = useRef<HTMLDivElement>(null);
  const hideLabel = t('homePhase1.heroHideLabel');
  const showLabel = t('homePhase1.heroShowLabel');

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.inert = collapsed;
  }, [collapsed]);

  return (
    <div
      className={cn('relative min-w-0', className)}
      data-hc-hero-collapsible={collapsed ? 'collapsed' : 'expanded'}
    >
      <div
        className={cn(
          'grid motion-reduce:transition-none transition-[grid-template-rows] duration-200 ease-out',
          collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
        )}
      >
        <div
          ref={panelRef}
          id="home-hero-expanded"
          className={cn(
            'min-h-0 overflow-hidden',
            '[&>section]:pb-12 [&_[data-wx-orientation-strip]]:pb-12',
          )}
          aria-hidden={collapsed}
        >
          {children}
        </div>
      </div>

      {collapsed ? (
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
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-3 pb-2">
          <button
            type="button"
            onClick={toggle}
            className={cn(hideButtonClass, 'pointer-events-auto')}
            aria-expanded
            aria-controls="home-hero-expanded"
            aria-label={hideLabel}
            data-testid="home-hero-hide"
          >
            <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span>{hideLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}

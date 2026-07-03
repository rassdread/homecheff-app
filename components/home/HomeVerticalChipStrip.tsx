'use client';

import { useRouter } from 'next/navigation';
import { ChefHat, Sprout, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';

const VERTICALS = [
  { key: 'cheff', icon: ChefHat, emoji: '🍲' },
  { key: 'garden', icon: Sprout, emoji: '🌱' },
  { key: 'designer', icon: Palette, emoji: '🎨' },
] as const;

/** Horizontal category chips — feed insert, not a pre-feed block. */
export default function HomeVerticalChipStrip({ className }: { className?: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const openVertical = (key: string) => {
    router.push(`/?chip=sale&vertical=${key}#homecheff-feed`);
    window.setTimeout(scrollToHomeFeed, 120);
  };

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      role="list"
      aria-label={t('homePhase1.heroTitleHighlight')}
    >
      {VERTICALS.map(({ key, icon: Icon, emoji }) => (
        <button
          key={key}
          type="button"
          role="listitem"
          onClick={() => openVertical(key)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:border-primary-brand/30 hover:bg-primary-50/40 transition-colors touch-manipulation"
        >
          <span aria-hidden>{emoji}</span>
          <Icon className="h-3.5 w-3.5 text-primary-brand/80" aria-hidden />
          {t(`homePhase1.verticals.${key}.title`)}
        </button>
      ))}
    </div>
  );
}

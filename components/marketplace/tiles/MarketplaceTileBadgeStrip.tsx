'use client';

import { cn } from '@/lib/utils';
import type { TileBadge } from '@/lib/marketplace/tiles';

const TONE_CLASS: Record<TileBadge['tone'], string> = {
  request: 'bg-amber-100 text-amber-900 ring-amber-200',
  date: 'bg-white/95 text-gray-800 ring-gray-200',
  kind: 'bg-primary-brand/90 text-white ring-primary-brand/30',
  trust: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  default: 'bg-white/95 text-gray-800 ring-gray-200',
};

export default function MarketplaceTileBadgeStrip({
  badges,
  overflowCount,
  className,
}: {
  badges: TileBadge[];
  overflowCount?: number;
  className?: string;
}) {
  if (badges.length === 0 && !overflowCount) return null;

  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1',
        className,
      )}
    >
      {badges.map((badge) => (
        <span
          key={`${badge.kind}-${badge.label}`}
          className={cn(
            'inline-flex max-w-full items-center truncate rounded-lg px-2 py-0.5 text-[10px] font-semibold shadow-sm ring-1',
            TONE_CLASS[badge.tone],
          )}
        >
          {badge.label}
        </span>
      ))}
      {overflowCount && overflowCount > 0 ? (
        <span className="inline-flex items-center rounded-lg bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );
}

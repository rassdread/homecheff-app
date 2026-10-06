'use client';

import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { cn } from '@/lib/utils';
import type { TileBadge } from '@/lib/marketplace/tiles';

function TileBadgeIcon({ badge }: { badge: TileBadge }) {
  if (!badge.icon || badge.iconKind === 'none') return null;
  if (badge.iconKind === 'emoji') {
    return (
      <span className="shrink-0 text-[10px] leading-none" aria-hidden>
        {badge.icon}
      </span>
    );
  }
  return (
    <TaxonomyLucideIcon
      name={badge.icon}
      className="h-3 w-3 shrink-0"
      tone={badge.taxonomyTone}
    />
  );
}

export default function TileBadgeRow({
  badges,
  overflowCount,
  className,
  compact,
}: {
  badges: TileBadge[];
  overflowCount?: number;
  className?: string;
  /** Sidebar inline badge row (no absolute overlay). */
  compact?: boolean;
}) {
  if (badges.length === 0 && !overflowCount) return null;

  return (
    <div
      className={cn(
        compact
          ? 'flex flex-wrap gap-1'
          : 'absolute top-2 left-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1',
        className,
      )}
    >
      {badges.map((badge) => (
        <span
          key={`${badge.kind}-${badge.taxonomyId ?? badge.label}`}
          className={cn(
            'inline-flex max-w-full items-center gap-1 truncate rounded-lg px-2 py-0.5 text-[10px] font-semibold shadow-sm ring-1',
            'bg-[var(--hc-surface-subtle)] text-[var(--hc-text)] ring-[var(--hc-border-quiet)]',
          )}
        >
          <TileBadgeIcon badge={badge} />
          <span className="truncate">{badge.label}</span>
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

'use client';

import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { cn } from '@/lib/utils';
import type { BusinessPlanId } from '@/lib/business/visibility-profile';
import type { TileBadge } from '@/lib/marketplace/tiles';

/** Recovered BusinessPlanBadge tones — Basic / Pro / Premium. */
const BUSINESS_PLAN_BADGE_TONE: Record<
  Exclude<BusinessPlanId, 'individual'>,
  string
> = {
  basic: 'bg-slate-50 text-slate-800 ring-slate-300',
  pro: 'bg-[#e8f4ef] text-[#1a4a40] ring-[#347266]/40 uppercase tracking-[0.08em]',
  premium: 'bg-[#f4f0fb] text-[#4c1d95] ring-[#5b21b6]/35',
};

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

function badgeSurfaceClass(badge: TileBadge): string {
  if (
    badge.kind === 'business_plan' &&
    badge.businessPlan &&
    badge.businessPlan !== 'individual'
  ) {
    return BUSINESS_PLAN_BADGE_TONE[badge.businessPlan];
  }
  return 'bg-[var(--hc-surface-subtle)] text-[var(--hc-text)] ring-[var(--hc-border-quiet)]';
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
            badgeSurfaceClass(badge),
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

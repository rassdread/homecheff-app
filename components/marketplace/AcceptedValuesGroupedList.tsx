'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import PendingAcceptedValueProposalForm from '@/components/marketplace/PendingAcceptedValueProposalForm';
import { groupAcceptedTaxonomyIds } from '@/lib/marketplace/discovery/group-accepted-taxonomy-ids';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { taxonomyLabelKey } from '@/lib/marketplace/taxonomy-i18n';
import { TAXONOMY_TONE_CLASSES } from '@/lib/marketplace/taxonomy-tone';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { resolveAcceptedValueEntry } from '@/lib/marketplace/pending-accepted-values/resolve-pending-display';
import { usePendingAcceptedValueRegistry } from '@/hooks/usePendingAcceptedValueRegistry';
import { cn } from '@/lib/utils';

type Props = {
  ids?: unknown;
  className?: string;
  compact?: boolean;
};

/** Grouped accepted-value display — official taxonomy + pending proposals (Phase 8B/8C). */
export default function AcceptedValuesGroupedList({
  ids,
  className,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const { registry } = usePendingAcceptedValueRegistry();
  const normalized = normalizeAcceptedTaxonomyIds(ids);

  const pendingCategoryMap = useMemo(() => {
    const map = new Map<string, import('@prisma/client').MarketplaceCategory>();
    for (const id of normalized) {
      const entry = resolveAcceptedValueEntry(id, registry);
      if (entry?.kind === 'pending') {
        map.set(id, entry.category);
      }
    }
    return map;
  }, [normalized, registry]);

  const groups = groupAcceptedTaxonomyIds(normalized, pendingCategoryMap);
  if (groups.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)} data-accepted-values-grouped>
      {groups.map((group) => (
        <div key={group.groupId}>
          {!group.groupId.startsWith('flat.') ? (
            <p
              className={cn(
                'font-semibold uppercase tracking-wide text-gray-500 mb-1.5',
                compact ? 'text-[10px]' : 'text-xs',
              )}
            >
              {t(group.groupLabelKey)}
            </p>
          ) : null}
          <ul className="flex flex-wrap gap-1.5">
            {group.itemIds.map((id) => {
              const pending = resolveAcceptedValueEntry(id, registry);
              const official = getMarketplaceTaxonomyItem(id);
              const label =
                pending?.kind === 'pending'
                  ? pending.label
                  : official
                    ? t(taxonomyLabelKey(id))
                    : id;
              const icon = pending?.icon ?? official?.icon ?? 'Tag';
              const tone = pending?.tone ?? official?.tone ?? 'service';
              return (
                <li
                  key={id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border font-medium',
                    TAXONOMY_TONE_CLASSES[tone],
                    compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
                  )}
                >
                  <TaxonomyLucideIcon
                    name={icon}
                    className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}
                    tone={tone}
                  />
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AcceptedValuesPickerPendingFallback({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <PendingAcceptedValueProposalForm
      onCreated={(taxonomyId) => {
        if (!value.includes(taxonomyId)) onChange([...value, taxonomyId]);
      }}
    />
  );
}

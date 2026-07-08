'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { resolveAcceptedValueEntry } from '@/lib/marketplace/pending-accepted-values/resolve-pending-display';
import { usePendingAcceptedValueRegistry } from '@/hooks/usePendingAcceptedValueRegistry';
import { taxonomyLabelKey } from '@/lib/marketplace/taxonomy-i18n';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  onRemove?: () => void;
  compact?: boolean;
  className?: string;
  /** Prefix chip with shopping-with framing (reverse discovery). */
  shoppingWith?: boolean;
};

export default function AcceptedValueChip({
  id,
  onRemove,
  compact = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const { registry } = usePendingAcceptedValueRegistry();
  const entry = resolveAcceptedValueEntry(id, registry);
  if (!entry) return null;

  const label =
    entry.kind === 'official' ? t(taxonomyLabelKey(entry.id)) : entry.label;

  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 font-semibold text-emerald-900 touch-manipulation',
        onRemove ? 'hover:bg-emerald-100' : 'cursor-default',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      aria-pressed={Boolean(onRemove)}
    >
      <TaxonomyLucideIcon
        name={entry.icon}
        className={compact ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'}
      />
      {label}
      {onRemove ? <span aria-hidden>×</span> : null}
    </button>
  );
}

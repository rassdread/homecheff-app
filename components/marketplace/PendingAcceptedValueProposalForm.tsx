'use client';

import { useState } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { MARKETPLACE_ENTRY_CATEGORY_KEY } from '@/lib/marketplace/i18n-keys';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-taxonomy';
import { upsertPendingAcceptedValueInRegistry } from '@/lib/marketplace/pending-accepted-values/client-registry';
import type { PendingAcceptedValueRecord } from '@/lib/marketplace/pending-accepted-values/types';
import { cn } from '@/lib/utils';

type Props = {
  onCreated: (taxonomyId: string) => void;
  compact?: boolean;
  className?: string;
};

export default function PendingAcceptedValueProposalForm({
  onCreated,
  compact = false,
  className,
}: Props) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<MarketplaceCategory>('CREATE');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = label.trim();
    if (trimmed.length < 2) {
      setError(t('marketplace.pendingAcceptedValue.errorTooShort'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/marketplace/pending-accepted-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: trimmed,
          category,
          language: language ?? 'nl',
        }),
      });
      const body = (await res.json()) as {
        item?: PendingAcceptedValueRecord;
        error?: string;
      };
      if (!res.ok || !body.item) {
        setError(t('marketplace.pendingAcceptedValue.errorGeneric'));
        return;
      }
      upsertPendingAcceptedValueInRegistry(body.item);
      onCreated(body.item.taxonomyId);
      setLabel('');
      setOpen(false);
    } catch {
      setError(t('marketplace.pendingAcceptedValue.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 font-medium text-emerald-900 hover:bg-emerald-50 transition-colors',
          compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
          className,
        )}
      >
        <Plus className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
        {t('marketplace.pendingAcceptedValue.proposeCta')}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-2',
        compact ? 'p-2' : 'p-3',
        className,
      )}
    >
      <p className={cn('font-semibold text-gray-900', compact ? 'text-[11px]' : 'text-xs')}>
        {t('marketplace.pendingAcceptedValue.proposeHeading')}
      </p>
      <p className={cn('text-gray-600 leading-snug', compact ? 'text-[10px]' : 'text-xs')}>
        {t('marketplace.pendingAcceptedValue.proposeDescription')}
      </p>
      <label className="block">
        <span className={cn('font-medium text-gray-700', compact ? 'text-[10px]' : 'text-xs')}>
          {t('marketplace.pendingAcceptedValue.categoryLabel')}
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
          className={cn(
            'mt-1 w-full rounded-lg border border-gray-200 bg-white',
            compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm',
          )}
        >
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(MARKETPLACE_ENTRY_CATEGORY_KEY[cat])}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={cn('font-medium text-gray-700', compact ? 'text-[10px]' : 'text-xs')}>
          {t('marketplace.pendingAcceptedValue.customLabel')}
        </span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('marketplace.pendingAcceptedValue.customPlaceholder')}
          className={cn(
            'mt-1 w-full rounded-lg border border-gray-200 bg-white',
            compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm',
          )}
          maxLength={120}
        />
      </label>
      {error ? (
        <p className={cn('text-red-600', compact ? 'text-[10px]' : 'text-xs')}>{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className={cn(
            'rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50',
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
          )}
        >
          {t('marketplace.pendingAcceptedValue.submit')}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className={cn(
            'rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
          )}
        >
          {t('buttons.cancel')}
        </button>
      </div>
    </div>
  );
}

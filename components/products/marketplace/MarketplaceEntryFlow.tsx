'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MARKETPLACE_CATEGORIES,
  type ListingIntentValue,
} from '@/lib/marketplace/listing-taxonomy';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItem,
  type TaxonomyEntryRole,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
} from '@/lib/marketplace/taxonomy-i18n';
import { normalizeTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import {
  MARKETPLACE_ENTRY_CATEGORY_KEY,
  MARKETPLACE_ERROR_KEYS,
} from '@/lib/marketplace/i18n-keys';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';

export type MarketplaceEntryResult = {
  listingIntent: ListingIntentValue;
  marketplaceCategory: MarketplaceCategory;
  specializations: string[];
};

type EntryStep = 'intent' | 'category' | 'group' | 'items' | 'summary';

type Props = {
  onComplete: (result: MarketplaceEntryResult) => void;
  onCancel?: () => void;
  initialIntent?: ListingIntentValue;
  initialCategory?: MarketplaceCategory;
  initialSpecializations?: string[];
  allowedCategories?: MarketplaceCategory[];
};

function intentToRole(intent: ListingIntentValue): TaxonomyEntryRole {
  return intent === 'REQUEST' ? 'request' : 'offer';
}

export default function MarketplaceEntryFlow({
  onComplete,
  onCancel,
  initialIntent,
  initialCategory,
  initialSpecializations = [],
  allowedCategories,
}: Props) {
  const { t } = useTranslation();

  const normalizedInitialSpecs = useMemo(
    () => normalizeTaxonomyIds(initialSpecializations, initialCategory ?? null),
    [initialSpecializations, initialCategory],
  );

  const startStep = (): EntryStep => {
    if (initialIntent && initialCategory && normalizedInitialSpecs.length > 0) {
      return 'summary';
    }
    if (initialIntent && initialCategory) return 'group';
    if (initialIntent) return 'category';
    return 'intent';
  };

  const [step, setStep] = useState<EntryStep>(startStep);
  const [listingIntent, setListingIntent] = useState<ListingIntentValue>(
    initialIntent ?? 'OFFER',
  );
  const [marketplaceCategory, setMarketplaceCategory] =
    useState<MarketplaceCategory>(initialCategory ?? 'CREATE');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(normalizedInitialSpecs);
  const [message, setMessage] = useState<string | null>(null);

  const role = intentToRole(listingIntent);

  const categories = useMemo(() => {
    const all = MARKETPLACE_CATEGORIES;
    if (!allowedCategories?.length) return all;
    return all.filter((c) => allowedCategories.includes(c));
  }, [allowedCategories]);

  const groupsForCategory = useMemo(
    () => getMarketplaceTaxonomyGroupsByCategory(marketplaceCategory),
    [marketplaceCategory],
  );

  const itemsForGroup = useMemo(() => {
    if (!selectedGroupId) return [];
    return getEntryFlowItemsForGroup(selectedGroupId, role);
  }, [selectedGroupId, role]);

  const toggleSpec = (taxonomyId: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(taxonomyId)
        ? prev.filter((id) => id !== taxonomyId)
        : [...prev, taxonomyId],
    );
    setMessage(null);
  };

  const goToSummary = () => {
    if (selectedSpecs.length === 0) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.specializationsRequired));
      return;
    }
    setMessage(null);
    setStep('summary');
  };

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
      active
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
        : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/40'
    }`;

  const cardClass = (active: boolean) =>
    `rounded-xl border-2 p-4 text-left font-medium transition-colors ${
      active
        ? 'border-emerald-500 bg-emerald-50'
        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
    }`;

  const renderTaxonomyChip = (taxonomyId: string, icon: string, active: boolean) => (
    <button
      key={taxonomyId}
      type="button"
      onClick={() => toggleSpec(taxonomyId)}
      className={chipClass(active)}
      aria-pressed={active}
    >
      <TaxonomyLucideIcon name={icon} className="h-4 w-4" />
      {active ? <span aria-hidden>✓ </span> : null}
      {t(taxonomyLabelKey(taxonomyId))}
    </button>
  );

  return (
    <div className="space-y-6">
      {step === 'intent' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t('marketplace.entry.intentHeading')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('marketplace.offerIntent.hint')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['OFFER', 'marketplace.offerIntent.offer'],
                ['REQUEST', 'marketplace.offerIntent.request'],
              ] as const
            ).map(([id, labelKey]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setListingIntent(id);
                  setStep('category');
                }}
                className={cardClass(listingIntent === id)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'category' && (
        <section>
          <button
            type="button"
            className="text-sm text-emerald-700 mb-3"
            onClick={() => setStep('intent')}
          >
            {t('marketplace.back')}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t('marketplace.entry.categoryHeading')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('marketplace.entry.categoryHint')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setMarketplaceCategory(cat);
                  setSelectedGroupId(null);
                  setSelectedSpecs([]);
                  setStep('group');
                }}
                className="rounded-xl border border-gray-200 p-3 text-left hover:border-emerald-400 hover:bg-emerald-50/50 font-medium text-gray-900"
              >
                {t(MARKETPLACE_ENTRY_CATEGORY_KEY[cat])}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'group' && (
        <section>
          <button
            type="button"
            className="text-sm text-emerald-700 mb-3"
            onClick={() => setStep('category')}
          >
            {t('marketplace.back')}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t(MARKETPLACE_ENTRY_CATEGORY_KEY[marketplaceCategory])}
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            {t('marketplace.entry.groupHeading')}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {t('marketplace.entry.groupHint')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {groupsForCategory.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setStep('items');
                }}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left font-medium transition-colors ${
                  selectedGroupId === group.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-gray-900'
                }`}
              >
                <TaxonomyLucideIcon name={group.icon} />
                {t(taxonomyGroupLabelKey(group.id))}
              </button>
            ))}
          </div>
          {selectedSpecs.length > 0 ? (
            <button
              type="button"
              onClick={goToSummary}
              className="mt-6 w-full rounded-xl border border-emerald-300 bg-white py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              {t('marketplace.entry.continueToSummary')}
            </button>
          ) : null}
        </section>
      )}

      {step === 'items' && selectedGroupId ? (
        <section>
          <button
            type="button"
            className="text-sm text-emerald-700 mb-3"
            onClick={() => setStep('group')}
          >
            {t('marketplace.back')}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t(taxonomyGroupLabelKey(selectedGroupId))}
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            {t('marketplace.entry.itemsHeading')}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {t('marketplace.entry.specializationsHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            {itemsForGroup.map((item) =>
              renderTaxonomyChip(
                item.id,
                item.icon,
                selectedSpecs.includes(item.id),
              ),
            )}
          </div>
          {message ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep('group')}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700"
            >
              {t('marketplace.entry.pickAnotherGroup')}
            </button>
            <button
              type="button"
              onClick={goToSummary}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('marketplace.entry.continueToSummary')}
            </button>
          </div>
        </section>
      ) : null}

      {step === 'summary' && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('marketplace.entry.summaryHeading')}
          </h2>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800/70 mb-1">
                {t('marketplace.entry.summaryIntentLabel')}
              </p>
              <p className="text-base font-semibold text-emerald-950">
                {listingIntent === 'REQUEST'
                  ? t('marketplace.offerIntent.request')
                  : t('marketplace.offerIntent.offer')}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800/70 mb-1">
                {t('marketplace.entry.summaryCategoryLabel')}
              </p>
              <p className="text-base font-semibold text-emerald-950">
                {t(MARKETPLACE_ENTRY_CATEGORY_KEY[marketplaceCategory])}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800/70 mb-2">
                {t('marketplace.entry.summarySpecializationsLabel')}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSpecs.map((taxonomyId) => {
                  const item = getMarketplaceTaxonomyItem(taxonomyId);
                  return (
                    <span
                      key={taxonomyId}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-3 py-1 text-sm text-emerald-900"
                    >
                      <TaxonomyLucideIcon
                        name={item?.icon ?? 'Tag'}
                        className="h-3.5 w-3.5"
                      />
                      {t(taxonomyLabelKey(taxonomyId))}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('group')}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium"
            >
              {t('marketplace.entry.editChoices')}
            </button>
            <button
              type="button"
              onClick={() =>
                onComplete({
                  listingIntent,
                  marketplaceCategory,
                  specializations: selectedSpecs,
                })
              }
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('marketplace.entry.continueToForm')}
            </button>
          </div>
        </section>
      )}

      {onCancel && step === 'intent' ? (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t('marketplace.form.cancel')}
        </button>
      ) : null}
    </div>
  );
}

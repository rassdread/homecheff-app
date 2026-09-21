'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import {
  MARKETPLACE_CATEGORIES,
  type ListingIntentValue,
} from '@/lib/marketplace/listing-taxonomy';
import {
  getMarketplaceTaxonomyItem,
  type TaxonomyEntryRole,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  compiledTaxonomyItemLabel,
  taxonomyLabelKey,
  taxonomyLabelWithFallback,
} from '@/lib/marketplace/taxonomy-i18n';
import { normalizeTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import {
  MARKETPLACE_ENTRY_CATEGORY_KEY,
  MARKETPLACE_ERROR_KEYS,
} from '@/lib/marketplace/i18n-keys';
import {
  constrainSpecializationsToOneCategory,
  getOfferAccordionGroups,
  marketplaceCategoryFromSpecializations,
} from '@/lib/marketplace/taxonomy-accordion';
import TaxonomyGroupAccordion from '@/components/products/marketplace/TaxonomyGroupAccordion';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { TAXONOMY_TONE_CLASSES } from '@/lib/marketplace/taxonomy-tone';

export type MarketplaceEntryResult = {
  listingIntent: ListingIntentValue;
  marketplaceCategory: MarketplaceCategory;
  specializations: string[];
  otherServiceLabel?: string;
};

type EntryStep = 'intent' | 'category' | 'accordion' | 'summary';

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
  const { t, language } = useTranslation();

  const normalizedInitialSpecs = useMemo(
    () => normalizeTaxonomyIds(initialSpecializations, initialCategory ?? null),
    [initialSpecializations, initialCategory],
  );

  const startStep = (): EntryStep => {
    if (initialIntent && initialCategory && normalizedInitialSpecs.length > 0) {
      return 'summary';
    }
    if (initialIntent && initialCategory) return 'accordion';
    if (initialIntent) return 'category';
    return 'intent';
  };

  const [step, setStep] = useState<EntryStep>(startStep);
  const [listingIntent, setListingIntent] = useState<ListingIntentValue>(
    initialIntent ?? 'OFFER',
  );
  const [marketplaceCategory, setMarketplaceCategory] =
    useState<MarketplaceCategory>(initialCategory ?? 'CREATE');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(normalizedInitialSpecs);
  const [otherServiceLabel, setOtherServiceLabel] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const role = intentToRole(listingIntent);

  const accordionGroups = useMemo(
    () => getOfferAccordionGroups(marketplaceCategory),
    [marketplaceCategory],
  );

  const categories = useMemo(() => {
    const all = MARKETPLACE_CATEGORIES;
    if (!allowedCategories?.length) return all;
    return all.filter((c) => allowedCategories.includes(c));
  }, [allowedCategories]);

  const goToSummary = () => {
    if (selectedSpecs.length === 0) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.specializationsRequired));
      return;
    }
    setMessage(null);
    setStep('summary');
  };

  const itemLabel = (taxonomyId: string) =>
    taxonomyLabelWithFallback(
      t(taxonomyLabelKey(taxonomyId)),
      compiledTaxonomyItemLabel(taxonomyId),
      language,
    );

  const cardClass = (active: boolean) =>
    `rounded-xl border-2 p-4 text-left font-medium transition-colors ${
      active
        ? 'border-emerald-500 bg-emerald-50'
        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
    }`;

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
                  setSelectedSpecs([]);
                  setOtherServiceLabel('');
                  setStep('accordion');
                }}
                className="rounded-xl border border-gray-200 p-3 text-left hover:border-emerald-400 hover:bg-emerald-50/50 font-medium text-gray-900"
              >
                {t(MARKETPLACE_ENTRY_CATEGORY_KEY[cat])}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'accordion' ? (
        <section className="min-w-0 overflow-x-hidden">
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
            {t('marketplace.entry.accordionHeading')}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {t('marketplace.entry.accordionHint')}
          </p>
          <TaxonomyGroupAccordion
            marketplaceCategory={marketplaceCategory}
            role={role}
            value={selectedSpecs}
            onChange={(ids) => {
              const next = constrainSpecializationsToOneCategory(ids);
              setSelectedSpecs(next);
              setMarketplaceCategory(
                marketplaceCategoryFromSpecializations(next, marketplaceCategory),
              );
              setMessage(null);
            }}
            otherLabel={otherServiceLabel}
            onOtherLabelChange={setOtherServiceLabel}
            defaultCollapsed
            groups={accordionGroups}
          />
          {message ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={goToSummary}
            className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('marketplace.entry.continueToSummary')}
          </button>
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
                  const tone = item?.tone ?? 'service';
                  return (
                    <span
                      key={taxonomyId}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${TAXONOMY_TONE_CLASSES[tone]}`}
                    >
                      <TaxonomyLucideIcon
                        name={item?.icon ?? 'Tag'}
                        className="h-3.5 w-3.5"
                        tone={tone}
                      />
                      {itemLabel(taxonomyId)}
                    </span>
                  );
                })}
              </div>
              {otherServiceLabel.trim() ? (
                <p className="mt-2 text-sm text-emerald-950">
                  {otherServiceLabel.trim()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('accordion')}
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
                  otherServiceLabel: otherServiceLabel.trim() || undefined,
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

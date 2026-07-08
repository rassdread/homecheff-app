'use client';

import { Loader2, MapPin, Search, X } from 'lucide-react';
import { RADIUS_PRESET_OPTIONS } from '@/lib/geo/local-discovery';
import type { FeedScope } from '@/lib/feed/feed-scope';
import { FEED_SCOPE_NEARBY } from '@/lib/feed/feed-scope';
import AcceptedValuesDiscoveryFilter from '@/components/feed/AcceptedValuesDiscoveryFilter';
import DiscoveryDirectionToggle, {
  type DiscoveryDirection,
} from '@/components/feed/DiscoveryDirectionToggle';

type Props = {
  open: boolean;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  place: string;
  onPlaceChange: (value: string) => void;
  onUseMyLocation: () => void;
  locationLoading: boolean;
  locationSupported: boolean;
  locationError: string | null;
  activeLocationChip: string | null;
  onClearLocation: () => void;
  showLocationHint: boolean;
  profileNeedsCoords: boolean;
  appliedScope: FeedScope;
  radius: number;
  onRadiusChange: (value: number) => void;
  q: string;
  onQChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  priceRange: { min: string; max: string };
  onPriceRangeChange: (next: { min: string; max: string }) => void;
  filtersDirty: boolean;
  onApply: () => void;
  onClear: () => void;
  appliedAcceptedValues: string[];
  onAcceptedValuesChange: (ids: string[]) => void;
  discoveryDirection: DiscoveryDirection;
  onDiscoveryDirectionChange: (direction: DiscoveryDirection) => void;
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-brand/50 focus:outline-none focus:ring-2 focus:ring-primary-brand/20';

export default function FeedMobileFilterSheet({
  open,
  onClose,
  t,
  place,
  onPlaceChange,
  onUseMyLocation,
  locationLoading,
  locationSupported,
  locationError,
  activeLocationChip,
  onClearLocation,
  showLocationHint,
  profileNeedsCoords,
  appliedScope,
  radius,
  onRadiusChange,
  q,
  onQChange,
  category,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
  priceRange,
  onPriceRangeChange,
  filtersDirty,
  onApply,
  onClear,
  appliedAcceptedValues,
  onAcceptedValuesChange,
  discoveryDirection,
  onDiscoveryDirectionChange,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-mobile-filter-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-2xl bg-[#faf8f4] shadow-2xl border border-gray-200/80">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-[#faf8f4] px-4 py-3">
          <h2 id="feed-mobile-filter-title" className="text-sm font-semibold text-gray-900">
            {t('common.filters')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            aria-label={t('buttons.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <DiscoveryDirectionToggle
            value={discoveryDirection}
            onChange={onDiscoveryDirectionChange}
            compact
          />

          {discoveryDirection === 'offer' ? (
            <AcceptedValuesDiscoveryFilter
              value={appliedAcceptedValues}
              onChange={onAcceptedValuesChange}
              compact
              offerMode
            />
          ) : null}

          {showLocationHint ? (
            <p className="text-xs text-gray-600 rounded-lg border border-primary-brand/10 bg-primary-50/40 px-3 py-2">
              {t('feed.viewerLocationHint')}
            </p>
          ) : null}
          {profileNeedsCoords ? (
            <p className="text-xs text-amber-800 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2">
              {t('feed.completeProfileLocationHint')}
            </p>
          ) : null}

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('common.place')}
            </label>
            <input
              value={place}
              onChange={(e) => onPlaceChange(e.target.value)}
              className={inputClass}
              placeholder={t('common.typePlaceOrPostcode')}
              autoComplete="postal-code"
            />
            <button
              type="button"
              onClick={onUseMyLocation}
              disabled={locationLoading || !locationSupported}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-brand/30 bg-white px-4 py-2.5 text-sm font-semibold text-primary-brand hover:bg-primary-50 disabled:opacity-50 touch-manipulation"
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4" aria-hidden />
              )}
              {t('feed.useMyLocation')}
            </button>
            {locationError ? (
              <p className="mt-1.5 text-xs text-red-600">{t('common.locationCouldNotBeDetermined')}</p>
            ) : null}
            {activeLocationChip ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  {activeLocationChip}
                </span>
                <button
                  type="button"
                  onClick={onClearLocation}
                  className="text-[11px] font-semibold text-gray-600 underline"
                >
                  {t('feed.clearLocation')}
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('feed.radiusLabel')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {RADIUS_PRESET_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  disabled={appliedScope !== FEED_SCOPE_NEARBY}
                  onClick={() => onRadiusChange(km)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold touch-manipulation disabled:opacity-40 ${
                    radius === km
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {km === 0 ? t('feed.radiusNational') : `${km} km`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={radius}
              disabled={appliedScope !== FEED_SCOPE_NEARBY}
              onChange={(e) =>
                onRadiusChange(Math.max(0, Math.min(100, Number(e.target.value))))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('common.search')}
            </label>
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              className={inputClass}
              placeholder={t('common.searchPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('common.category')}
            </label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={inputClass}
            >
              <option value="all">{t('common.allCategories')}</option>
              <option value="cheff">{t('feed.categoryVerticalCheff')}</option>
              <option value="garden">{t('feed.categoryVerticalGarden')}</option>
              <option value="designer">{t('feed.categoryVerticalDesigner')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('feed.refineSectionLabel')}
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={t('common.searchInProductsSimple')}
                className={`${inputClass} pl-10`}
              />
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('common.priceEuro')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
                placeholder={t('common.min')}
                className={inputClass}
              />
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
                placeholder={t('filters.maxPricePlaceholder')}
                className={inputClass}
              />
            </div>
            {discoveryDirection === 'want' ? (
              <AcceptedValuesDiscoveryFilter
                value={appliedAcceptedValues}
                onChange={onAcceptedValuesChange}
                compact
              />
            ) : null}
          </div>

          {filtersDirty ? (
            <p className="text-xs text-amber-700">{t('feed.filtersPendingHint')}</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gray-200/80 bg-[#faf8f4] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 touch-manipulation"
          >
            {t('filters.clearFilters')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white touch-manipulation"
          >
            {t('feed.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}

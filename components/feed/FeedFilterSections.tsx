'use client';

import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useId, useState, type Ref } from 'react';
import AcceptedValuesDiscoveryFilter from '@/components/feed/AcceptedValuesDiscoveryFilter';
import DiscoveryDirectionToggle, {
  type DiscoveryDirection,
} from '@/components/feed/DiscoveryDirectionToggle';
import type { FeedScope } from '@/lib/feed/feed-scope';
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
} from '@/lib/feed/feed-scope';
import { FEED_RADIUS_DEFAULT_KM, FEED_RADIUS_UI_OPTIONS } from '@/lib/geo/local-discovery';
import {
  BROWSE_COUNTRY_OPTIONS,
  countryOptionLabel,
} from '@/lib/geo/structured-location';
import { DISCOVERY_CATEGORY_CHIP_OPTIONS } from '@/lib/marketplace/canonical-model';

const inputClass =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-brand/50 focus:outline-none focus:ring-2 focus:ring-primary-brand/20';

const sectionLabel =
  'text-[10px] font-semibold uppercase tracking-wide text-gray-500';

export type FeedFilterSectionsProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
  place: string;
  onPlaceChange: (value: string) => void;
  placeInputRef?: Ref<HTMLInputElement>;
  onUseMyLocation: () => void;
  locationLoading: boolean;
  locationError: string | null;
  activeLocationChip: string | null;
  onClearLocation: () => void;
  showLocationHint: boolean;
  profileNeedsCoords: boolean;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  locationMode: 'point' | 'country' | 'region' | 'global';
  scope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
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
  appliedAcceptedValues: string[];
  onAcceptedValuesChange: (ids: string[]) => void;
  discoveryDirection: DiscoveryDirection;
  onDiscoveryDirectionChange: (direction: DiscoveryDirection) => void;
  filtersDirty?: boolean;
  showActions?: boolean;
  onApply?: () => void;
  onClear?: () => void;
  placeTestId?: string;
  countryTestId?: string;
  radiusTestId?: string;
  /** The feed chrome already shows this query. Hide it when that chrome stays visible. */
  showLoadedResultSearch?: boolean;
};

/**
 * One progressive filter body for the mobile sheet, the desktop panel, and
 * the workspace rail. State stays in GeoFeed.
 */
export default function FeedFilterSections(props: FeedFilterSectionsProps) {
  const { t, scope } = props;
  const queryId = useId();
  const placeId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(props.appliedAcceptedValues.length > 0);
  const nearby = scope === FEED_SCOPE_NEARBY;
  const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

  if (props.category && props.category !== 'all') {
    const match = DISCOVERY_CATEGORY_CHIP_OPTIONS.find((option) => option.slug === props.category);
    chips.push({
      id: 'category',
      label: match ? t(match.labelKey) : props.category,
      onRemove: () => props.onCategoryChange('all'),
    });
  }
  if (scope === FEED_SCOPE_NATIONAL) {
    chips.push({
      id: 'scope',
      label: t('feed.scopeNational'),
      onRemove: () => props.onScopeChange(FEED_SCOPE_NEARBY),
    });
  }
  if (scope === FEED_SCOPE_INTERNATIONAL) {
    chips.push({
      id: 'scope',
      label: t('feed.scopeInternational'),
      onRemove: () => props.onScopeChange(FEED_SCOPE_NEARBY),
    });
  }
  if (nearby && props.radius !== FEED_RADIUS_DEFAULT_KM) {
    chips.push({
      id: 'radius',
      label: props.radius === 0 ? t('feed.radiusUnlimited') : `${props.radius} km`,
      onRemove: () => props.onRadiusChange(FEED_RADIUS_DEFAULT_KM),
    });
  }
  if (props.q.trim()) {
    chips.push({
      id: 'q',
      label: props.q.trim(),
      onRemove: () => props.onQChange(''),
    });
  }
  if (props.searchQuery.trim()) {
    chips.push({
      id: 'loaded',
      label: props.searchQuery.trim(),
      onRemove: () => props.onSearchQueryChange(''),
    });
  }
  if (props.appliedAcceptedValues.length > 0) {
    chips.push({
      id: 'values',
      label: t('marketplace.discovery.acceptedValuesFilter.activeLabel'),
      onRemove: () => props.onAcceptedValuesChange([]),
    });
  }
  if (props.priceRange.min || props.priceRange.max) {
    chips.push({
      id: 'price',
      label: t('common.priceEuro'),
      onRemove: () => props.onPriceRangeChange({ min: '', max: '' }),
    });
  }

  return (
    <div className="space-y-4" data-hc-filter-sections="">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" data-hc-active-filters="">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-900"
            >
              <span className="truncate">{chip.label}</span>
              <X className="h-3 w-3 shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      <section>
        <label className={`mb-1.5 block ${sectionLabel}`} htmlFor={queryId}>
          {t('common.search')}
        </label>
        <input
          id={queryId}
          value={props.q}
          onChange={(event) => props.onQChange(event.target.value)}
          className={inputClass}
          placeholder={t('common.searchPlaceholder')}
        />
      </section>

      <section>
        <p className={`mb-1.5 ${sectionLabel}`}>{t('common.category')}</p>
        <div className="flex flex-wrap gap-1.5">
          {DISCOVERY_CATEGORY_CHIP_OPTIONS.map(({ slug, labelKey }) => {
            const selected = props.category === slug;
            return (
              <button
                key={slug}
                type="button"
                aria-pressed={selected}
                onClick={() => props.onCategoryChange(slug)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  selected ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className={`mb-1.5 ${sectionLabel}`}>{t('feed.filterLocationHeading')}</p>
        <select
          value={props.countryCode || ''}
          onChange={(event) => props.onCountryCodeChange(event.target.value)}
          className={inputClass}
          aria-label={t('feed.countryLabel')}
          data-testid={props.countryTestId ?? 'feed-country-select'}
        >
          <option value="">{t('feed.countryGlobalOption')}</option>
          {BROWSE_COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {countryOptionLabel(country.code)}
            </option>
          ))}
        </select>
        {props.locationMode === 'country' && props.countryCode ? (
          <p className="mt-1.5 text-[11px] text-emerald-800">
            {t('feed.showingCountryBoundary', {
              country: countryOptionLabel(props.countryCode),
            })}
          </p>
        ) : null}
        <div
          className="mt-2 grid grid-cols-1 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1"
          role="group"
          aria-label={t('feed.scopeLabel')}
        >
          {(
            [
              [FEED_SCOPE_NEARBY, 'feed.scopeNearby'],
              [FEED_SCOPE_NATIONAL, 'feed.scopeNational'],
              [FEED_SCOPE_INTERNATIONAL, 'feed.scopeInternational'],
            ] as const
          ).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              aria-pressed={scope === id}
              onClick={() => props.onScopeChange(id)}
              className={`rounded-lg px-2.5 py-2 text-left text-xs font-semibold ${
                scope === id ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        {scope === FEED_SCOPE_INTERNATIONAL ? (
          <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
            {t('feed.scopeInternationalHint')}
          </p>
        ) : null}
        {!nearby ? (
          <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
            {t('feed.radiusNotUsedHint')}
          </p>
        ) : null}

        <label className={`mb-1.5 mt-3 block ${sectionLabel}`} htmlFor={placeId}>
          {t('common.place')}
        </label>
        <input
          id={placeId}
          ref={props.placeInputRef}
          type="text"
          value={props.place}
          onChange={(event) => props.onPlaceChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (props.place.trim()) props.onApply?.();
            }
          }}
          className={`${inputClass} text-base`}
          placeholder={t('common.typePlaceOrPostcode')}
          autoComplete="postal-code"
          data-testid={props.placeTestId ?? 'feed-place-input'}
          aria-label={t('common.place')}
        />
        <button
          type="button"
          onClick={props.onUseMyLocation}
          disabled={props.locationLoading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-brand/30 bg-white px-3 py-2 text-sm font-semibold text-primary-brand disabled:opacity-50"
        >
          {props.locationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          {t('feed.useMyLocation')}
        </button>
        {props.locationError ? (
          <p className="mt-1.5 text-xs text-red-600" role="alert" data-testid="feed-gps-error">
            {props.locationError}
          </p>
        ) : null}
        {props.showLocationHint ? (
          <p className="mt-1.5 text-[11px] text-gray-600">{t('feed.viewerLocationHint')}</p>
        ) : null}
        {props.profileNeedsCoords ? (
          <p className="mt-1.5 text-[11px] text-amber-800">{t('feed.completeProfileLocationHint')}</p>
        ) : null}
        {props.activeLocationChip ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
              {props.activeLocationChip}
            </span>
            <button
              type="button"
              onClick={props.onClearLocation}
              className="text-[11px] font-semibold text-gray-600 underline"
            >
              {t('feed.clearLocation')}
            </button>
          </div>
        ) : null}

        {nearby ? (
          <div className="mt-3" data-testid={props.radiusTestId ?? 'feed-mobile-radius'}>
            <p className={`mb-1.5 ${sectionLabel}`}>{t('feed.radiusLabel')}</p>
            <div className="flex flex-wrap gap-1.5">
              {FEED_RADIUS_UI_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  aria-pressed={props.radius === km}
                  onClick={() => props.onRadiusChange(km)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    props.radius === km ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {km === 0 ? t('feed.radiusUnlimited') : `${km} km`}
                </button>
              ))}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-medium text-gray-500">
                {t('feed.radiusOther')}
              </summary>
              <input
                type="number"
                min={0}
                max={100}
                value={props.radius}
                onChange={(event) =>
                  props.onRadiusChange(Math.max(0, Math.min(100, Number(event.target.value))))
                }
                className={`${inputClass} mt-1.5`}
                aria-label={t('feed.radiusLabel')}
              />
            </details>
          </div>
        ) : null}
      </section>

      <section>
        <p className={`mb-1.5 ${sectionLabel}`}>{t('common.price')}</p>
        {props.showLoadedResultSearch === false ? null : (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="text"
              value={props.searchQuery}
              onChange={(event) => props.onSearchQueryChange(event.target.value)}
              placeholder={t('common.searchInProductsSimple')}
              className={`${inputClass} pl-10`}
              aria-label={t('feed.refineSectionLabel')}
            />
          </div>
        )}
        <label className="mb-1 block text-xs font-medium text-gray-700">{t('common.priceEuro')}</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={props.priceRange.min}
            onChange={(event) =>
              props.onPriceRangeChange({ ...props.priceRange, min: event.target.value })
            }
            placeholder={t('common.min')}
            className={inputClass}
          />
          <input
            type="number"
            value={props.priceRange.max}
            onChange={(event) =>
              props.onPriceRangeChange({ ...props.priceRange, max: event.target.value })
            }
            placeholder={t('filters.maxPricePlaceholder')}
            className={inputClass}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white px-3 py-2" data-hc-filter-advanced="">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"
          aria-expanded={advancedOpen || props.appliedAcceptedValues.length > 0}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {t('feed.filterAdvancedHeading')}
        </button>
        {advancedOpen || props.appliedAcceptedValues.length > 0 ? (
        <div className="mt-3 space-y-3">
          <DiscoveryDirectionToggle
            value={props.discoveryDirection}
            onChange={props.onDiscoveryDirectionChange}
            compact
            quiet
          />
          <AcceptedValuesDiscoveryFilter
            value={props.appliedAcceptedValues}
            onChange={props.onAcceptedValuesChange}
            compact
            offerMode={props.discoveryDirection === 'offer'}
          />
        </div>
        ) : null}
      </section>

      {props.filtersDirty ? (
        <p className="text-xs text-amber-700">{t('feed.filtersPendingHint')}</p>
      ) : null}

      {props.showActions ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={props.onClear}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700"
          >
            {t('filters.clearFilters')}
          </button>
          <button
            type="button"
            onClick={props.onApply}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white"
          >
            {t('feed.applyFilters')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

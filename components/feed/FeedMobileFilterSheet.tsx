'use client';

import { useEffect, useRef, type Ref } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { RADIUS_PRESET_OPTIONS } from '@/lib/geo/local-discovery';
import {
  BROWSE_COUNTRY_OPTIONS,
  countryOptionLabel,
} from '@/lib/geo/structured-location';
import type { FeedScope } from '@/lib/feed/feed-scope';
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
} from '@/lib/feed/feed-scope';
import AcceptedValuesDiscoveryFilter from '@/components/feed/AcceptedValuesDiscoveryFilter';
import DiscoveryDirectionToggle, {
  type DiscoveryDirection,
} from '@/components/feed/DiscoveryDirectionToggle';
import { DISCOVERY_CATEGORY_CHIP_OPTIONS } from '@/lib/marketplace/canonical-model';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Focus the place/postcode field when the sheet opens (manual location entry). */
  focusPlaceOnOpen?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  place: string;
  onPlaceChange: (value: string) => void;
  placeInputRef?: Ref<HTMLInputElement>;
  onUseMyLocation: () => void;
  locationLoading: boolean;
  locationSupported: boolean;
  locationError: string | null;
  activeLocationChip: string | null;
  onClearLocation: () => void;
  showLocationHint: boolean;
  profileNeedsCoords: boolean;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  locationMode: 'point' | 'country' | 'region' | 'global';
  appliedScope: FeedScope;
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

/** 16px avoids iOS input-zoom; keeps Android soft-keyboard focus stable. */
const placeInputClass = `${inputClass} text-base`;

export default function FeedMobileFilterSheet({
  open,
  onClose,
  focusPlaceOnOpen = false,
  t,
  place,
  onPlaceChange,
  placeInputRef,
  onUseMyLocation,
  locationLoading,
  locationSupported,
  locationError,
  activeLocationChip,
  onClearLocation,
  showLocationHint,
  profileNeedsCoords,
  countryCode,
  onCountryCodeChange,
  locationMode,
  appliedScope,
  onScopeChange,
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const localPlaceRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const focusPlaceOnOpenRef = useRef(focusPlaceOnOpen);
  onCloseRef.current = onClose;
  focusPlaceOnOpenRef.current = focusPlaceOnOpen;

  const setPlaceRef = (el: HTMLInputElement | null) => {
    localPlaceRef.current = el;
    if (!placeInputRef) return;
    if (typeof placeInputRef === 'function') {
      placeInputRef(el);
    } else {
      (placeInputRef as { current: HTMLInputElement | null }).current = el;
    }
  };

  /**
   * Focus lifecycle depends ONLY on `open`.
   * Prior bug: deps included unstable `onClose` (inline from GeoFeed). Every
   * parent re-render (including each keystroke via setPlace) re-ran cleanup,
   * which called previousFocus.focus() and stole focus from the place input —
   * soft keyboard never stayed open on Android WebView / Chrome.
   */
  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement as HTMLElement | null;
    let cancelled = false;

    const focusTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (focusPlaceOnOpenRef.current) {
        const el = localPlaceRef.current;
        if (el) {
          // No select() — select-all after programmatic focus suppresses soft
          // keyboard on several Android WebViews.
          el.focus({ preventScroll: false });
          el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          return;
        }
      }
      const active = document.activeElement;
      const panel = panelRef.current;
      if (
        !active ||
        active === document.body ||
        (panel && !panel.contains(active))
      ) {
        closeButtonRef.current?.focus();
      }
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelled = true;
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      // Safe: this effect only re-runs when `open` flips or the sheet unmounts.
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-mobile-filter-title"
      data-testid="feed-mobile-filter-sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-h-[88vh] overflow-y-auto rounded-t-2xl bg-[#faf8f4] shadow-2xl border border-gray-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-[#faf8f4] px-4 py-3">
          <h2 id="feed-mobile-filter-title" className="text-sm font-semibold text-gray-900">
            {t('common.filters')}
          </h2>
          <button
            ref={closeButtonRef}
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
            showTagline
          />

          <section className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-2.5">
            <AcceptedValuesDiscoveryFilter
              value={appliedAcceptedValues}
              onChange={onAcceptedValuesChange}
              compact
              offerMode={discoveryDirection === 'offer'}
            />
          </section>

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
              {t('feed.countryLabel')}
            </label>
            <select
              value={countryCode || ''}
              onChange={(e) => onCountryCodeChange(e.target.value)}
              className={inputClass}
              data-testid="feed-country-select-mobile"
            >
              <option value="">{t('feed.countryGlobalOption')}</option>
              {BROWSE_COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryOptionLabel(c.code)}
                </option>
              ))}
            </select>
            {locationMode === 'country' && countryCode ? (
              <p className="mt-1.5 text-[11px] text-emerald-800">
                {t('feed.showingCountryBoundary', {
                  country: countryOptionLabel(countryCode),
                })}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('feed.scopeLabel')}
            </label>
            <div className="grid grid-cols-1 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
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
                  onClick={() => onScopeChange(id)}
                  className={`rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors touch-manipulation ${
                    appliedScope === id
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-pressed={appliedScope === id}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div data-testid="feed-mobile-place-field">
            <label
              htmlFor="feed-mobile-place-input"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5"
            >
              {t('common.place')}
            </label>
            <input
              id="feed-mobile-place-input"
              ref={setPlaceRef}
              type="text"
              value={place}
              onChange={(e) => onPlaceChange(e.target.value)}
              onPointerDown={(e) => {
                // Synchronous focus inside the user gesture — required for soft
                // keyboard on Android Chrome / Capacitor WebView. Do not preventDefault.
                const el = e.currentTarget;
                if (document.activeElement !== el) {
                  el.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (place.trim()) onApply();
                }
              }}
              className={placeInputClass}
              placeholder={t('common.typePlaceOrPostcode')}
              autoComplete="postal-code"
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              data-testid="feed-place-input"
              aria-label={t('common.place')}
            />
            <button
              type="button"
              onClick={onUseMyLocation}
              disabled={locationLoading}
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
              <p
                className="mt-1.5 text-xs text-red-600"
                role="alert"
                data-testid="feed-gps-error"
              >
                {locationError}
              </p>
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

          <div data-testid="feed-mobile-radius" id="feed-mobile-radius">
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
              {DISCOVERY_CATEGORY_CHIP_OPTIONS.filter((o) => o.slug !== 'all').map(
                ({ slug, labelKey }) => (
                  <option key={slug} value={slug}>
                    {t(labelKey)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {t('feed.refineSectionLabel')}
            </label>
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
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

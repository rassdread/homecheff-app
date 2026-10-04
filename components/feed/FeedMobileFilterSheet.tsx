'use client';

import { useEffect, useRef, type Ref } from 'react';
import { X } from 'lucide-react';
import type { FeedScope } from '@/lib/feed/feed-scope';
import FeedFilterSections from '@/components/feed/FeedFilterSections';
import type { DiscoveryDirection } from '@/components/feed/DiscoveryDirectionToggle';

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
        className="mb-[6.5rem] w-full max-h-[calc(100dvh-7.25rem)] overflow-y-auto rounded-t-2xl border border-gray-200/80 bg-[#faf8f4] shadow-2xl lg:mb-0"
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
          <FeedFilterSections
            t={t}
            place={place}
            onPlaceChange={onPlaceChange}
            placeInputRef={setPlaceRef}
            onUseMyLocation={onUseMyLocation}
            locationLoading={locationLoading}
            locationError={locationError}
            activeLocationChip={activeLocationChip}
            onClearLocation={onClearLocation}
            showLocationHint={showLocationHint}
            profileNeedsCoords={profileNeedsCoords}
            countryCode={countryCode}
            onCountryCodeChange={onCountryCodeChange}
            locationMode={locationMode}
            scope={appliedScope}
            onScopeChange={onScopeChange}
            radius={radius}
            onRadiusChange={onRadiusChange}
            q={q}
            onQChange={onQChange}
            category={category}
            onCategoryChange={onCategoryChange}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            priceRange={priceRange}
            onPriceRangeChange={onPriceRangeChange}
            appliedAcceptedValues={appliedAcceptedValues}
            onAcceptedValuesChange={onAcceptedValuesChange}
            discoveryDirection={discoveryDirection}
            onDiscoveryDirectionChange={onDiscoveryDirectionChange}
            filtersDirty={filtersDirty}
            onApply={onApply}
            countryTestId="feed-country-select-mobile"
            radiusTestId="feed-mobile-radius"
          />
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

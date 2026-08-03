'use client';

import { Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedChip } from '@/lib/feed/feed-taxonomy';
import type { FeedScope } from '@/lib/feed/feed-scope';
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
} from '@/lib/feed/feed-scope';
import type { FeedClientSortField } from '@/lib/feed/feed-client-sort';
import FeedLayoutToggle from '@/components/feed/FeedLayoutToggle';
import type { FeedLayoutMode } from '@/lib/feed/feedLayoutPreference';
import {
  DISCOVERY_CATEGORY_CHIP_OPTIONS,
  DISCOVERY_VIEW_CHIP_OPTIONS,
} from '@/lib/marketplace/canonical-model';
import {
  MOBILE_FEED_FILTER_STICKY_BELOW_NAV,
  MOBILE_FEED_FILTER_STICKY_TOP,
} from '@/lib/feed/mobile-filter-sticky';

type SortId = 'newest' | 'price' | 'views' | 'distance';

type Props = {
  t: (key: string, params?: Record<string, string | number>) => string;
  feedChip: FeedChip;
  onFeedChipChange: (chip: FeedChip) => void;
  appliedCategory: string;
  onCategoryChange: (slug: string) => void;
  appliedScope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  sortBy: SortId;
  sortOrder: 'asc' | 'desc';
  sortOptions: readonly { id: SortId; label: string }[];
  onSort: (field: FeedClientSortField) => void;
  onOpenFilters: () => void;
  filterActive: boolean;
  activeFilterCount: number;
  /** When true, show compact sticky bar (scroll-down state). */
  collapsed: boolean;
  /** When false, main header has scrolled away — pin filter to top edge. */
  navPinned?: boolean;
  feedLayoutMode: FeedLayoutMode;
  onFeedLayoutModeChange: (mode: FeedLayoutMode) => void;
  /** WX 1C.1 — immediately discoverable search. */
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  /** WX 1C.1.1 — trade as a visible Workspace action. */
  onActivateTrade?: () => void;
  tradeActive?: boolean;
};

const chipClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors touch-manipulation',
    active
      ? 'bg-primary-brand text-white shadow-sm'
      : 'bg-[#faf8f4] text-gray-700 border border-gray-200/80'
  );

const scopeClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors touch-manipulation',
    active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
  );

function collapsedFilterAriaLabel(
  t: Props['t'],
  filterActive: boolean,
  activeFilterCount: number,
): string {
  if (filterActive && activeFilterCount > 0) {
    return t('feed.mobileFilterCollapsedAriaActive', { count: activeFilterCount });
  }
  return t('feed.mobileFilterCollapsedAria');
}

export default function FeedMobileToolbar({
  t,
  feedChip,
  onFeedChipChange,
  appliedCategory,
  onCategoryChange,
  appliedScope,
  onScopeChange,
  sortBy,
  sortOptions,
  onSort,
  onOpenFilters,
  filterActive,
  activeFilterCount,
  collapsed,
  navPinned = true,
  feedLayoutMode,
  onFeedLayoutModeChange,
  searchQuery,
  onSearchQueryChange,
  workCompact = false,
  onActivateTrade,
  tradeActive = false,
}: Props) {
  const scopes = [
    [FEED_SCOPE_NEARBY, 'feed.scopeNearby'],
    [FEED_SCOPE_NATIONAL, 'feed.scopeNational'],
    [FEED_SCOPE_INTERNATIONAL, 'feed.scopeInternational'],
  ] as const;

  const viewLabel =
    DISCOVERY_VIEW_CHIP_OPTIONS.find((o) => o.legacyChip === feedChip)?.labelKey;
  const categoryLabel = DISCOVERY_CATEGORY_CHIP_OPTIONS.find(
    (o) => o.slug === appliedCategory,
  )?.labelKey;

  const searchField = (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{t('common.searchInProductsSimple')}</span>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        data-wx-feed-search=""
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t('common.searchInProductsSimple')}
        className="w-full min-h-[40px] rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-brand/50 focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
      />
    </label>
  );

  if (collapsed) {
    return (
      <div
        className={cn(
          'sticky z-40 mb-0 border-b border-gray-200/90 bg-white px-2 py-1.5 shadow-sm',
          navPinned ? MOBILE_FEED_FILTER_STICKY_BELOW_NAV : MOBILE_FEED_FILTER_STICKY_TOP,
        )}
        data-mobile-filter-collapsed="true"
      >
        <div className="flex items-center gap-2">
          {searchField}
          <button
            type="button"
            onClick={onOpenFilters}
            className={cn(
              'inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold touch-manipulation',
              filterActive
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-gray-200 bg-[#faf8f4] text-gray-800',
            )}
            aria-label={collapsedFilterAriaLabel(t, filterActive, activeFilterCount)}
            aria-expanded={false}
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t('common.filters')}</span>
            {filterActive && activeFilterCount > 0 ? (
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          {filterActive ? (
            <p className="min-w-0 max-w-[30%] truncate text-[10px] text-gray-600">
              {viewLabel ? t(viewLabel) : null}
              {categoryLabel && appliedCategory !== 'all' ? ` · ${t(categoryLabel)}` : null}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-2 space-y-2 rounded-xl border border-gray-200/80 bg-white px-2 py-2 shadow-sm',
        workCompact && 'space-y-1.5 py-1.5',
      )}
      data-mobile-filter-collapsed="false"
      data-wx-work-compact={workCompact ? '1' : '0'}
      aria-expanded={true}
    >
      <div className="flex items-center gap-2">{searchField}</div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DISCOVERY_VIEW_CHIP_OPTIONS.map(({ legacyChip, labelKey }) => (
          <button
            key={legacyChip}
            type="button"
            className={chipClass(feedChip === legacyChip)}
            onClick={() => onFeedChipChange(legacyChip)}
          >
            {t(labelKey)}
          </button>
        ))}
        {onActivateTrade ? (
          <button
            type="button"
            data-wx-trade-action=""
            className={chipClass(tradeActive)}
            onClick={onActivateTrade}
            aria-pressed={tradeActive}
            title={t('feed.tradeActionHint')}
          >
            {t('feed.tradeActionChip')}
          </button>
        ) : null}
      </div>

      {!workCompact ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DISCOVERY_CATEGORY_CHIP_OPTIONS.map(({ slug, labelKey }) => (
              <button
                key={slug}
                type="button"
                className={chipClass(appliedCategory === slug)}
                onClick={() => onCategoryChange(slug)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {scopes.map(([id, labelKey]) => (
              <button
                key={id}
                type="button"
                className={scopeClass(appliedScope === id)}
                onClick={() => onScopeChange(id)}
                aria-pressed={appliedScope === id}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-2">
        {!workCompact ? (
          <>
            <label className="sr-only" htmlFor="feed-mobile-sort">
              {t('common.sortBy')}
            </label>
            <select
              id="feed-mobile-sort"
              value={sortBy}
              onChange={(e) => onSort(e.target.value as FeedClientSortField)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-[#faf8f4] px-2 py-1.5 text-xs font-medium text-gray-800"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FeedLayoutToggle mode={feedLayoutMode} onChange={onFeedLayoutModeChange} compact />
          </>
        ) : (
          <FeedLayoutToggle mode={feedLayoutMode} onChange={onFeedLayoutModeChange} compact />
        )}
        <button
          type="button"
          onClick={onOpenFilters}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold touch-manipulation',
            workCompact && 'ml-auto',
            filterActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-gray-200 bg-gray-50 text-gray-800',
          )}
          aria-label={t('common.filters')}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden />
          {t('common.filters')}
          {filterActive && activeFilterCount > 0 ? (
            <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

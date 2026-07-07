'use client';

import { Filter } from 'lucide-react';
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

type SortId = 'newest' | 'price' | 'views' | 'distance';

type Props = {
  t: (key: string, params?: Record<string, string | number>) => string;
  feedChip: FeedChip;
  onFeedChipChange: (chip: FeedChip) => void;
  appliedScope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  sortBy: SortId;
  sortOrder: 'asc' | 'desc';
  sortOptions: readonly { id: SortId; label: string }[];
  onSort: (field: FeedClientSortField) => void;
  onOpenFilters: () => void;
  filterActive: boolean;
  feedLayoutMode: FeedLayoutMode;
  onFeedLayoutModeChange: (mode: FeedLayoutMode) => void;
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

export default function FeedMobileToolbar({
  t,
  feedChip,
  onFeedChipChange,
  appliedScope,
  onScopeChange,
  sortBy,
  sortOptions,
  onSort,
  onOpenFilters,
  filterActive,
  feedLayoutMode,
  onFeedLayoutModeChange,
}: Props) {
  const scopes = [
    [FEED_SCOPE_NEARBY, 'feed.scopeNearby'],
    [FEED_SCOPE_NATIONAL, 'feed.scopeNational'],
    [FEED_SCOPE_INTERNATIONAL, 'feed.scopeInternational'],
  ] as const;

  return (
    <div className="sticky top-[3.25rem] z-30 -mx-0.5 mb-2 space-y-2 rounded-xl border border-gray-200/80 bg-white px-2 py-2 shadow-sm">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" className={chipClass(feedChip === 'all')} onClick={() => onFeedChipChange('all')}>
          {t('filters.all')}
        </button>
        <button type="button" className={chipClass(feedChip === 'sale')} onClick={() => onFeedChipChange('sale')}>
          {t('feed.chipSale')}
        </button>
        <button
          type="button"
          className={chipClass(feedChip === 'gezocht')}
          onClick={() => onFeedChipChange('gezocht')}
        >
          {t('marketplace.discovery.requests.chip')}
        </button>
        <button
          type="button"
          className={chipClass(feedChip === 'services')}
          onClick={() => onFeedChipChange('services')}
        >
          {t('feed.chipServices')}
        </button>
        <button
          type="button"
          className={chipClass(feedChip === 'inspiration')}
          onClick={() => onFeedChipChange('inspiration')}
        >
          {t('feed.chipInspiration')}
        </button>
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

      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={onOpenFilters}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold touch-manipulation',
            filterActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-gray-200 bg-gray-50 text-gray-800'
          )}
          aria-label={t('common.filters')}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden />
          {t('common.filters')}
          {filterActive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          ) : null}
        </button>
      </div>
    </div>
  );
}

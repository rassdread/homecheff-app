'use client';

import { Plus, Search } from 'lucide-react';
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NEARBY,
  type FeedScope,
} from '@/lib/feed/feed-scope';

type Props = {
  t: (key: string, params?: Record<string, string | number>) => string;
  exactMatchCount: number;
  searchQuery: string;
  appliedScope: FeedScope;
  appliedRadius: number;
  onCreate: () => void;
  onRequest: () => void;
  onTrade: () => void;
  onFocusSearch: () => void;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  onUseMyLocation: () => void;
  onWidenRadius: () => void;
  onViewNearby: () => void;
};

/**
 * Soft continuity band — never replaces the discovery feed grid.
 */
export default function DiscoveryContinuityBand({
  t,
  exactMatchCount,
  searchQuery,
  appliedScope,
  appliedRadius,
  onCreate,
  onRequest,
  onTrade,
  onFocusSearch,
  onOpenFilters,
  onClearFilters,
  onUseMyLocation,
  onWidenRadius,
  onViewNearby,
}: Props) {
  const q = searchQuery.trim();
  const isEmpty = exactMatchCount <= 0;
  const title = isEmpty
    ? q
      ? t('feed.continuityEmptySearchTitle', { query: q })
      : t('feed.emptyConfirmedTitle')
    : t('feed.continuitySparseTitle', { count: exactMatchCount });
  const body = isEmpty
    ? q
      ? t('feed.continuityEmptySearchBody', { query: q })
      : t('feed.emptyConfirmedBody')
    : t('feed.continuitySparseBody');

  return (
    <div
      className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-muted-foreground"
      data-testid="feed-discovery-continuity-band"
      data-wx-empty-guidance=""
      data-wx-discovery-continuity="1"
      role="status"
    >
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-gray-700">{body}</p>
      <p className="mt-2 text-xs text-emerald-800/90" data-wx-scope-hint="">
        {appliedScope === FEED_SCOPE_NEARBY
          ? t('feed.scopeNearbyFirstHint')
          : appliedScope === FEED_SCOPE_INTERNATIONAL
            ? t('feed.scopeWiderInternationalHint')
            : t('feed.scopeWiderNationalHint')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-wx-empty-create=""
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {t('feed.continuityBeFirst')}
        </button>
        <button
          type="button"
          data-wx-empty-request=""
          onClick={onRequest}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('feed.emptyConfirmedRequest')}
        </button>
        <button
          type="button"
          data-wx-empty-trade=""
          onClick={onTrade}
          className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          {t('feed.emptyConfirmedTrade')}
        </button>
        <button
          type="button"
          data-wx-empty-search=""
          onClick={onFocusSearch}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          {t('common.searchInProductsSimple')}
        </button>
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('feed.emptyConfirmedAdjustFilters')}
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('feed.emptyConfirmedClearFilters')}
        </button>
        <button
          type="button"
          onClick={onUseMyLocation}
          className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
        >
          {t('feed.useMyLocation')}
        </button>
        {appliedScope === FEED_SCOPE_NEARBY ? (
          <button
            type="button"
            onClick={onWidenRadius}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('feed.emptyConfirmedWidenArea')}
            {appliedRadius > 0 ? ` (${appliedRadius} km)` : ''}
          </button>
        ) : (
          <button
            type="button"
            onClick={onViewNearby}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('feed.scopeNearby')}
          </button>
        )}
        <a
          href="/auth/register"
          data-wx-empty-invite=""
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t('feed.emptyConfirmedInvite')}
        </a>
      </div>
      <p className="mt-3 text-xs font-medium text-emerald-900/80">
        {t('feed.continuityContinueHint')}
      </p>
    </div>
  );
}

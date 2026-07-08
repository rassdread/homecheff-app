"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RADIUS_PRESET_OPTIONS,
} from "@/lib/geo/local-discovery";
import type { FeedScope } from "@/lib/feed/feed-scope";
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
} from "@/lib/feed/feed-scope";
import type { FeedClientSortField } from "@/lib/feed/feed-client-sort";
import { DISCOVERY_CATEGORY_CHIP_OPTIONS } from "@/lib/marketplace/canonical-model";
import AcceptedValuesDiscoveryFilter from '@/components/feed/AcceptedValuesDiscoveryFilter';
import DiscoveryDirectionToggle, {
  type DiscoveryDirection,
} from '@/components/feed/DiscoveryDirectionToggle';

type SortId = "newest" | "price" | "views" | "distance";

export type FeedSidebarFiltersProps = {
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
  sortBy: SortId;
  sortOrder: "asc" | "desc";
  onSort: (field: FeedClientSortField) => void;
  sortOptions: readonly { id: SortId; label: string }[];
  /** Distance sort available (international always; nearby when viewer coords known). */
  distanceSortEnabled: boolean;
  priceRange: { min: string; max: string };
  onPriceRangeChange: (next: { min: string; max: string }) => void;
  refineOpen: boolean;
  onRefineOpenChange: (open: boolean) => void;
  filtersDirty: boolean;
  onApply: () => void;
  onResetDraft: () => void;
  /** Phase 8B — reverse discovery on accepted counter-values (client-side). */
  appliedAcceptedValues: string[];
  onAcceptedValuesChange: (ids: string[]) => void;
  /** Phase 8C — bidirectional discovery direction. */
  discoveryDirection: DiscoveryDirection;
  onDiscoveryDirectionChange: (direction: DiscoveryDirection) => void;
  /** Phase 7F — parent provides section title in composed homepage sidebar. */
  hideHeading?: boolean;
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-brand/50 focus:outline-none focus:ring-2 focus:ring-primary-brand/20";

const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2";

function radiusLabel(km: number, t: FeedSidebarFiltersProps["t"]): string {
  if (km === 0) return t("feed.radiusNational");
  return `${km} km`;
}

/** Compact desktop filter card for homepage sidebar. */
export default function FeedSidebarFilters({
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
  scope,
  onScopeChange,
  radius,
  onRadiusChange,
  q,
  onQChange,
  category,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortOrder,
  onSort,
  sortOptions,
  distanceSortEnabled,
  priceRange,
  onPriceRangeChange,
  refineOpen,
  onRefineOpenChange,
  filtersDirty,
  onApply,
  onResetDraft,
  appliedAcceptedValues,
  onAcceptedValuesChange,
  discoveryDirection,
  onDiscoveryDirectionChange,
  hideHeading = false,
}: FeedSidebarFiltersProps) {
  return (
    <div className="space-y-4">
      {hideHeading ? null : (
        <h2 className="text-sm font-semibold text-gray-900 leading-snug">
          {t("feed.discoverFiltersHeading")}
        </h2>
      )}

      <DiscoveryDirectionToggle
        value={discoveryDirection}
        onChange={onDiscoveryDirectionChange}
        compact
      />

      {discoveryDirection === 'offer' ? (
        <section className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-2.5">
          <AcceptedValuesDiscoveryFilter
            value={appliedAcceptedValues}
            onChange={onAcceptedValuesChange}
            compact
            offerMode
          />
        </section>
      ) : null}

      {/* Scope */}
      <section>
        <p className={sectionLabelClass}>{t("feed.scopeLabel")}</p>
        <div
          className="grid grid-cols-1 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1"
          role="group"
          aria-label={t("feed.scopeLabel")}
        >
          {(
            [
              [FEED_SCOPE_NEARBY, "feed.scopeNearby"],
              [FEED_SCOPE_NATIONAL, "feed.scopeNational"],
              [FEED_SCOPE_INTERNATIONAL, "feed.scopeInternational"],
            ] as const
          ).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              onClick={() => onScopeChange(id)}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors",
                scope === id
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              aria-pressed={scope === id}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        {scope === FEED_SCOPE_INTERNATIONAL ? (
          <p className="mt-1.5 text-[10px] text-gray-500 leading-snug">
            {t("feed.scopeInternationalHint")}
          </p>
        ) : null}
      </section>

      {/* Locatie */}
      <section>
        <p className={sectionLabelClass}>{t("feed.sidebarSectionLocation")}</p>
        <div className="space-y-2">
          {showLocationHint ? (
            <p className="text-[11px] text-gray-500 leading-snug">
              {t("feed.viewerLocationHint")}
            </p>
          ) : null}
          {profileNeedsCoords ? (
            <p className="text-[11px] text-amber-800 leading-snug rounded-lg border border-amber-200/70 bg-amber-50/80 px-2.5 py-1.5">
              {t("feed.completeProfileLocationHint")}
            </p>
          ) : null}
          <input
            value={place}
            onChange={(e) => onPlaceChange(e.target.value)}
            className={inputClass}
            placeholder={t("common.typePlaceOrPostcode")}
            autoComplete="postal-code"
          />
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locationLoading || !locationSupported}
            aria-busy={locationLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-brand/25 bg-primary-50/40 px-3 py-2 text-sm font-medium text-primary-brand hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {t("feed.useMyLocation")}
          </button>
          {locationError ? (
            <p className="text-[11px] text-red-600 leading-snug">{locationError}</p>
          ) : null}
          {activeLocationChip ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{activeLocationChip}</span>
              </span>
              <button
                type="button"
                onClick={onClearLocation}
                className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={t("feed.clearLocation")}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
          <label className="block pt-0.5">
            <span className="sr-only">{t("feed.radiusLabel")}</span>
            <select
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className={inputClass}
              disabled={scope !== FEED_SCOPE_NEARBY}
            >
              {RADIUS_PRESET_OPTIONS.filter((opt) => opt > 0).map((opt) => (
                <option key={opt} value={opt}>
                  {radiusLabel(opt, t)}
                </option>
              ))}
            </select>
          </label>
          {scope !== FEED_SCOPE_NEARBY ? (
            <p className="text-[10px] text-gray-500 leading-snug">
              {t("feed.radiusNotUsedHint")}
            </p>
          ) : null}
        </div>
      </section>

      {/* Sorteren */}
      <section>
        <p className={sectionLabelClass}>{t("common.sortBy")}</p>
        <div className="flex flex-wrap gap-1.5">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSort(option.id)}
              disabled={option.id === "distance" && !distanceSortEnabled}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                sortBy === option.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                option.id === "distance" && !distanceSortEnabled
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              )}
              aria-pressed={sortBy === option.id}
            >
              {option.label}
              {sortBy === option.id ? (
                sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDown className="h-3 w-3" aria-hidden />
                )
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {/* Zoeken & categorie */}
      <section>
        <p className={sectionLabelClass}>{t("feed.sidebarSectionSearch")}</p>
        <div className="space-y-2">
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            className={inputClass}
            placeholder={t("common.searchPlaceholder")}
          />
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={inputClass}
          >
            <option value="all">{t("common.allCategories")}</option>
            {DISCOVERY_CATEGORY_CHIP_OPTIONS.filter((o) => o.slug !== "all").map(
              ({ slug, labelKey }) => (
                <option key={slug} value={slug}>
                  {t(labelKey)}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {/* Acties */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          {t("feed.applyFilters")}
        </button>
        <button
          type="button"
          onClick={onResetDraft}
          disabled={!filtersDirty}
          className="inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("feed.resetFiltersDraft")}
        </button>
      </div>

      {/* Verfijnen */}
      <section className="border-t border-gray-100 pt-3">
        <button
          type="button"
          aria-expanded={refineOpen}
          onClick={() => onRefineOpenChange(!refineOpen)}
          className="inline-flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{t("feed.moreFilters")}</span>
          {refineOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </button>
        {refineOpen ? (
          <div className="mt-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={t("common.searchInProductsSimple")}
                className={cn(inputClass, "pl-9")}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) =>
                  onPriceRangeChange({ ...priceRange, min: e.target.value })
                }
                placeholder={t("common.min")}
                className={inputClass}
              />
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) =>
                  onPriceRangeChange({ ...priceRange, max: e.target.value })
                }
                placeholder={t("filters.maxPricePlaceholder")}
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
        ) : null}
      </section>
    </div>
  );
}

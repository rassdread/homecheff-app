"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/utils";
import type { FeedScope } from "@/lib/feed/feed-scope";
import type { FeedClientSortField } from "@/lib/feed/feed-client-sort";
import FeedFilterSections from "@/components/feed/FeedFilterSections";
import type { DiscoveryDirection } from "@/components/feed/DiscoveryDirectionToggle";

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
  placeInputRef?: Ref<HTMLInputElement>;
  /** Phase 5.6 — ISO country for browse filter / geocode bias. */
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

const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2";

/** Compact desktop filter card for the homepage sidebar and the workspace rail. */
export default function FeedSidebarFilters({
  t,
  place,
  onPlaceChange,
  onUseMyLocation,
  locationLoading,
  locationError,
  activeLocationChip,
  onClearLocation,
  showLocationHint,
  profileNeedsCoords,
  placeInputRef,
  countryCode,
  onCountryCodeChange,
  locationMode,
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

      <FeedFilterSections
        t={t}
        place={place}
        onPlaceChange={onPlaceChange}
        placeInputRef={placeInputRef}
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
        scope={scope}
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
        placeTestId="feed-sidebar-place-input"
        countryTestId="feed-country-select"
        radiusTestId="feed-sidebar-radius"
        showLoadedResultSearch={false}
      />

      <section data-testid="feed-sidebar-sort" id="feed-sidebar-sort">
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
    </div>
  );
}


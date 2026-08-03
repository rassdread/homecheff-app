'use client';

import { Loader2, MapPin } from 'lucide-react';

type NearbyLocationRequiredEmptyStateProps = {
  title: string;
  description: string;
  useMyLocationLabel: string;
  choosePlaceLabel: string;
  altScopesHint?: string;
  /** WX 1C.1.2 — soft neighbourhood encouragement (curiosity, not urgency). */
  encouragement?: string;
  locationLoading?: boolean;
  locationSupported?: boolean;
  locationStatus?: string;
  onUseMyLocation: () => void;
  onChoosePlace: () => void;
};

/**
 * Inline empty state when Nearby is selected without a valid viewer location.
 * No modal — works in desktop sidebar, mobile sheet, and Android WebView.
 */
export default function NearbyLocationRequiredEmptyState({
  title,
  description,
  useMyLocationLabel,
  choosePlaceLabel,
  altScopesHint,
  encouragement,
  locationLoading = false,
  locationSupported = true,
  locationStatus,
  onUseMyLocation,
  onChoosePlace,
}: NearbyLocationRequiredEmptyStateProps) {
  return (
    <div
      data-testid="nearby-location-required-empty"
      data-hc-nearby-empty="1"
      data-wx-empty-guidance=""
      data-wx-nearby-empty=""
      data-wx-nearby-warm=""
      data-hc-nearby-status={locationStatus || undefined}
      className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/90 via-white to-amber-50/30 p-5 sm:p-6 text-sm text-gray-600 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900 sm:text-lg">
            {title}
          </p>
          <p className="mt-1.5 leading-relaxed text-gray-600">{description}</p>
          {encouragement ? (
            <p className="mt-2 text-xs font-medium leading-relaxed text-emerald-800/90">
              {encouragement}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={locationLoading || !locationSupported}
          aria-busy={locationLoading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
        >
          {locationLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {useMyLocationLabel}
            </>
          ) : (
            useMyLocationLabel
          )}
        </button>
        <button
          type="button"
          onClick={onChoosePlace}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 touch-manipulation"
        >
          {choosePlaceLabel}
        </button>
      </div>

      {altScopesHint ? (
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          {altScopesHint}
        </p>
      ) : null}
    </div>
  );
}

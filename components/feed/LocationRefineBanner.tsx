'use client';

import { Loader2, MapPin, X } from 'lucide-react';

type LocationRefineBannerProps = {
  message: string;
  usePreciseLabel: string;
  changeLabel: string;
  dismissLabel: string;
  locationLoading?: boolean;
  onUsePrecise: () => void;
  onChange: () => void;
  onDismiss: () => void;
};

/**
 * Non-blocking location refine banner — feed stays visible underneath.
 */
export default function LocationRefineBanner({
  message,
  usePreciseLabel,
  changeLabel,
  dismissLabel,
  locationLoading = false,
  onUsePrecise,
  onChange,
  onDismiss,
}: LocationRefineBannerProps) {
  return (
    <div
      data-testid="location-refine-banner"
      data-hc-location-banner="1"
      role="region"
      aria-label={message}
      className="mb-3 flex flex-col gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 text-sm text-emerald-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <div className="flex min-w-0 items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        <p className="min-w-0 leading-snug">{message}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={onUsePrecise}
          disabled={locationLoading}
          aria-busy={locationLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
        >
          {locationLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {usePreciseLabel}
        </button>
        <button
          type="button"
          onClick={onChange}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-300/80 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 touch-manipulation"
        >
          {changeLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center justify-center rounded-lg p-2 text-emerald-800/70 hover:bg-emerald-100/80 touch-manipulation"
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

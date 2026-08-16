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
 * Compact non-blocking location refine — keeps feed visible in the fold.
 * Consent / permission behaviour unchanged (caller owns geolocation).
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
      data-hc-location-banner-compact="1"
      role="region"
      aria-label={message}
      className="mb-2 flex items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1.5 text-xs text-emerald-950 sm:text-sm"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
      <p className="min-w-0 flex-1 truncate leading-snug">{message}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onUsePrecise}
          disabled={locationLoading}
          aria-busy={locationLoading}
          className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation sm:text-xs"
        >
          {locationLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : null}
          {usePreciseLabel}
        </button>
        <button
          type="button"
          onClick={onChange}
          className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-emerald-300/70 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-50 touch-manipulation sm:text-xs"
        >
          {changeLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md p-1.5 text-emerald-800/70 hover:bg-emerald-100/80 touch-manipulation"
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

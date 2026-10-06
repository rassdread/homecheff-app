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
      className="mb-1 flex min-h-[44px] flex-nowrap items-center gap-1.5 overflow-hidden rounded-lg border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-2 text-xs text-[var(--hc-text)]"
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--hc-blue)]" aria-hidden />
      <p className="min-w-0 flex-1 truncate leading-snug">{message}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onUsePrecise}
          disabled={locationLoading}
          aria-busy={locationLoading}
          className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-md px-2 text-[11px] font-semibold text-[var(--hc-blue)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
        >
          {locationLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : null}
          {usePreciseLabel}
        </button>
        <button
          type="button"
          onClick={onChange}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold text-[var(--hc-blue)] underline-offset-2 hover:underline touch-manipulation"
        >
          {changeLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--hc-text-secondary)] hover:bg-[var(--hc-surface-subtle)] touch-manipulation"
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

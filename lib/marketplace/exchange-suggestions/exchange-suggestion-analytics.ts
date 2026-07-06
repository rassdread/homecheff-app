/**
 * Exchange suggestion analytics — Phase 4G.
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import type { ExchangeSuggestionSurface } from './exchange-suggestion-contract';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';

export type ExchangeSuggestionAnalyticsProps = {
  surface: ExchangeSuggestionSurface | string;
  listingId?: string;
  suggestedListingId: string;
  category: ValueExchangeMainCategory | string;
  position?: number;
};

export function trackExchangeSuggestionImpression(
  props: ExchangeSuggestionAnalyticsProps,
): void {
  trackEvent('exchange_suggestion_impression', {
    surface: props.surface,
    listing_id: props.listingId ?? null,
    suggested_listing_id: props.suggestedListingId,
    category: props.category,
    position: props.position ?? 0,
  });
}

export function trackExchangeSuggestionOpen(
  props: ExchangeSuggestionAnalyticsProps,
): void {
  trackEvent('exchange_suggestion_open', {
    surface: props.surface,
    listing_id: props.listingId ?? null,
    suggested_listing_id: props.suggestedListingId,
    category: props.category,
    position: props.position ?? 0,
  });
}

export function trackExchangeSuggestionCtaClick(
  props: ExchangeSuggestionAnalyticsProps & { cta: string },
): void {
  trackEvent('exchange_suggestion_cta_click', {
    surface: props.surface,
    listing_id: props.listingId ?? null,
    suggested_listing_id: props.suggestedListingId,
    category: props.category,
    position: props.position ?? 0,
    cta: props.cta,
  });
}

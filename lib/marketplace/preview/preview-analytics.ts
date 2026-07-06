/**
 * Marketplace preview analytics — Phase 5A.
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import type { PreviewCloseReason, PreviewOpenSource } from './preview-state-manager';

export type PreviewAnalyticsDevice = 'desktop' | 'mobile';

export type PreviewAnalyticsProps = {
  source: PreviewOpenSource;
  listingId: string;
  device: PreviewAnalyticsDevice;
  category?: string | null;
  openDuration?: number;
  closeReason?: PreviewCloseReason;
};

export function trackMarketplacePreviewOpen(props: PreviewAnalyticsProps): void {
  trackEvent('marketplace_preview_open', {
    source: props.source,
    listing_id: props.listingId,
    device: props.device,
    category: props.category ?? null,
  });
}

export function trackMarketplacePreviewClose(
  props: PreviewAnalyticsProps,
): void {
  trackEvent('marketplace_preview_close', {
    source: props.source,
    listing_id: props.listingId,
    device: props.device,
    category: props.category ?? null,
    open_duration_ms: props.openDuration ?? 0,
    close_reason: props.closeReason ?? 'external',
  });
}

export function trackMarketplacePreviewInfoClick(props: {
  listingId: string;
  device: PreviewAnalyticsDevice;
  category?: string | null;
  willOpen: boolean;
}): void {
  trackEvent('marketplace_preview_info_click', {
    listing_id: props.listingId,
    device: props.device,
    category: props.category ?? null,
    will_open: props.willOpen,
  });
}

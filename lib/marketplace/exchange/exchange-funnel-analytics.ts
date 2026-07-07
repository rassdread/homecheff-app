/**
 * Exchange funnel analytics — Phase 5E-G.
 * GA4/gtag events for MONEY_AND_BARTER conversion measurement. No PII.
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import { normalizeBarterOpenness } from '@/lib/marketplace/commerce/barter-commerce-alignment';

/** Canonical exchange funnel event names (GA4 custom events). */
export const EXCHANGE_FUNNEL_EVENTS = {
  detailView: 'exchange_funnel_detail_view',
  stickyCheckoutClick: 'exchange_funnel_sticky_checkout_click',
  commerceCheckoutClick: 'exchange_funnel_commerce_checkout_click',
  proposalExpand: 'exchange_funnel_proposal_expand',
  proposalDeepLinkClick: 'exchange_funnel_proposal_deep_link_click',
  proposalSheetOpened: 'exchange_funnel_proposal_sheet_opened',
  proposalSubmitted: 'exchange_funnel_proposal_submitted',
  checkoutStarted: 'exchange_funnel_checkout_started',
  communityOrderCreated: 'exchange_funnel_community_order_created',
  checkoutCompleted: 'exchange_funnel_checkout_completed',
} as const;

export type ExchangeFunnelEventName =
  (typeof EXCHANGE_FUNNEL_EVENTS)[keyof typeof EXCHANGE_FUNNEL_EVENTS];

export type ExchangeFunnelSurface =
  | 'sticky'
  | 'commerce_zone'
  | 'suggestion'
  | 'chat'
  | 'detail';

export type ExchangeFunnelDevice = 'mobile' | 'desktop';

export type ExchangeFunnelListingInput = {
  listingId: string;
  barterOpenness?: string | null;
  acceptedSpecializations?: string[] | null;
  listingIntent?: string | null;
  specializations?: string[] | null;
  orderMethod?: string | null;
};

export type ExchangeFunnelTrackInput = ExchangeFunnelListingInput & {
  surface: ExchangeFunnelSurface;
  entrypoint: string;
  device?: ExchangeFunnelDevice;
  hasAcceptedValues?: boolean;
  hasDesiredExchanges?: boolean;
  settlementMode?: string | null;
  proposalId?: string;
  communityOrderId?: string;
};

const ALLOWED_EVENTS = new Set<string>(Object.values(EXCHANGE_FUNNEL_EVENTS));
const ALLOWED_SURFACES = new Set<string>([
  'sticky',
  'commerce_zone',
  'suggestion',
  'chat',
  'detail',
]);
const ALLOWED_BARTER = new Set(['MONEY', 'MONEY_AND_BARTER', 'BARTER_ONLY']);

export function getExchangeFunnelDevice(): ExchangeFunnelDevice {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
}

export function exchangeFunnelHasDesiredExchanges(input: {
  listingIntent?: string | null;
  specializations?: string[] | null;
}): boolean {
  return (
    String(input.listingIntent ?? '').toUpperCase() === 'REQUEST' &&
    (input.specializations?.length ?? 0) > 0
  );
}

export function exchangeFunnelHasAcceptedValues(
  acceptedSpecializations?: string[] | null,
): boolean {
  return (acceptedSpecializations?.length ?? 0) > 0;
}

/** Build normalized payload — no user ids, emails, or free-text. */
export function buildExchangeFunnelPayload(
  input: ExchangeFunnelTrackInput,
): Record<string, string | number | boolean> {
  const barterOpenness = normalizeBarterOpenness(input.barterOpenness);
  const hasAccepted =
    input.hasAcceptedValues ??
    exchangeFunnelHasAcceptedValues(input.acceptedSpecializations);
  const hasDesired =
    input.hasDesiredExchanges ??
    exchangeFunnelHasDesiredExchanges({
      listingIntent: input.listingIntent,
      specializations: input.specializations,
    });

  const payload: Record<string, string | number | boolean> = {
    listing_id: input.listingId,
    barter_openness: barterOpenness,
    surface: input.surface,
    device: input.device ?? getExchangeFunnelDevice(),
    entrypoint: input.entrypoint,
    has_accepted_values: hasAccepted,
    has_desired_exchanges: hasDesired,
  };

  if (input.orderMethod) {
    payload.order_method = String(input.orderMethod);
  }
  if (input.settlementMode) {
    payload.settlement_mode = String(input.settlementMode);
  }
  if (input.proposalId) {
    payload.proposal_id = input.proposalId;
  }
  if (input.communityOrderId) {
    payload.community_order_id = input.communityOrderId;
  }

  return payload;
}

export function trackExchangeFunnelEvent(
  eventName: ExchangeFunnelEventName,
  input: ExchangeFunnelTrackInput,
): void {
  trackEvent(eventName, buildExchangeFunnelPayload(input));
}

/** Validate event registry (used by scripts/validate-exchange-funnel-analytics.ts). */
export function validateExchangeFunnelAnalyticsRegistry(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const name of Object.values(EXCHANGE_FUNNEL_EVENTS)) {
    if (!name.startsWith('exchange_funnel_')) {
      errors.push(`event must be prefixed exchange_funnel_: ${name}`);
    }
    if (!ALLOWED_EVENTS.has(name)) {
      errors.push(`unknown event: ${name}`);
    }
  }

  const sample = buildExchangeFunnelPayload({
    listingId: 'sample-listing',
    barterOpenness: 'MONEY_AND_BARTER',
    surface: 'sticky',
    entrypoint: 'test',
    orderMethod: 'HOMECHEFF',
    settlementMode: 'MONEY_AND_VALUE',
  });

  const required = [
    'listing_id',
    'barter_openness',
    'surface',
    'device',
    'entrypoint',
    'has_accepted_values',
    'has_desired_exchanges',
  ];
  for (const key of required) {
    if (!(key in sample)) {
      errors.push(`missing required property: ${key}`);
    }
  }

  if (!ALLOWED_BARTER.has(String(sample.barter_openness))) {
    errors.push('invalid barter_openness in sample');
  }
  if (!ALLOWED_SURFACES.has(String(sample.surface))) {
    errors.push('invalid surface in sample');
  }

  return { ok: errors.length === 0, errors };
}

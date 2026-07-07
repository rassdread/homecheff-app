/**
 * Proposal flow analytics — Phase 5E-C.
 * GA4 events; no PII.
 */

import { trackEvent } from '@/components/GoogleAnalytics';
import type { SettlementMode } from '@prisma/client';
import type { ProposalPrefillSource } from './proposal-prefill';

export const PROPOSAL_FLOW_EVENTS = {
  opened: 'proposal_opened',
  prefilled: 'proposal_prefilled',
  countered: 'proposal_countered',
  sent: 'proposal_sent',
  accepted: 'proposal_accepted',
  rejected: 'proposal_rejected',
} as const;

export type ProposalFlowEventName =
  (typeof PROPOSAL_FLOW_EVENTS)[keyof typeof PROPOSAL_FLOW_EVENTS];

export type ProposalAnalyticsPayload = {
  source: ProposalPrefillSource | string;
  listingId?: string | null;
  settlementType?: SettlementMode | string | null;
  exchangeSuggestionUsed?: boolean;
  taxonomyOverlapCount?: number;
  proposalId?: string;
  surface?: string;
};

export function trackProposalFlowEvent(
  eventName: ProposalFlowEventName,
  payload: ProposalAnalyticsPayload,
): void {
  const data: Record<string, string | number | boolean> = {
    source: String(payload.source),
  };
  if (payload.listingId) data.listing_id = payload.listingId;
  if (payload.settlementType) data.settlement_type = String(payload.settlementType);
  if (payload.exchangeSuggestionUsed != null) {
    data.exchange_suggestion_used = payload.exchangeSuggestionUsed;
  }
  if (payload.taxonomyOverlapCount != null) {
    data.taxonomy_overlap_count = payload.taxonomyOverlapCount;
  }
  if (payload.proposalId) data.proposal_id = payload.proposalId;
  if (payload.surface) data.surface = payload.surface;
  trackEvent(eventName, data);
}

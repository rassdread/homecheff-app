/** i18n key constants for proposal / agreement / community order UI */
export const PROPOSAL_I18N = {
  cardHeading: 'proposal.card.heading',
  status: {
    PENDING: 'proposal.status.pending',
    ACCEPTED: 'proposal.status.accepted',
    REJECTED: 'proposal.status.rejected',
    COUNTERED: 'proposal.status.countered',
    EXPIRED: 'proposal.status.expired',
    CANCELLED: 'proposal.status.cancelled',
  },
  settlement: {
    MONEY: 'proposal.settlement.money',
    MONEY_AND_VALUE: 'proposal.settlement.moneyAndValue',
    VALUE_ONLY: 'proposal.settlement.valueOnly',
    FREE: 'proposal.settlement.free',
    VOLUNTARY: 'proposal.settlement.voluntary',
  },
  acceptsLabel: 'proposal.card.acceptsLabel',
  seeksLabel: 'proposal.card.seeksLabel',
  system: {
    accepted: 'proposal.system.accepted',
    rejected: 'proposal.system.rejected',
    cancelled: 'proposal.system.cancelled',
    communityOrderCreated: 'proposal.system.communityOrderCreated',
  },
  errors: {
    moneyAmountRequired: 'proposal.errors.moneyAmountRequired',
    valueRequired: 'proposal.errors.valueRequired',
  },
} as const;

export const COMMUNITY_ORDER_I18N = {
  heading: 'communityOrder.summary.heading',
  status: {
    OPEN: 'communityOrder.status.open',
    COMPLETED: 'communityOrder.status.completed',
    CANCELLED: 'communityOrder.status.cancelled',
  },
  fulfillment: {
    PICKUP: 'communityOrder.fulfillment.pickup',
    DELIVERY: 'communityOrder.fulfillment.delivery',
    DIGITAL: 'communityOrder.fulfillment.digital',
    ON_SITE_PROVIDER: 'communityOrder.fulfillment.onSiteProvider',
    ON_SITE_CLIENT: 'communityOrder.fulfillment.onSiteClient',
  },
  deliveryRequested: 'communityOrder.summary.deliveryRequested',
  deliveryAssigned: 'communityOrder.summary.deliveryAssigned',
  parties: 'communityOrder.summary.parties',
} as const;

export const AGREEMENT_I18N = {
  snapshotHeading: 'agreement.snapshot.heading',
} as const;

/** System message keys stored in Message.text for client-side translation */
export const PROPOSAL_SYSTEM_MESSAGE_KEYS = {
  accepted: PROPOSAL_I18N.system.accepted,
  rejected: PROPOSAL_I18N.system.rejected,
  cancelled: PROPOSAL_I18N.system.cancelled,
  communityOrderCreated: PROPOSAL_I18N.system.communityOrderCreated,
} as const;

export function isProposalI18nKey(text: string | null | undefined): boolean {
  if (!text) return false;
  return (
    text.startsWith('proposal.') ||
    text.startsWith('communityOrder.') ||
    text.startsWith('agreement.')
  );
}

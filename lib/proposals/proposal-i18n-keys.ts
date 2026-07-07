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
  settlementHeading: 'proposal.card.settlementHeading',
  highlights: {
    price: 'proposal.card.highlightPrice',
    delivery: 'proposal.card.highlightDelivery',
    payment: 'proposal.card.highlightPayment',
    value: 'proposal.card.highlightValue',
  },
  system: {
    accepted: 'proposal.system.accepted',
    rejected: 'proposal.system.rejected',
    cancelled: 'proposal.system.cancelled',
    communityOrderCreated: 'proposal.system.communityOrderCreated',
  },
  errors: {
    moneyAmountRequired: 'proposal.errors.moneyAmountRequired',
    valueRequired: 'proposal.errors.valueRequired',
    quantityRequired: 'proposal.errors.quantityRequired',
    commitmentRequired: 'proposal.errors.commitmentRequired',
  },
  payment: {
    homecheffRecommended: 'proposal.payment.homecheffRecommended',
  },
  nextAction: {
    NONE: 'proposal.nextAction.none',
    COMMUNITY_ORDER_CREATED: 'proposal.nextAction.communityOrderCreated',
    CHECKOUT_REQUIRED: 'proposal.nextAction.checkoutRequired',
    DELIVERY_REQUEST_READY: 'proposal.nextAction.deliveryRequestReady',
    DELIVERY_REQUEST_CREATED: 'proposal.nextAction.deliveryRequestCreated',
  },
  paymentPath: {
    HOMECHEFF_CHECKOUT: 'proposal.productBinding.paymentHomecheff',
    DIRECT_CONTACT: 'proposal.productBinding.paymentDirect',
    NONE: 'proposal.productBinding.paymentNone',
  },
  actions: {
    accept: 'proposal.actions.accept',
    reject: 'proposal.actions.reject',
    counter: 'proposal.actions.counter',
    cancel: 'proposal.actions.cancel',
    sendCounter: 'proposal.actions.sendCounter',
    send: 'proposal.actions.send',
    sendQuote: 'proposal.actions.sendQuote',
  },
} as const;

/** User-facing "Jullie afspraak" deal card — hides CommunityOrder terminology */
export const DEAL_COMMITMENT_I18N = {
  acceptLabel: 'deal.commitment.acceptLabel',
  homecheffHint: 'deal.commitment.homecheffHint',
  directRisk: 'deal.commitment.directRisk',
  requiredError: 'deal.commitment.requiredError',
} as const;

export const DEAL_I18N = {
  heading: 'deal.heading',
  paymentHeading: 'deal.paymentHeading',
  paymentPath: {
    HOMECHEFF_CHECKOUT: 'deal.paymentPath.homecheff',
    DIRECT_CONTACT: 'deal.paymentPath.direct',
    NONE: 'deal.paymentPath.none',
  },
  fulfillment: {
    PICKUP: 'deal.fulfillment.pickup',
    DELIVERY: 'deal.fulfillment.delivery',
    DIGITAL: 'deal.fulfillment.digital',
    ON_SITE_PROVIDER: 'deal.fulfillment.onSiteProvider',
    ON_SITE_CLIENT: 'deal.fulfillment.onSiteClient',
  },
  delivery: {
    statusPending: 'deal.delivery.statusPending',
    statusActive: 'deal.delivery.statusActive',
    courierAssigned: 'deal.delivery.courierAssigned',
    courierName: 'deal.delivery.courierName',
    inProgress: 'deal.delivery.inProgress',
    detailsHeading: 'deal.delivery.detailsHeading',
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
  paymentPath: {
    HOMECHEFF_CHECKOUT: 'communityOrder.paymentPath.homecheff',
    DIRECT_CONTACT: 'communityOrder.paymentPath.direct',
    NONE: 'communityOrder.paymentPath.none',
  },
  delivery: {
    requestCreated: 'communityOrder.delivery.requestCreated',
    requestReady: 'communityOrder.delivery.requestReady',
    checkoutRequired: 'communityOrder.delivery.checkoutRequired',
  },
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
    text.startsWith('agreement.') ||
    text.startsWith('deal.')
  );
}

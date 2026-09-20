/**
 * KVK / activity context — not a turnover threshold.
 * Same omzet can yield different activity context.
 */

export const SALE_FREQUENCIES = [
  'ONE_OFF',
  'OCCASIONAL',
  'REGULAR',
  'UNKNOWN',
] as const;
export type SaleFrequency = (typeof SALE_FREQUENCIES)[number];

export const CUSTOMER_SCOPES = [
  'PRIVATE_CIRCLE',
  'PUBLIC',
  'MIXED',
  'UNKNOWN',
] as const;
export type CustomerScope = (typeof CUSTOMER_SCOPES)[number];

export const COMMERCIAL_INTENTS = [
  'HOBBY_COST_RECOVERY',
  'SIDE_INCOME',
  'SERIOUS_SIDE_INCOME',
  'BUILD_BUSINESS',
  'UNKNOWN',
] as const;
export type CommercialIntent = (typeof COMMERCIAL_INTENTS)[number];

export const ACTIVITY_KINDS = ['FOOD', 'PRODUCT', 'SERVICE', 'COMMISSION'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type ActivityContext = {
  kinds: readonly ActivityKind[];
  frequency: SaleFrequency;
  customers: CustomerScope;
  commercialIntent: CommercialIntent;
  independence: boolean | 'UNKNOWN';
  continuity: boolean | 'UNKNOWN';
  timeOrMoneyInvested: boolean | 'UNKNOWN';
  listingCount: number | null;
  transactionCount: number | null;
  typicalTicketCents: number | null;
  unitCount: number | null;
};

export function sameTurnoverDifferentActivity(a: ActivityContext, b: ActivityContext): boolean {
  return (
    a.frequency !== b.frequency ||
    a.unitCount !== b.unitCount ||
    a.typicalTicketCents !== b.typicalTicketCents ||
    a.commercialIntent !== b.commercialIntent
  );
}

/** Architecture fixtures: €5.000 omzet, verschillende activiteit. */
export function paintingOnceFiveThousand(): ActivityContext {
  return {
    kinds: ['PRODUCT'],
    frequency: 'ONE_OFF',
    customers: 'PUBLIC',
    commercialIntent: 'SIDE_INCOME',
    independence: 'UNKNOWN',
    continuity: false,
    timeOrMoneyInvested: 'UNKNOWN',
    listingCount: 1,
    transactionCount: 1,
    typicalTicketCents: 500_000,
    unitCount: 1,
  };
}

export function hundredProductsAtFifty(): ActivityContext {
  return {
    kinds: ['PRODUCT'],
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    commercialIntent: 'SERIOUS_SIDE_INCOME',
    independence: 'UNKNOWN',
    continuity: true,
    timeOrMoneyInvested: true,
    listingCount: 100,
    transactionCount: 100,
    typicalTicketCents: 5_000,
    unitCount: 100,
  };
}

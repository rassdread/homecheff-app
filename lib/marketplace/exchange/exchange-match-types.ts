/**
 * Exchange match types — Phase 4D.
 */

export const EXCHANGE_MATCH_TYPES = [
  'DIRECT_MATCH',
  'CATEGORY_MATCH',
  'SUBCATEGORY_MATCH',
  'DESIRED_EXCHANGE_MATCH',
  'MULTI_MATCH',
] as const;

export type ExchangeMatchType = (typeof EXCHANGE_MATCH_TYPES)[number];

export type ExchangeMatchResult = {
  id: string;
  type: ExchangeMatchType;
  listingAId: string;
  listingBId: string;
  userAId: string;
  userBId: string;
  /** Higher = stronger overlap; not used for feed ranking. */
  score: number;
  dimensions: ExchangeMatchDimension[];
  suppressed: boolean;
  suppressionReason: string | null;
};

export type ExchangeMatchDimension =
  | 'direct_offer_wants'
  | 'category_overlap'
  | 'subcategory_overlap'
  | 'desired_exchange_overlap'
  | 'mutual_acceptance';

const TYPE_PRIORITY: Record<ExchangeMatchType, number> = {
  MULTI_MATCH: 100,
  DIRECT_MATCH: 90,
  DESIRED_EXCHANGE_MATCH: 85,
  SUBCATEGORY_MATCH: 70,
  CATEGORY_MATCH: 50,
};

export function resolvePrimaryMatchType(
  dimensions: ExchangeMatchDimension[],
): ExchangeMatchType {
  const set = new Set(dimensions);
  const count =
    (set.has('direct_offer_wants') ? 1 : 0) +
    (set.has('category_overlap') ? 1 : 0) +
    (set.has('subcategory_overlap') ? 1 : 0) +
    (set.has('desired_exchange_overlap') ? 1 : 0) +
    (set.has('mutual_acceptance') ? 1 : 0);

  if (count >= 2) return 'MULTI_MATCH';
  if (set.has('direct_offer_wants')) return 'DIRECT_MATCH';
  if (set.has('desired_exchange_overlap')) return 'DESIRED_EXCHANGE_MATCH';
  if (set.has('subcategory_overlap')) return 'SUBCATEGORY_MATCH';
  if (set.has('category_overlap')) return 'CATEGORY_MATCH';
  return 'CATEGORY_MATCH';
}

export function matchTypePriority(type: ExchangeMatchType): number {
  return TYPE_PRIORITY[type];
}

export function describeMatchType(type: ExchangeMatchType): string {
  switch (type) {
    case 'DIRECT_MATCH':
      return 'User A offers something User B wants';
    case 'CATEGORY_MATCH':
      return 'Main category overlap';
    case 'SUBCATEGORY_MATCH':
      return 'Subcategory overlap';
    case 'DESIRED_EXCHANGE_MATCH':
      return 'Explicit wanted item overlap';
    case 'MULTI_MATCH':
      return 'Multiple matching dimensions';
    default:
      return type;
  }
}

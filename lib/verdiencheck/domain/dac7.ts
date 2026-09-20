/**
 * DAC7 is platform reporting. It is not a tax status and not a tax due.
 */

export const DAC7_NOT_A_TAX_JUDGMENT =
  'Dat HomeCheff gegevens moet doorgeven, betekent niet automatisch dat je belasting moet betalen.';

export const DAC7_ACTIVITY_CATEGORIES = [
  'SALE_OF_GOODS',
  'PERSONAL_SERVICE',
  'RENTAL_OF_IMMOVABLE_PROPERTY',
  'RENTAL_OF_TRANSPORT',
  'OTHER_OR_UNKNOWN',
] as const;

export type Dac7SellerActivityCategory = (typeof DAC7_ACTIVITY_CATEGORIES)[number];

export const DAC7_REPORTING_STATUSES = [
  'GOODS_EXCLUSION_MAY_APPLY',
  'POTENTIALLY_REPORTABLE',
  'NOT_ASSESSED',
  'REVIEW_REQUIRED',
] as const;

export type Dac7ReportingStatus = (typeof DAC7_REPORTING_STATUSES)[number];

export type Dac7ReportingContext = {
  calendarYear: number;
  activityCategory: Dac7SellerActivityCategory;
  transactionCount: number | null;
  considerationCents: number | null;
};

export function activityKindsToDac7Category(
  kinds: readonly string[],
): Dac7SellerActivityCategory {
  const hasService = kinds.includes('SERVICE');
  const hasGoods = kinds.includes('PRODUCT') || kinds.includes('FOOD');
  if (hasService && hasGoods) return 'OTHER_OR_UNKNOWN';
  if (hasService) return 'PERSONAL_SERVICE';
  if (hasGoods) return 'SALE_OF_GOODS';
  return 'OTHER_OR_UNKNOWN';
}

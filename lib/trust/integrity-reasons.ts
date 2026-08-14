/**
 * TRUST-1 — product integrity report reasons.
 * Do NOT use NOT_SELF_MADE — too strict vs HomeCheff contribution rule.
 */

export const PRODUCT_INTEGRITY_REASONS = [
  'NO_MEANINGFUL_SELLER_CONTRIBUTION',
  'MISLEADING_OR_FALSE',
  'PROHIBITED_OR_UNSAFE',
  'SPAM_OR_DUPLICATE',
  'WRONG_CATEGORY',
  'OTHER',
] as const;

export type ProductIntegrityReason =
  (typeof PRODUCT_INTEGRITY_REASONS)[number];

export type IntegrityReasonCopy = {
  labelNl: string;
  labelEn: string;
  supportNl: string;
  supportEn: string;
};

export const PRODUCT_INTEGRITY_REASON_COPY: Record<
  ProductIntegrityReason,
  IntegrityReasonCopy
> = {
  NO_MEANINGFUL_SELLER_CONTRIBUTION: {
    labelNl: 'Dit lijkt ongewijzigde wederverkoop',
    labelEn: 'This looks like unmodified resale',
    supportNl:
      'HomeCheff is bedoeld voor aanbod waar de aanbieder zelf iets aan maakt, bereidt, kweekt, ontwerpt, personaliseert, bewerkt, restaureert, samenstelt of als eigen dienst uitvoert.',
    supportEn:
      'HomeCheff is for offers where the provider personally makes, prepares, grows, designs, personalises, transforms, restores, assembles, or performs their own service.',
  },
  MISLEADING_OR_FALSE: {
    labelNl: 'Misleidende of onjuiste beschrijving',
    labelEn: 'Misleading or false description',
    supportNl: 'Titel of beschrijving lijkt niet te kloppen met het aanbod.',
    supportEn: 'Title or description appears not to match the offer.',
  },
  PROHIBITED_OR_UNSAFE: {
    labelNl: 'Verboden of onveilig aanbod',
    labelEn: 'Prohibited or unsafe offer',
    supportNl: 'Mogelijk verboden, gevaarlijk of niet toegestaan op HomeCheff.',
    supportEn: 'Possibly prohibited, unsafe, or not allowed on HomeCheff.',
  },
  SPAM_OR_DUPLICATE: {
    labelNl: 'Spam of dubbel aanbod',
    labelEn: 'Spam or duplicate offer',
    supportNl: 'Lijkt spam of een herhaalde/dubbele listing.',
    supportEn: 'Looks like spam or a duplicate listing.',
  },
  WRONG_CATEGORY: {
    labelNl: 'Verkeerde categorie',
    labelEn: 'Wrong category',
    supportNl: 'Het aanbod staat in een misleidende categorie.',
    supportEn: 'The offer is in a misleading category.',
  },
  OTHER: {
    labelNl: 'Anders',
    labelEn: 'Other',
    supportNl: 'Andere reden (licht toe in de toelichting).',
    supportEn: 'Other reason (please explain).',
  },
};

export function isProductIntegrityReason(
  v: unknown,
): v is ProductIntegrityReason {
  return (
    typeof v === 'string' &&
    (PRODUCT_INTEGRITY_REASONS as readonly string[]).includes(v)
  );
}

/** Map legacy ReportContentButton product reason ids → TRUST-1 enums. */
export function mapLegacyProductReportReason(
  raw: string,
): ProductIntegrityReason {
  switch (raw) {
    case 'NO_MEANINGFUL_SELLER_CONTRIBUTION':
    case 'unmodified_resale':
    case 'fake_product':
      return 'NO_MEANINGFUL_SELLER_CONTRIBUTION';
    case 'MISLEADING_OR_FALSE':
    case 'misleading_info':
      return 'MISLEADING_OR_FALSE';
    case 'PROHIBITED_OR_UNSAFE':
    case 'inappropriate_content':
      return 'PROHIBITED_OR_UNSAFE';
    case 'SPAM_OR_DUPLICATE':
    case 'spam':
      return 'SPAM_OR_DUPLICATE';
    case 'WRONG_CATEGORY':
    case 'wrong_category':
      return 'WRONG_CATEGORY';
    default:
      return 'OTHER';
  }
}

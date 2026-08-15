/**
 * TRUST-1.1 — seller contribution / provenance registry (listing-level).
 *
 * Contribution is seller-declared evidence for marketplace fit.
 * It is NOT a HomeCheff certification and does NOT affect LEGAL-1/2 or feed ranking.
 */

export const SELLER_CONTRIBUTION_TYPES = [
  'MADE',
  'PREPARED',
  'GROWN',
  'DESIGNED',
  'PERSONALISED',
  'TRANSFORMED',
  'RESTORED',
  'ASSEMBLED',
  'OWN_SERVICE',
  'OTHER_OWN_WORK',
] as const;

export type SellerContributionType =
  (typeof SELLER_CONTRIBUTION_TYPES)[number];

export type SellerContributionLabels = {
  id: SellerContributionType;
  labelNl: string;
  labelEn: string;
};

export const SELLER_CONTRIBUTION_LABELS: readonly SellerContributionLabels[] = [
  { id: 'MADE', labelNl: 'Zelf gemaakt', labelEn: 'Made myself' },
  { id: 'PREPARED', labelNl: 'Zelf bereid', labelEn: 'Prepared myself' },
  { id: 'GROWN', labelNl: 'Zelf gekweekt', labelEn: 'Grown myself' },
  { id: 'DESIGNED', labelNl: 'Zelf ontworpen', labelEn: 'Designed myself' },
  {
    id: 'PERSONALISED',
    labelNl: 'Gepersonaliseerd',
    labelEn: 'Personalised',
  },
  {
    id: 'TRANSFORMED',
    labelNl: 'Bewerkt / getransformeerd',
    labelEn: 'Transformed / reworked',
  },
  { id: 'RESTORED', labelNl: 'Gerestaureerd', labelEn: 'Restored' },
  {
    id: 'ASSEMBLED',
    labelNl: 'Zelf samengesteld',
    labelEn: 'Assembled myself',
  },
  {
    id: 'OWN_SERVICE',
    labelNl: 'Eigen dienst / vakmanschap',
    labelEn: 'Own service / craft',
  },
  {
    id: 'OTHER_OWN_WORK',
    labelNl: 'Anders, namelijk…',
    labelEn: 'Other own work…',
  },
] as const;

export const SELLER_CONTRIBUTION_NOTE_MAX = 500;

/** Empty / missing = legacy or not declared — never a violation by itself. */
export type SellerContributionDeclarationState =
  | 'NOT_DECLARED'
  | 'DECLARED';

export function isSellerContributionType(
  v: unknown,
): v is SellerContributionType {
  return (
    typeof v === 'string' &&
    (SELLER_CONTRIBUTION_TYPES as readonly string[]).includes(v)
  );
}

export function parseSellerContributionTypes(
  raw: unknown,
): SellerContributionType[] {
  if (!Array.isArray(raw)) return [];
  const out: SellerContributionType[] = [];
  for (const item of raw) {
    if (isSellerContributionType(item) && !out.includes(item)) {
      out.push(item);
    }
  }
  return out;
}

export function sanitizeSellerContributionNote(
  raw: unknown,
): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, SELLER_CONTRIBUTION_NOTE_MAX);
  return trimmed.length > 0 ? trimmed : null;
}

export function contributionDeclarationState(
  types: readonly string[] | null | undefined,
): SellerContributionDeclarationState {
  return types && types.length > 0 ? 'DECLARED' : 'NOT_DECLARED';
}

export function labelForContributionType(
  id: SellerContributionType,
  locale: 'nl' | 'en' = 'nl',
): string {
  const row = SELLER_CONTRIBUTION_LABELS.find((x) => x.id === id);
  if (!row) return id;
  return locale === 'en' ? row.labelEn : row.labelNl;
}

/**
 * Soft suggestions by marketplace category — never auto-confirmed without seller action.
 */
export function suggestedContributionTypes(input: {
  marketplaceCategory?: string | null;
  listingIntent?: string | null;
}): SellerContributionType[] {
  if (input.listingIntent === 'REQUEST') return [];
  const cat = (input.marketplaceCategory || '').toUpperCase();
  if (cat === 'GROW') return ['GROWN'];
  if (cat === 'CREATE') return ['PREPARED', 'MADE'];
  if (cat === 'DESIGN') return ['DESIGNED', 'MADE', 'TRANSFORMED'];
  if (
    cat === 'ARTISTIC_SERVICE' ||
    cat === 'PRACTICAL_SERVICE' ||
    cat === 'KNOWLEDGE'
  ) {
    return ['OWN_SERVICE'];
  }
  return [];
}

/**
 * New OFFER listings should declare at least one type before publish.
 * REQUEST listings and legacy empty rows are exempt.
 */
export function contributionRequiredForPublish(input: {
  listingIntent?: string | null;
  isEdit?: boolean;
  integrityStatus?: string | null;
}): boolean {
  if (input.listingIntent === 'REQUEST') return false;
  // Edits: only hard-require when already under contribution-related review.
  if (input.isEdit) {
    const st = (input.integrityStatus || '').toUpperCase();
    return (
      st === 'TEMPORARILY_HIDDEN' ||
      st === 'UNDER_REVIEW' ||
      st === 'REVIEW_REQUIRED'
    );
  }
  return true;
}

export function parseContributionPayloadFromBody(body: Record<string, unknown>): {
  sellerContributionTypes: SellerContributionType[];
  sellerContributionNote: string | null;
} {
  return {
    sellerContributionTypes: parseSellerContributionTypes(
      body.sellerContributionTypes,
    ),
    sellerContributionNote: sanitizeSellerContributionNote(
      body.sellerContributionNote,
    ),
  };
}

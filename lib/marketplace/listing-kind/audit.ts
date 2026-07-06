import type { DeriveListingKindInput, DeriveListingKindResult } from './types';

let auditEnabled =
  typeof process !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  process.env.LISTING_KIND_AUDIT !== '0';

const recentSamples: Array<{
  input: DeriveListingKindInput;
  result: DeriveListingKindResult;
  at: string;
}> = [];

const MAX_SAMPLES = 40;

export function setListingKindAuditEnabled(enabled: boolean): void {
  auditEnabled = enabled;
}

export function logListingKindDerivation(
  input: DeriveListingKindInput,
  result: DeriveListingKindResult,
): void {
  if (!auditEnabled) return;

  recentSamples.unshift({
    input,
    result,
    at: new Date().toISOString(),
  });
  if (recentSamples.length > MAX_SAMPLES) {
    recentSamples.length = MAX_SAMPLES;
  }

  if (process.env.LISTING_KIND_AUDIT_VERBOSE === '1') {
    console.debug('[listing-kind]', result.listingKind, result.derivationPath, {
      entityType: input.entityType,
      feedSource: input.feedSource,
      listingIntent: input.listingIntent,
      marketplaceCategory: input.marketplaceCategory,
      specializations: input.specializations,
    });
  }
}

export function getListingKindAuditSamples(): typeof recentSamples {
  return [...recentSamples];
}

export function clearListingKindAuditSamples(): void {
  recentSamples.length = 0;
}

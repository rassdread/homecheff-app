/**
 * Affiliate identity is not the same thing as commercial program participation.
 * MIGRATED_EXISTING preserves history. It is not proof that someone signed up.
 */

export const POPULATION_COMMERCIAL = 'COMMERCIAL';
export const POPULATION_REVIEW = 'REVIEW_REQUIRED';
export const POPULATION_INTERNAL = 'INTERNAL';
export const POPULATION_TECHNICAL = 'TECHNICAL';
export const POPULATION_EXCLUDED_TEST = 'EXCLUDED_TEST';

export const SOURCE_PUBLIC_SIGNUP = 'PUBLIC_SIGNUP';
export const SOURCE_ADMIN_ADMISSION = 'ADMIN_ADMISSION';
export const SOURCE_PARTNER_INVITE = 'PARTNER_INVITE';
export const SOURCE_MIGRATED_EXISTING = 'MIGRATED_EXISTING';
export const SOURCE_TECHNICAL_COMMISSION = 'TECHNICAL_COMMISSION_IDENTITY';

const PUBLIC_SOURCES = new Set([SOURCE_PUBLIC_SIGNUP, 'SIGNUP']);
const ADMIN_SOURCES = new Set([SOURCE_ADMIN_ADMISSION, 'ADMIN']);

export function receivesProgramRights(populationClass: string | null | undefined): boolean {
  return populationClass === POPULATION_COMMERCIAL || populationClass === POPULATION_INTERNAL;
}

export function isCommercialAffiliateParticipant(input: {
  populationClass: string | null | undefined;
  hasEnrollment: boolean;
}): boolean {
  return input.populationClass === POPULATION_COMMERCIAL && input.hasEnrollment;
}

export function isConfirmedPublicSignup(input: {
  populationClass: string | null | undefined;
  enrollmentSource: string | null | undefined;
  termsAcceptedAt: Date | string | null | undefined;
}): boolean {
  if (!isCommercialAffiliateParticipant({
    populationClass: input.populationClass,
    hasEnrollment: Boolean(input.enrollmentSource),
  })) {
    return false;
  }
  if (!input.termsAcceptedAt) return false;
  if (input.enrollmentSource === SOURCE_MIGRATED_EXISTING) return false;
  return PUBLIC_SOURCES.has(input.enrollmentSource || '');
}

export function isAdminAdmission(source: string | null | undefined): boolean {
  return ADMIN_SOURCES.has(source || '');
}

export function isPartnerInvite(source: string | null | undefined): boolean {
  return source === SOURCE_PARTNER_INVITE;
}

/** Opening a page or a commission seat never proves a signup. */
export function migrationMarkerProvesSignup(source: string | null | undefined): boolean {
  if (source === SOURCE_MIGRATED_EXISTING) return false;
  if (source === SOURCE_TECHNICAL_COMMISSION) return false;
  return false;
}

export type PopulationRow = {
  populationClass: string;
  parentAffiliateId: string | null;
  enrollmentSource: string | null;
  termsAcceptedAt: Date | string | null;
  canBecomeMain: boolean;
  mainSource: string | null;
  canInviteSubs: boolean;
};

export type PopulationSummary = {
  rawRows: number;
  commercialParticipants: number;
  confirmedPublicSignups: number;
  confirmedAdminAdmissions: number;
  likelyHistorical: number;
  reviewRequired: number;
  internalIdentities: number;
  technicalIdentities: number;
  testCertification: number;
  excludedFromBusinessMetrics: number;
  explicitEffectiveMain: number;
  mainFromProgram: number;
  mainFromAdminOverride: number;
  mainFromOtherExplicitSource: number;
  totalSubRelationships: number;
  activeCommercialSubs: number;
  testSubsExcluded: number;
};

export function summarizeAffiliatePopulation(rows: PopulationRow[]): PopulationSummary {
  const summary: PopulationSummary = {
    rawRows: rows.length,
    commercialParticipants: 0,
    confirmedPublicSignups: 0,
    confirmedAdminAdmissions: 0,
    likelyHistorical: 0,
    reviewRequired: 0,
    internalIdentities: 0,
    technicalIdentities: 0,
    testCertification: 0,
    excludedFromBusinessMetrics: 0,
    explicitEffectiveMain: 0,
    mainFromProgram: 0,
    mainFromAdminOverride: 0,
    mainFromOtherExplicitSource: 0,
    totalSubRelationships: 0,
    activeCommercialSubs: 0,
    testSubsExcluded: 0,
  };

  for (const row of rows) {
    const commercial = isCommercialAffiliateParticipant({
      populationClass: row.populationClass,
      hasEnrollment: Boolean(row.enrollmentSource),
    });
    if (commercial) summary.commercialParticipants += 1;
    if (row.populationClass === POPULATION_REVIEW) summary.reviewRequired += 1;
    if (row.populationClass === POPULATION_INTERNAL) summary.internalIdentities += 1;
    if (row.populationClass === POPULATION_TECHNICAL) summary.technicalIdentities += 1;
    if (row.populationClass === POPULATION_EXCLUDED_TEST) summary.testCertification += 1;
    if (!commercial) summary.excludedFromBusinessMetrics += 1;
    if (
      commercial &&
      row.enrollmentSource === SOURCE_MIGRATED_EXISTING
    ) {
      summary.likelyHistorical += 1;
    }
    if (isConfirmedPublicSignup(row)) summary.confirmedPublicSignups += 1;
    if (commercial && isAdminAdmission(row.enrollmentSource)) summary.confirmedAdminAdmissions += 1;

    const countsAsExplicitMain = commercial && row.canBecomeMain;
    if (countsAsExplicitMain) {
      summary.explicitEffectiveMain += 1;
      if (row.mainSource === 'PROGRAM') summary.mainFromProgram += 1;
      else if (row.mainSource === 'ADMIN_OVERRIDE') summary.mainFromAdminOverride += 1;
      else summary.mainFromOtherExplicitSource += 1;
    }

    if (row.parentAffiliateId) {
      summary.totalSubRelationships += 1;
      if (commercial) summary.activeCommercialSubs += 1;
      if (row.populationClass === POPULATION_EXCLUDED_TEST) summary.testSubsExcluded += 1;
    }
  }

  return summary;
}

export function childPopulationClass(parentClass: string | null | undefined): string {
  if (parentClass === POPULATION_EXCLUDED_TEST) return POPULATION_EXCLUDED_TEST;
  return POPULATION_COMMERCIAL;
}

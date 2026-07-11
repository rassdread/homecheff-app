/**
 * Phase 13X — HomeCheff Operating System SSOT.
 *
 * Constitutional layer governing every future decision. Outlives the software.
 * Public philosophy derives from Manifest (13T); this file adds governance charters.
 *
 * Other pages must reference this SSOT — not duplicate long-form text.
 * Phase 13O truth boundaries apply to all public surfaces.
 */

import {
  MANIFEST_CORE_VALUES,
  MANIFEST_IS_NOT,
  MANIFEST_MISSION,
  MANIFEST_PATH,
  MANIFEST_VISION,
  type ManifestCoreValueKey,
  type ManifestLang,
} from '@/lib/seo/homecheff-manifest';

export const CONSTITUTION_PATH = '/constitution' as const;
export const CONSTITUTION_NAMESPACE = 'constitutionPage' as const;
export const OPERATING_SYSTEM_LAST_REVIEWED = '2026-07-11';

export type OperatingSystemLang = ManifestLang;

/** Re-export manifest anchors — single philosophical source. */
export {
  MANIFEST_CORE_VALUES,
  MANIFEST_IS_NOT,
  MANIFEST_MISSION,
  MANIFEST_VISION,
  MANIFEST_PATH,
  type ManifestCoreValueKey,
};

/** Decision framework — a feature must strengthen at least one pillar. */
export const DECISION_FRAMEWORK_STRENGTHENS = [
  'humanDignity',
  'craftsmanship',
  'localEconomy',
  'neighbourhoods',
  'transparency',
  'honestOpportunity',
  'technologyWithConscience',
] as const;

export type DecisionFrameworkKey = (typeof DECISION_FRAMEWORK_STRENGTHENS)[number];

export const DECISION_FRAMEWORK_LABELS: Record<
  DecisionFrameworkKey,
  Record<OperatingSystemLang, string>
> = {
  humanDignity: { nl: 'menselijke waardigheid', en: 'human dignity' },
  craftsmanship: { nl: 'vakmanschap', en: 'craftsmanship' },
  localEconomy: { nl: 'lokale economie', en: 'local economy' },
  neighbourhoods: { nl: 'buurten', en: 'neighbourhoods' },
  transparency: { nl: 'transparantie', en: 'transparency' },
  honestOpportunity: { nl: 'eerlijke kans', en: 'honest opportunity' },
  technologyWithConscience: { nl: 'technologie met geweten', en: 'technology with a conscience' },
};

/** Feature acceptance — all must pass; reject list is illustrative guardrail. */
export const FEATURE_ACCEPTANCE_CRITERIA = [
  'solvesRealProblem',
  'improvesPeopleNotAddiction',
  'reducesComplexity',
  'improvesTrust',
  'fitsManifest',
  'fitsConstitution',
] as const;

export type FeatureAcceptanceKey = (typeof FEATURE_ACCEPTANCE_CRITERIA)[number];

export const FEATURE_REJECT_EXAMPLES = [
  'infiniteScrollEngagement',
  'gamblingMechanics',
  'lootboxes',
  'fakeUrgency',
  'darkPatterns',
  'manipulation',
  'engagementForEngagement',
] as const;

export type FeatureRejectKey = (typeof FEATURE_REJECT_EXAMPLES)[number];

/** AI Charter — allowed vs forbidden uses (public summary). */
export const AI_CHARTER_ALLOWED = [
  'saveTime',
  'helpCreativity',
  'reduceAdministration',
  'improveAccessibility',
  'connectPeople',
] as const;

export const AI_CHARTER_FORBIDDEN = [
  'manipulateBehaviour',
  'maximiseScreenTime',
  'forcePurchases',
  'replaceHumanRelationships',
  'exploitPsychology',
] as const;

/** Ethical growth — reject vs accept patterns. */
export const GROWTH_CHARTER_REJECT = [
  'growthAtAnyCost',
  'vanityMetrics',
  'investorPressureOverMission',
  'spam',
  'clickbait',
  'artificialEngagement',
] as const;

export const GROWTH_CHARTER_ACCEPT = [
  'healthyGrowth',
  'communities',
  'trust',
  'wordOfMouth',
  'quality',
  'longTermValue',
] as const;

/** Investment principles — question keys for due diligence. */
export const INVESTMENT_PRINCIPLE_QUESTIONS = [
  'strengthensMission',
  'remainsIndependent',
  'moneyInfluencesEthics',
  'rejectManipulationFunding',
] as const;

/** Moderation principles — moderator mindset keys. */
export const MODERATION_PRINCIPLE_KEYS = [
  'communityStrength',
  'fairness',
  'consistency',
  'transparency',
  'humanJudgement',
  'appealProcess',
  'techSupportsNeverReplaces',
] as const;

/** Open governance — decision pipeline stages. */
export const GOVERNANCE_PIPELINE_STAGES = [
  'idea',
  'roadmap',
  'development',
  'release',
  'documentation',
  'evidence',
] as const;

/** Company culture — success dimensions (internal; public only with evidence). */
export const CULTURE_SUCCESS_DIMENSIONS = [
  'peopleHelped',
  'trustCreated',
  'craftsmanshipEnabled',
  'communitiesStrengthened',
  'sustainableEconomics',
] as const;

/** 25-year direction — aspirations only, never measurable claims. */
export const FUTURE_DIRECTION_ASPIRATIONS = [
  'quieterTechnology',
  'moreVisiblePeople',
  'strongerLocalEconomies',
  'valuableCraftsmanship',
  'supportiveAi',
  'healthierCommunities',
] as const;

export type FutureAspirationKey = (typeof FUTURE_DIRECTION_ASPIRATIONS)[number];

export const FUTURE_ASPIRATION_LABELS: Record<
  FutureAspirationKey,
  Record<OperatingSystemLang, string>
> = {
  quieterTechnology: {
    nl: 'technologie wordt stiller',
    en: 'technology becomes quieter',
  },
  moreVisiblePeople: {
    nl: 'mensen worden zichtbaarder',
    en: 'people become more visible',
  },
  strongerLocalEconomies: {
    nl: 'lokale economieën worden sterker',
    en: 'local economies become stronger',
  },
  valuableCraftsmanship: {
    nl: 'vakmanschap wordt weer waardevol',
    en: 'craftsmanship becomes valuable again',
  },
  supportiveAi: {
    nl: 'AI wordt een ondersteunende assistent',
    en: 'AI becomes a supportive assistant',
  },
  healthierCommunities: {
    nl: 'gemeenschappen worden gezonder',
    en: 'communities become healthier',
  },
};

/** Short constitution summary for schema — derived from manifest mission. */
export function constitutionSchemaDescription(lang: OperatingSystemLang): string {
  return lang === 'en'
    ? `HomeCheff Operating System: ${MANIFEST_MISSION.en} Governance charters for decisions, AI, growth, moderation and investment.`
    : `HomeCheff Operating System: ${MANIFEST_MISSION.nl} Governance charters voor beslissingen, AI, groei, moderatie en investering.`;
}

/** Validator helper — OS structural completeness. */
export function operatingSystemStructuralCounts() {
  return {
    decisionPillars: DECISION_FRAMEWORK_STRENGTHENS.length,
    featureCriteria: FEATURE_ACCEPTANCE_CRITERIA.length,
    featureRejects: FEATURE_REJECT_EXAMPLES.length,
    aiAllowed: AI_CHARTER_ALLOWED.length,
    aiForbidden: AI_CHARTER_FORBIDDEN.length,
    growthReject: GROWTH_CHARTER_REJECT.length,
    growthAccept: GROWTH_CHARTER_ACCEPT.length,
    investmentQuestions: INVESTMENT_PRINCIPLE_QUESTIONS.length,
    moderationPrinciples: MODERATION_PRINCIPLE_KEYS.length,
    pipelineStages: GOVERNANCE_PIPELINE_STAGES.length,
    cultureDimensions: CULTURE_SUCCESS_DIMENSIONS.length,
    futureAspirations: FUTURE_DIRECTION_ASPIRATIONS.length,
    manifestValues: MANIFEST_CORE_VALUES.length,
  };
}

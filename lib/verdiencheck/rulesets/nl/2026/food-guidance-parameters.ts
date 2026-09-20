/**
 * NL-2026 food / NVWA guidance parameters. Frequency, not revenue.
 * Temperature examples are product-contextual, never universal all-food maxima.
 */

import {
  SRC_NVWA_ALLERGENEN,
  SRC_NVWA_ALLERGENEN_ONVERPAKT,
  SRC_NVWA_ERKENNING,
  SRC_NVWA_ETIKET,
  SRC_NVWA_HACCP,
  SRC_NVWA_REGISTRATIE,
  SRC_NVWA_STAPPENPLAN,
  SRC_NVWA_THUIS,
} from './sources';

export const NVWA_REGISTRATION_SYSTEM = 'MIJNNVWA' as const;
export const NVWA_MIJNNVWA_TRANSITION_DATE = '2026-03-10' as const;

/** Contextual NVWA examples (perishable storage / poultry heating). Not a universal all-food temperature cap. */
export const NVWA_TEMPERATURE_EXAMPLES = {
  perishableStorageBelowC: {
    celsius: 7,
    appliesTo: 'PERISHABLE_FOODS',
    universalForAllFood: false as const,
  },
  chickenHeatingAboveC: {
    celsius: 75,
    appliesTo: 'POULTRY_CHICKEN',
    universalForAllFood: false as const,
  },
} as const;

export const FOOD_GUIDANCE_PARAMETER_META = {
  'nvwa.registration.system': {
    value: NVWA_REGISTRATION_SYSTEM,
    officialSource: SRC_NVWA_REGISTRATIE.officialSource,
    officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
  },
  'nvwa.registration.mijnNvwaTransitionDate': {
    value: NVWA_MIJNNVWA_TRANSITION_DATE,
    officialSource: SRC_NVWA_REGISTRATIE.officialSource,
    officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
  },
  'nvwa.registration.multipleTimesPerYear': {
    value: 'MULTIPLE_TIMES_PER_YEAR',
    officialSource: SRC_NVWA_STAPPENPLAN.officialSource,
    officialSourceUrl: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
  },
  'nvwa.homeSelling.rulesApply': {
    value: true,
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
  },
  'nvwa.haccp.planOrHygieneCode': {
    value: 'FOOD_SAFETY_PLAN_OR_APPROVED_HYGIENE_CODE',
    officialSource: SRC_NVWA_HACCP.officialSource,
    officialSourceUrl: SRC_NVWA_HACCP.officialSourceUrl,
  },
  'nvwa.temperature.perishableExampleC': {
    value: NVWA_TEMPERATURE_EXAMPLES.perishableStorageBelowC,
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
  },
  'nvwa.temperature.chickenExampleC': {
    value: NVWA_TEMPERATURE_EXAMPLES.chickenHeatingAboveC,
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
  },
  'nvwa.allergens.eu14': {
    value: 14,
    officialSource: SRC_NVWA_ALLERGENEN.officialSource,
    officialSourceUrl: SRC_NVWA_ALLERGENEN.officialSourceUrl,
  },
  'nvwa.allergens.unpackagedOnlineBeforePurchase': {
    value: true,
    officialSource: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSource,
    officialSourceUrl: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSourceUrl,
  },
  'nvwa.label.prepacked': {
    value: 'REQUIREMENTS_MATRIX',
    officialSource: SRC_NVWA_ETIKET.officialSource,
    officialSourceUrl: SRC_NVWA_ETIKET.officialSourceUrl,
  },
  'nvwa.recognition.animalOriginReviewOnly': {
    value: 'RECOGNITION_REVIEW_REQUIRED',
    officialSource: SRC_NVWA_ERKENNING.officialSource,
    officialSourceUrl: SRC_NVWA_ERKENNING.officialSourceUrl,
  },
} as const;

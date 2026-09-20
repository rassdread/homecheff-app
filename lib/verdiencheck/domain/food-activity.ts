/**
 * Food / NVWA activity context. Frequency is not revenue.
 * LEGAL-2 remains source of truth for the 14 allergens.
 */

import type { ActivityKind, SaleFrequency } from './activity';
import type { TriState } from './tri-state';

export const FOOD_ACTIVITY_TYPES = [
  'FOOD',
  'BEVERAGE',
  'NOT_FOOD',
  'FOOD_CLASSIFICATION_UNKNOWN',
] as const;
export type FoodActivityType = (typeof FOOD_ACTIVITY_TYPES)[number];

export const PREPARATION_LOCATIONS = [
  'HOME',
  'OTHER_REGISTERED_PREMISES',
  'UNKNOWN',
] as const;
export type PreparationLocation = (typeof PREPARATION_LOCATIONS)[number];

export const FOOD_SELLING_FREQUENCIES = [
  'ONCE_PER_YEAR',
  'MULTIPLE_TIMES_PER_YEAR',
  'UNKNOWN',
] as const;
export type FoodSellingFrequency = (typeof FOOD_SELLING_FREQUENCIES)[number];

export const PACKAGING_MODES = [
  'UNPACKAGED',
  'PREPACKED',
  'PREPACKED_FOR_DIRECT_SALE',
  'UNKNOWN',
] as const;
export type PackagingMode = (typeof PACKAGING_MODES)[number];

export const SALES_CHANNELS = [
  'DIRECT_TO_CONSUMER',
  'BUSINESS_TO_BUSINESS',
  'BOTH',
  'UNKNOWN',
] as const;
export type SalesChannel = (typeof SALES_CHANNELS)[number];

export const NVWA_REGISTRATION_ASSESSMENTS = [
  'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY',
  'REGISTRATION_REQUIRED',
  'ALREADY_REGISTERED',
  'REVIEW_REQUIRED',
  'UNKNOWN',
] as const;
export type NvwaRegistrationAssessment = (typeof NVWA_REGISTRATION_ASSESSMENTS)[number];

export const FOOD_SAFETY_PLAN_STATUSES = [
  'USING_APPROVED_HYGIENE_CODE',
  'USING_OWN_HACCP_PLAN',
  'NOT_ARRANGED',
  'UNKNOWN',
] as const;
export type FoodSafetyPlanStatus = (typeof FOOD_SAFETY_PLAN_STATUSES)[number];

export const ANIMAL_ORIGIN_RECOGNITION_ASSESSMENTS = [
  'NOT_APPLICABLE',
  'REGISTRATION_MAY_BE_SUFFICIENT',
  'RECOGNITION_REVIEW_REQUIRED',
  'UNKNOWN',
] as const;
export type AnimalOriginRecognitionAssessment =
  (typeof ANIMAL_ORIGIN_RECOGNITION_ASSESSMENTS)[number];

export const LABEL_REQUIREMENT_STATES = [
  'REQUIRED',
  'NOT_REQUIRED',
  'CONDITIONAL',
  'UNKNOWN',
] as const;
export type LabelRequirementState = (typeof LABEL_REQUIREMENT_STATES)[number];

export const NUTRITION_DECLARATION_REQUIREMENTS = [
  'REQUIRED',
  'NOT_REQUIRED',
  'REVIEW_REQUIRED',
  'UNKNOWN',
] as const;
export type NutritionDeclarationRequirement =
  (typeof NUTRITION_DECLARATION_REQUIREMENTS)[number];

export const PAL_STATUSES = [
  'NOT_ASSESSED',
  'REVIEW_REQUIRED',
  'SUPPORTED_LATER',
] as const;
export type PrecautionaryAllergenLabellingStatus = (typeof PAL_STATUSES)[number];

export const SHELF_LIFE_MARKS = [
  'THT',
  'TGT',
  'OTHER_OR_NOT_APPLICABLE',
  'UNKNOWN',
] as const;
export type ShelfLifeMark = (typeof SHELF_LIFE_MARKS)[number];

export type FoodActivityContext = {
  activityType: FoodActivityType;
  preparationLocation: PreparationLocation;
  sellingFrequency: FoodSellingFrequency;
  sellsDirectToConsumers: TriState;
  sellsBusinessToBusiness: TriState;
  packagingMode: PackagingMode;
  handlesAnimalOriginProducts: TriState;
  nvwaRegistrationStatus: TriState;
  foodSafetyPlanStatus: FoodSafetyPlanStatus;
  containsAlcohol: TriState;
  isPrimaryProduction: TriState;
};

export function classifyFoodActivityType(
  kinds: readonly ActivityKind[],
  beverage?: boolean,
): FoodActivityType {
  if (kinds.includes('FOOD') && kinds.includes('SERVICE') && kinds.length === 2) {
    return beverage ? 'BEVERAGE' : 'FOOD';
  }
  if (kinds.includes('FOOD')) return beverage ? 'BEVERAGE' : 'FOOD';
  if (kinds.length === 0) return 'FOOD_CLASSIFICATION_UNKNOWN';
  return 'NOT_FOOD';
}

export function isFoodRoute(type: FoodActivityType): boolean {
  return type === 'FOOD' || type === 'BEVERAGE';
}

/**
 * UX frequency → legal food frequency.
 * “Een paar keer per jaar” maps to MULTIPLE_TIMES_PER_YEAR (NVWA stappenplan).
 */
export function mapSaleFrequencyToFoodSellingFrequency(
  frequency: SaleFrequency,
): FoodSellingFrequency {
  if (frequency === 'ONE_OFF') return 'ONCE_PER_YEAR';
  if (frequency === 'OCCASIONAL' || frequency === 'REGULAR') {
    return 'MULTIPLE_TIMES_PER_YEAR';
  }
  return 'UNKNOWN';
}

export function mapUxFoodFrequency(
  ux: 'ONE_OFF' | 'OCCASIONAL_RECURRING' | 'REGULAR' | 'UNKNOWN',
): FoodSellingFrequency {
  if (ux === 'ONE_OFF') return 'ONCE_PER_YEAR';
  if (ux === 'OCCASIONAL_RECURRING' || ux === 'REGULAR') {
    return 'MULTIPLE_TIMES_PER_YEAR';
  }
  return 'UNKNOWN';
}

export function emptyFoodActivity(
  type: FoodActivityType = 'FOOD',
): FoodActivityContext {
  return {
    activityType: type,
    preparationLocation: 'UNKNOWN',
    sellingFrequency: 'UNKNOWN',
    sellsDirectToConsumers: 'YES',
    sellsBusinessToBusiness: 'NO',
    packagingMode: 'UNKNOWN',
    handlesAnimalOriginProducts: 'UNKNOWN',
    nvwaRegistrationStatus: 'UNKNOWN',
    foodSafetyPlanStatus: 'UNKNOWN',
    containsAlcohol: 'NO',
    isPrimaryProduction: 'NO',
  };
}

export function assessNvwaRegistration(
  ctx: FoodActivityContext,
): NvwaRegistrationAssessment {
  if (!isFoodRoute(ctx.activityType)) return 'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY';
  if (ctx.nvwaRegistrationStatus === 'YES') return 'ALREADY_REGISTERED';
  if (ctx.sellingFrequency === 'ONCE_PER_YEAR') {
    return 'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY';
  }
  if (ctx.sellingFrequency === 'UNKNOWN') return 'UNKNOWN';
  if (ctx.sellingFrequency === 'MULTIPLE_TIMES_PER_YEAR') {
    if (ctx.sellsDirectToConsumers === 'NO' && ctx.sellsBusinessToBusiness === 'UNKNOWN') {
      return 'REVIEW_REQUIRED';
    }
    return 'REGISTRATION_REQUIRED';
  }
  return 'UNKNOWN';
}

/**
 * Animal origin never auto-flips to recognition required.
 */
export function assessAnimalOriginRecognition(
  ctx: FoodActivityContext,
): AnimalOriginRecognitionAssessment {
  if (ctx.handlesAnimalOriginProducts !== 'YES') {
    return ctx.handlesAnimalOriginProducts === 'NO' ? 'NOT_APPLICABLE' : 'UNKNOWN';
  }
  if (ctx.sellsDirectToConsumers === 'YES' && ctx.sellsBusinessToBusiness !== 'YES') {
    return 'REGISTRATION_MAY_BE_SUFFICIENT';
  }
  return 'RECOGNITION_REVIEW_REQUIRED';
}

export const SPECIAL_CATEGORY_NOT_SUPPORTED = 'SPECIAL_CATEGORY_NOT_SUPPORTED';
export const PRIMARY_PRODUCTION_RULESET_NOT_CERTIFIED =
  'PRIMARY_PRODUCTION_RULESET_NOT_CERTIFIED';

export const FOOD_SAFETY_CATEGORIES = [
  'PERSONAL_HYGIENE',
  'CLEAN_WORKSPACE',
  'SEPARATE_RAW_AND_READY_TO_EAT',
  'SAFE_STORAGE',
  'SAFE_HEATING',
  'SAFE_COOLING',
  'TEMPERATURE_CONTROL',
  'CROSS_CONTAMINATION_PREVENTION',
  'ALLERGEN_CONTROL',
] as const;
export type FoodSafetyCategory = (typeof FOOD_SAFETY_CATEGORIES)[number];

export const PREPACKED_LABEL_FIELDS = [
  'name',
  'ingredientList',
  'allergens',
  'qid',
  'netQuantity',
  'shelfLife',
  'storageInstructions',
  'operatorNameAddress',
  'origin',
  'instructionsForUse',
  'alcoholStrength',
  'nutritionDeclaration',
] as const;
export type PrepackedLabelField = (typeof PREPACKED_LABEL_FIELDS)[number];

export type PrepackedFoodLabelContext = {
  packagingMode: PackagingMode;
  fields: Record<PrepackedLabelField, LabelRequirementState>;
  nutritionDeclarationRequirement: NutritionDeclarationRequirement;
  palStatus: PrecautionaryAllergenLabellingStatus;
  listingAllergenInfoIsNotPhysicalLabel: true;
};

export function prepackedLabelContext(
  packagingMode: PackagingMode,
): PrepackedFoodLabelContext {
  const base: LabelRequirementState =
    packagingMode === 'PREPACKED' ? 'REQUIRED' : packagingMode === 'UNKNOWN' ? 'UNKNOWN' : 'CONDITIONAL';
  const fields = Object.fromEntries(
    PREPACKED_LABEL_FIELDS.map((f) => [f, base]),
  ) as Record<PrepackedLabelField, LabelRequirementState>;
  fields.qid = 'CONDITIONAL';
  fields.origin = 'CONDITIONAL';
  fields.instructionsForUse = 'CONDITIONAL';
  fields.alcoholStrength = 'CONDITIONAL';
  fields.nutritionDeclaration = 'UNKNOWN';
  if (packagingMode !== 'PREPACKED') {
    for (const f of PREPACKED_LABEL_FIELDS) fields[f] = packagingMode === 'UNPACKAGED' ? 'NOT_REQUIRED' : 'UNKNOWN';
    fields.allergens = 'REQUIRED';
  }
  return {
    packagingMode,
    fields,
    nutritionDeclarationRequirement: 'REVIEW_REQUIRED',
    palStatus: 'SUPPORTED_LATER',
    listingAllergenInfoIsNotPhysicalLabel: true,
  };
}

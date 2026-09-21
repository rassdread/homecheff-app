export const NL_2026_MODULE_STATUS = {
  incomeTax: 'CERTIFIED',
  generalTaxCredit: 'CERTIFIED',
  employmentTaxCredit: 'CERTIFIED',
  row: 'CERTIFIED_FOR_ASSUMPTION_MODE',
  zvw: 'CERTIFIED',
  healthcareAllowance: 'CERTIFIED',
  rentAllowance: 'CERTIFIED',
  childBudget: 'CERTIFIED',
  childcareAllowance: 'CERTIFIED',
  iackBelowAow: 'CERTIFIED',
  box1FullYearAow: 'CERTIFIED',
  generalTaxCreditFullYearAow: 'CERTIFIED',
  employmentTaxCreditFullYearAow: 'CERTIFIED',
  iackFullYearAow: 'CERTIFIED',
  olderPersonsTaxCredit: 'CERTIFIED',
  singleOlderPersonsTaxCredit: 'CERTIFIED',
  aowTransitionYearBox1: 'CERTIFIED',
  aowTransitionYearCredits: 'DRAFT',
  jonggehandicaptenkorting: 'DRAFT',
  kvkGuidance: 'CERTIFIED',
  vatEntrepreneurshipGuidance: 'CERTIFIED',
  vatRegistrationThreshold: 'CERTIFIED',
  korGuidance: 'CERTIFIED',
  dac7SellerGuidance: 'CERTIFIED',
  wwGuidance: 'CERTIFIED',
  bijstandBbzGuidance: 'CERTIFIED',
  wiaGuidance: 'CERTIFIED',
  wajongGuidance: 'CERTIFIED',
  zwGuidance: 'CERTIFIED',
  waoGuidance: 'CERTIFIED',
  wazGuidance: 'CERTIFIED',
  foodHomeSellingGuidance: 'CERTIFIED',
  nvwaRegistrationGuidance: 'CERTIFIED',
  foodSafetyGuidance: 'CERTIFIED',
  allergenGuidance: 'CERTIFIED',
  prepackedLabelGuidance: 'PARTIAL',
  animalOriginRecognitionGuidance: 'CERTIFIED_FOR_REVIEW_ONLY',
  personalRouteOrchestration: 'CERTIFIED',
  progressiveDisclosure: 'CERTIFIED',
  nowSoonLaterOrchestration: 'CERTIFIED',
  guidanceDeduplication: 'CERTIFIED',
  fearReductionUx: 'CERTIFIED',
  payrollWhiteMonthly: 'CERTIFIED_FOR_STANDARD_WHITE_MONTHLY',
} as const;

export type Nl2026ModuleId = keyof typeof NL_2026_MODULE_STATUS;

export function nl2026CoreModulesCertified(): boolean {
  return (
    NL_2026_MODULE_STATUS.incomeTax === 'CERTIFIED' &&
    NL_2026_MODULE_STATUS.generalTaxCredit === 'CERTIFIED' &&
    NL_2026_MODULE_STATUS.employmentTaxCredit === 'CERTIFIED' &&
    NL_2026_MODULE_STATUS.row === 'CERTIFIED_FOR_ASSUMPTION_MODE' &&
    NL_2026_MODULE_STATUS.zvw === 'CERTIFIED' &&
    NL_2026_MODULE_STATUS.healthcareAllowance === 'CERTIFIED'
  );
}

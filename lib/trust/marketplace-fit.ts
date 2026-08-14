/**
 * TRUST-1 — canonical marketplace-fit rule (not “entirely homemade”).
 */

export type MarketplaceFitVerdict = 'ALLOWED' | 'NOT_HOMECHEFF_FIT';

export type MarketplaceFitScenario = {
  id: string;
  description: string;
  verdict: MarketplaceFitVerdict;
};

/**
 * Spec scenarios from TRUST-1 acceptance (documentation + tests).
 * These are policy illustrations — never auto-apply from image/country/qty alone.
 */
export const MARKETPLACE_FIT_SCENARIOS: MarketplaceFitScenario[] = [
  {
    id: 'vase-spray-paint',
    description: 'Blank vase bought wholesale + seller spray paints it',
    verdict: 'ALLOWED',
  },
  {
    id: 'china-blanks-recolour',
    description:
      '100 identical blank items bought from China + seller personally recolours each',
    verdict: 'ALLOWED',
  },
  {
    id: 'import-unchanged',
    description: 'Finished imported vase + seller resells unchanged',
    verdict: 'NOT_HOMECHEFF_FIT',
  },
  {
    id: 'chair-restore',
    description: 'Old chair + seller restores/repaints it',
    verdict: 'ALLOWED',
  },
  {
    id: 'jewellery-assemble',
    description: 'Components purchased + seller assembles jewellery',
    verdict: 'ALLOWED',
  },
  {
    id: 'meal-prepare',
    description: 'Ingredients purchased + seller prepares meal',
    verdict: 'ALLOWED',
  },
  {
    id: 'plant-grow',
    description: 'Plant purchased as seed/young plant + seller grows it',
    verdict: 'ALLOWED',
  },
  {
    id: 'phone-case-resale',
    description: 'Standard phone cases bought wholesale + unchanged resale',
    verdict: 'NOT_HOMECHEFF_FIT',
  },
  {
    id: 'gardening-service',
    description: 'Personal gardening service',
    verdict: 'ALLOWED',
  },
  {
    id: 'web-design-service',
    description: 'Personal web-design service',
    verdict: 'ALLOWED',
  },
];

export const MARKETPLACE_FIT_RULE_NL =
  'HomeCheff is bedoeld voor aanbod waar de aanbieder zelf iets aan maakt, bereidt, kweekt, ontwerpt, personaliseert, bewerkt, restaureert, samenstelt of als eigen dienst uitvoert. Ongewijzigde wederverkoop hoort niet op HomeCheff. Herkomst van materialen of onderdelen is niet doorslaggevend.';

export const MARKETPLACE_FIT_RULE_EN =
  'HomeCheff is for offers where the provider personally adds meaningful value through making, preparing, growing, designing, personalising, transforming, restoring, assembling, or performing their own service. Unmodified resale does not belong. Origin of materials or components is not decisive.';

/** Contribution types reserved for TRUST-1.1 provenance UX — not required in TRUST-1. */
export const SELLER_CONTRIBUTION_TYPES = [
  'MADE',
  'PREPARED',
  'GROWN',
  'DESIGNED',
  'PERSONALISED',
  'TRANSFORMED',
  'RESTORED',
  'ASSEMBLED',
  'OTHER_OWN_WORK',
] as const;

export type SellerContributionType =
  (typeof SELLER_CONTRIBUTION_TYPES)[number];

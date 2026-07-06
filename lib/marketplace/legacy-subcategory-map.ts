/**
 * Legacy Dutch subcategory strings (Compact*Form dropdowns) → canonical taxonomy ids.
 * Phase 5B-A — single migration source for edit flows and normalization.
 */

import { getMarketplaceTaxonomyItem } from './taxonomy-resolve';

/** Normalized lookup key: lowercase trimmed */
function normKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Dutch UI strings from CompactChefForm, CompactGardenForm, CompactDesignerForm
 * and common free-text variants → taxonomy dot-id.
 */
const LEGACY_DUTCH_SUBCATEGORY_MAP: Record<string, string> = {
  // CHEFF — meals & cuisine
  hoofdgerecht: 'create.meal',
  voorgerecht: 'create.meal',
  dessert: 'create.cake',
  snack: 'create.meal',
  soep: 'create.soup',
  salade: 'create.meal',
  pasta: 'create.pasta',
  rijst: 'create.rice',
  vegetarisch: 'create.meal',
  veganistisch: 'create.meal',
  glutenvrij: 'create.meal',
  lactosevrij: 'create.meal',
  seizoen: 'create.meal',
  feestdagen: 'create.cake',
  bbq: 'create.bbq',
  bakken: 'create.baking',
  wereldkeuken: 'create.cuisine_surinamese',
  surinaams: 'create.cuisine_surinamese',
  surinaamse: 'create.cuisine_surinamese',
  indonesisch: 'create.cuisine_indonesian',
  antilliaans: 'create.cuisine_caribbean',
  caribisch: 'create.cuisine_caribbean',
  catering: 'create.catering',
  taart: 'create.cake',
  taarten: 'create.cake',
  brood: 'create.bread',
  maaltijden: 'create.meal',
  maaltijdservice: 'create.meal',

  // GARDEN
  groenten: 'grow.vegetables',
  groente: 'grow.vegetables',
  fruit: 'grow.fruit',
  kruiden: 'grow.herbs',
  bloemen: 'grow.plants',
  bomen: 'grow.plants',
  cactussen: 'grow.plants',
  vetplanten: 'grow.houseplants',
  kamerplanten: 'grow.houseplants',
  tuinplanten: 'grow.plants',
  moestuin: 'grow.vegetables',
  biologisch: 'grow.vegetables',
  zaadjes: 'grow.cuttings',
  stekjes: 'grow.cuttings',
  seizoensgroente: 'grow.vegetables',
  exotisch: 'grow.fruit',
  compost: 'grow.plants',
  honing: 'grow.honey',
  planten: 'grow.plants',

  // DESIGNER — products & craft
  meubels: 'create.decoration',
  decoratie: 'create.decoration',
  kleding: 'create.clothing',
  accessoires: 'create.jewelry',
  schilderijen: 'create.art',
  schilderij: 'artistic.painting',
  beelden: 'create.art',
  fotografie: 'design.photo',
  keramiek: 'create.art',
  houtwerk: 'create.art',
  metaalwerk: 'create.art',
  textiel: 'create.clothing',
  'digitale kunst': 'create.art',
  upcycling: 'create.art',
  vintage: 'create.clothing',
  modern: 'create.decoration',
  handgemaakt: 'create.art',
  portret: 'artistic.portrait',
  logo: 'design.logo',
  illustratie: 'design.illustration',

  // Services (legacy free text)
  schoonmaak: 'practical.cleaning',
  oppas: 'practical.childcare',
  kinderopvang: 'practical.childcare',
  fietsreparatie: 'practical.bike_repair',
  reparatie: 'practical.repair',
  computerhulp: 'practical.computerhelp',
  klusjes: 'practical.handyman',
  klushulp: 'practical.handyman',
  tuinonderhoud: 'practical.gardenwork',
  tuinwerk: 'practical.gardenwork',
  kledingreparatie: 'practical.repair',

  // Knowledge / coaching
  kookles: 'knowledge.cookingclass',
  workshop: 'knowledge.workshop',
  coaching: 'knowledge.coaching',
  lifestyle: 'knowledge.coaching_lifestyle',
  'lifestyle-coaching': 'knowledge.coaching_lifestyle',
  sport: 'knowledge.coaching_sport',
  sportcoaching: 'knowledge.coaching_sport',
};

const LOOKUP = LEGACY_DUTCH_SUBCATEGORY_MAP;

export function legacyDutchSubcategoryToTaxonomyId(raw: string): string | null {
  const key = normKey(raw);
  if (!key) return null;
  const mapped = LOOKUP[key];
  if (!mapped) return null;
  return getMarketplaceTaxonomyItem(mapped) ? mapped : null;
}

export function getLegacyDutchSubcategoryMapKeys(): string[] {
  return Object.keys(LOOKUP);
}

/** All legacy Dutch labels (original casing) for audit scripts */
export const LEGACY_DUTCH_SUBCATEGORY_LABELS = [
  ...new Set(Object.keys(LOOKUP).map((k) => k)),
] as const;

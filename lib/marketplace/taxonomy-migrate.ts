/**
 * Legacy V3 specialization slug → canonical taxonomy id migration.
 * Used when reading old Product.specializations[] before UI slice 2.
 */

import { getMarketplaceTaxonomyItem } from './taxonomy-resolve';
import { legacyDutchSubcategoryToTaxonomyId } from './legacy-subcategory-map';

/** V3 flat slug → canonical dot-id */
const LEGACY_SPECIALIZATION_TO_TAXONOMY_ID: Record<string, string> = {
  meal: 'create.meal',
  meals: 'create.meal',
  baking: 'create.baking',
  bbq: 'create.bbq',
  catering: 'create.catering',
  cuisine_surinamese: 'create.cuisine_surinamese',
  cuisine_indonesian: 'create.cuisine_indonesian',
  cuisine_caribbean: 'create.cuisine_caribbean',
  clothing: 'create.clothing',
  jewelry: 'create.jewelry',
  decoration: 'create.decoration',
  art: 'create.art',
  vegetables: 'grow.vegetables',
  fruit: 'grow.fruit',
  herbs: 'grow.herbs',
  plants: 'grow.plants',
  houseplants: 'grow.houseplants',
  cuttings: 'grow.cuttings',
  honey: 'grow.honey',
  logo: 'design.logo',
  website: 'design.website',
  app: 'design.app',
  video: 'design.video',
  photo: 'design.photo',
  illustration: 'design.illustration',
  branding: 'design.branding',
  marketing: 'design.marketing',
  tattoo: 'artistic.tattoo',
  airbrush: 'artistic.airbrush',
  bodypaint: 'artistic.bodypaint',
  mural: 'artistic.mural',
  portrait: 'artistic.portrait',
  music: 'artistic.music',
  gardenwork: 'practical.gardenwork',
  gardening: 'practical.gardenwork',
  cleaning: 'practical.cleaning',
  movinghelp: 'practical.movinghelp',
  computerhelp: 'practical.computerhelp',
  repair: 'practical.repair',
  handyman: 'practical.handyman',
  childcare: 'practical.childcare',
  bike_repair: 'practical.bike_repair',
  workshop: 'knowledge.workshop',
  cookingclass: 'knowledge.cookingclass',
  musicclass: 'knowledge.musicclass',
  musiclesson: 'knowledge.musicclass',
  tutoring: 'knowledge.tutoring',
  coaching: 'knowledge.coaching',
  coaching_lifestyle: 'knowledge.coaching_lifestyle',
  coaching_sport: 'knowledge.coaching_sport',
};

const LEGACY_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_SPECIALIZATION_TO_TAXONOMY_ID).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]),
);

function normalizeLegacySlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function legacySpecializationToTaxonomyId(slug: string): string | null {
  const normalized = normalizeLegacySlug(slug);
  if (!normalized) return null;
  const dariDutch = legacyDutchSubcategoryToTaxonomyId(slug);
  if (dariDutch) return dariDutch;
  const mapped = LEGACY_LOOKUP[normalized];
  if (!mapped) return null;
  return getMarketplaceTaxonomyItem(mapped) ? mapped : null;
}

export function legacySpecializationsToTaxonomyIds(slugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    const id = legacySpecializationToTaxonomyId(slug);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function getLegacySpecializationMappingKeys(): string[] {
  return Object.keys(LEGACY_LOOKUP);
}

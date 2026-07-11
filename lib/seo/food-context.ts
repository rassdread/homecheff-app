import { HOMECHEFF_SEO_PAGE_DEFS } from './homecheffSeoPages';
import type { SeoLandingNs } from './seoLandingBlocks';

/** Programmeerbare landings with primary food intent — get identity reconciliation block. */
export const FOOD_PROGRAMMATIC_NAMESPACES = new Set<SeoLandingNs>([
  'cookingEarningPage',
  'etenVerkopenVanuitHuisPage',
  'thuisgekooktEtenVerkopenPage',
  'zelfgemaaktEtenVerkopenPage',
  'lokaalEtenVerkopenPage',
  'etenVerkopenCityPage',
]);

const FOOD_SEO_ID_PATTERN = /eten|thuisgekookt|koken|chef|meal|food|cook|bezorg/i;

export function isFoodSkewedSeoPageId(id: string): boolean {
  return FOOD_SEO_ID_PATTERN.test(id);
}

export function shouldShowFoodCategoryContextForSeoId(pageId: string): boolean {
  return isFoodSkewedSeoPageId(pageId);
}

export function shouldShowFoodCategoryContextForProgrammaticNs(
  namespace: SeoLandingNs,
): boolean {
  return FOOD_PROGRAMMATIC_NAMESPACES.has(namespace);
}

/** Deterministic variant 0–2 from seed string — avoids duplicate copy on adjacent pages. */
export function pickFoodContextVariant(seed: string): 0 | 1 | 2 {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 3) as 0 | 1 | 2;
}

export function foodContextNamespaceForVariant(variant: 0 | 1 | 2): string {
  return `foodCategoryContextV${variant}`;
}

/** Count food-skewed sitemap paths for corpus balance reporting. */
export function countFoodSkewedSeoDefs(): number {
  return HOMECHEFF_SEO_PAGE_DEFS.filter((p) => isFoodSkewedSeoPageId(p.id)).length;
}

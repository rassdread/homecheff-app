export const CATEGORY_ECOSYSTEM_SLUGS = [
  'keuken',
  'tuin',
  'studio',
  'inspiratie',
  'community',
] as const;

export type CategoryEcosystemSlug = (typeof CATEGORY_ECOSYSTEM_SLUGS)[number];

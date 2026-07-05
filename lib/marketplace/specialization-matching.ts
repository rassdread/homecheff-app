import { normalizeSpecializationSlug } from './listing-taxonomy';

/** True when a listing includes the given specialization slug (future feed/search/matching). */
export function productMatchesSpecialization(
  specializations: string[] | null | undefined,
  slug: string,
): boolean {
  const target = normalizeSpecializationSlug(slug);
  if (!target) return false;
  return (specializations ?? []).some(
    (s) => normalizeSpecializationSlug(s) === target,
  );
}

/** Listings that match any of the requested slugs */
export function productMatchesAnySpecialization(
  specializations: string[] | null | undefined,
  slugs: string[],
): boolean {
  return slugs.some((slug) => productMatchesSpecialization(specializations, slug));
}

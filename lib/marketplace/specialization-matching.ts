import { normalizeSpecializationSlug } from './listing-taxonomy';
import { toCanonicalTaxonomyId } from './taxonomy-normalize';

/** True when a listing includes the given specialization (legacy slug or canonical id). */
export function productMatchesSpecialization(
  specializations: string[] | null | undefined,
  slugOrId: string,
): boolean {
  const target =
    toCanonicalTaxonomyId(slugOrId) ??
    toCanonicalTaxonomyId(normalizeSpecializationSlug(slugOrId));
  if (!target) return false;
  const normalized = (specializations ?? [])
    .map((s) => toCanonicalTaxonomyId(s))
    .filter((id): id is string => id != null);
  return normalized.includes(target);
}

/** Listings that match any of the requested slugs or canonical ids */
export function productMatchesAnySpecialization(
  specializations: string[] | null | undefined,
  slugs: string[],
): boolean {
  return slugs.some((slug) => productMatchesSpecialization(specializations, slug));
}

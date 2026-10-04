import { TAXONOMY_ITEM_LABELS } from '@/lib/marketplace/taxonomy-labels.data';
import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';

/** Human label for a stored subcategory. Taxonomy ids stay stored; only the label changes. */
export function publicSubcategoryLabel(
  raw: string | null | undefined,
  language?: string | null,
): string {
  const value = (raw || '').trim();
  if (!value) return '';
  const canonical = value.includes('.') ? toCanonicalTaxonomyId(value) : null;
  const pair = TAXONOMY_ITEM_LABELS[canonical || value];
  if (!pair) return value;
  return language === 'en' ? pair.en : pair.nl;
}

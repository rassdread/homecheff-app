import type { MarketplaceCategory } from '@prisma/client';

/** Merge key for identical pending proposals (category + language + normalized label). */
export function buildPendingAcceptedValueCanonicalKey(input: {
  category: MarketplaceCategory;
  label: string;
  language: string;
}): string {
  const normalized = input.label.trim().toLowerCase().replace(/\s+/g, ' ');
  const language = input.language.trim().toLowerCase() || 'nl';
  return `${input.category}:${language}:${normalized}`;
}

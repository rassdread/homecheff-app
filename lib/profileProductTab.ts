/**
 * Profiel-tab id's (ProfileClient getTabs) — niet verwarren met oude `tab=producten`.
 */
export type ProductCategoryTab = 'CHEFF' | 'GARDEN' | 'DESIGNER';

export function getProfileTabAfterProductFlow(
  category: ProductCategoryTab
): string {
  switch (category) {
    case 'CHEFF':
      return 'dishes-chef';
    case 'GARDEN':
      return 'dishes-garden';
    case 'DESIGNER':
      return 'dishes-designer';
  }
}

export function getProfileHrefAfterProductSave(
  category: ProductCategoryTab
): string {
  return `/profile?tab=${getProfileTabAfterProductFlow(category)}`;
}

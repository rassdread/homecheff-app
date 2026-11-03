/**
 * Product rows sometimes share an id with a Dish (inspiration mirror).
 * When that Dish is not PUBLISHED and the Product has no sale price,
 * keep the Product off public Marketplace discovery — it is an inspiration draft,
 * not a free physical listing.
 */

export type UnpublishedInspirationMirrorInput = {
  priceCents?: number | null;
  linkedDishStatus?: string | null;
};

export function isUnpublishedInspirationProductMirror(
  input: UnpublishedInspirationMirrorInput,
): boolean {
  const status = String(input.linkedDishStatus ?? '')
    .trim()
    .toUpperCase();
  if (!status || status === 'PUBLISHED') return false;
  return (input.priceCents ?? 0) <= 0;
}

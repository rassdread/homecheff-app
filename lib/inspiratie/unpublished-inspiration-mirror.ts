/**
 * Product rows sometimes share an id with a Dish (inspiration mirror).
 * Zero-price Product mirrors of inspiration Dishes must not appear as
 * ordinary Marketplace sale listings — public discovery uses the Dish path.
 */

export type UnpublishedInspirationMirrorInput = {
  priceCents?: number | null;
  linkedDishStatus?: string | null;
};

/** True when a Product is a zero-price mirror of any inspiration Dish. */
export function isUnpublishedInspirationProductMirror(
  input: UnpublishedInspirationMirrorInput,
): boolean {
  const status = String(input.linkedDishStatus ?? '')
    .trim()
    .toUpperCase();
  if (!status) return false;
  return (input.priceCents ?? 0) <= 0;
}

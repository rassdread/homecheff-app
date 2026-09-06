/**
 * Carrier shipping settlement notes (SHIP-1 domestic).
 *
 * Example: €25.00 item + €8.95 HomeCheff shipping
 *   ITEM_SUBTOTAL              = 2500¢ → Connect transfer to seller (minus platform fee)
 *   BUYER_SHIPPING_CHARGE      =  895¢ → retained by platform (covers ECTAROSHIP_ACTUAL_COST)
 *   PLATFORM_FEE               = fee on product gross only (existing resolvePlatformFeeBps)
 *   SHIPPING_COMPONENT_DESTINATION = platform (NOT added to seller transfer)
 *   ECTAROSHIP_COST_PAYER      = HomeCheff / platform account
 *
 * Do not transfer shipping to seller — that would double-pay shipping (seller + label).
 * Buyer charge ≈ provider quote; no hidden markup in this phase.
 * Rounding: Math.round(provider EUR * 100) → integer cents.
 */

export const SHIPPING_SETTLEMENT_EXAMPLE = {
  itemCents: 2500,
  buyerShippingChargeCents: 895,
  currency: 'EUR',
  markupPercent: 0,
  productProceedsToSeller: 'itemCents minus platform fee (existing Connect settlement)',
  shippingComponentDestination: 'platform',
  platformFee: 'on product gross only',
  ectaroshipCostPayer: 'platform',
} as const;

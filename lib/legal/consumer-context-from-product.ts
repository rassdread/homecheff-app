/**
 * LEGAL-3 — build consumer context from a product API / listing payload shape.
 */

import { buildConsumerCommerceContext } from '@/lib/legal/consumer-commerce-context';
import type { ConsumerCommerceContext } from '@/lib/legal/consumer-commerce-context';

export function consumerContextFromProductPayload(
  product: Record<string, unknown> | null | undefined,
  options?: { serviceStartDuringWithdrawalRequested?: boolean },
): ConsumerCommerceContext | null {
  if (!product) return null;
  const seller = (product.seller ?? null) as Record<string, unknown> | null;
  const user = (seller?.User ?? null) as Record<string, unknown> | null;
  const business = (user?.Business ?? null) as { verified?: boolean } | null;

  return buildConsumerCommerceContext({
    seller: {
      commerceDeclaration:
        (seller?.commerceDeclaration as string | null | undefined) ?? null,
      verifiedBusiness: business?.verified === true,
    },
    product: {
      priceCents: product.priceCents as number | null | undefined,
      priceModel: product.priceModel as string | null | undefined,
      barterOpenness: product.barterOpenness as string | null | undefined,
      category: product.category as string | null | undefined,
      marketplaceCategory: product.marketplaceCategory as
        | string
        | null
        | undefined,
      specializations: product.specializations as string[] | null | undefined,
      madeToConsumerSpecifications: Boolean(
        product.madeToConsumerSpecifications,
      ),
      rapidlyPerishable: Boolean(product.rapidlyPerishable),
      listingIntent: product.listingIntent as string | null | undefined,
    },
    serviceStartDuringWithdrawalRequested:
      options?.serviceStartDuringWithdrawalRequested,
  });
}

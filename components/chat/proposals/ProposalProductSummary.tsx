"use client";

import Image from "next/image";
import Link from "next/link";
import MarketplaceBadgeList from "@/components/marketplace/MarketplaceBadgeList";
import { useTranslation } from "@/hooks/useTranslation";
import { getMarketplacePriceDisplay } from "@/lib/marketplace/price-display";
import type { ConversationHeaderProduct } from "@/lib/communication/resolveConversationHeader";

type Props = {
  product: ConversationHeaderProduct;
};

export default function ProposalProductSummary({ product }: Props) {
  const { t } = useTranslation();

  const priceLabel = getMarketplacePriceDisplay(
    {
      priceCents: product.priceCents,
      priceModel: product.priceModel,
      acceptedSpecializations: product.acceptedSpecializations,
    },
    t,
  );

  const fulfillmentLabels: string[] = [];
  if (product.fulfillmentOptions.pickup) {
    fulfillmentLabels.push(t("marketplace.fulfillment.pickup"));
  }
  if (product.fulfillmentOptions.delivery) {
    fulfillmentLabels.push(t("marketplace.fulfillment.delivery"));
  }
  if (product.fulfillmentOptions.digital) {
    fulfillmentLabels.push(t("proposal.productBinding.fulfillmentDigital"));
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">
        {t("proposal.productBinding.summaryHeading")}
      </p>
      <div className="flex gap-3">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-lg object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-indigo-100 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={product.href}
            className="text-sm font-semibold text-indigo-900 hover:underline line-clamp-2"
          >
            {product.title}
          </Link>
          <p className="text-sm font-medium text-indigo-800">{priceLabel}</p>
        </div>
      </div>
      {product.availableStock != null ? (
        <p className="text-[11px] text-indigo-700">
          {product.availableStock <= 0
            ? t("proposal.productBinding.outOfStock")
            : t("proposal.productBinding.stockAvailable", {
                count: product.availableStock,
              })}
        </p>
      ) : null}
      {product.acceptedSpecializations.length > 0 ? (
        <MarketplaceBadgeList
          specializations={product.acceptedSpecializations}
          variant="accepted"
          maxVisible={4}
          size="sm"
        />
      ) : null}
      {fulfillmentLabels.length > 0 ? (
        <p className="text-[11px] text-indigo-700">
          {t("proposal.productBinding.fulfillmentOffered")}:{" "}
          {fulfillmentLabels.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

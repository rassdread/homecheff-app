import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productToListingQualityInput } from "@/lib/acquisition/product-quality-input";
import {
  explainListingReward,
  listingQualityBand,
  listingQualityHints,
  scoreListingQuality,
} from "@/lib/acquisition/listing-quality";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

/** Owner-only quality. Buyers and anonymous visitors get no score. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const viewerId = (session?.user as { id?: string } | undefined)?.id;
  if (!viewerId) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      Image: { select: { id: true } },
      Video: { select: { id: true } },
      seller: {
        select: {
          userId: true,
          displayName: true,
          bio: true,
          lat: true,
          lng: true,
          User: {
            select: {
              id: true,
              city: true,
              hcCampaignCode: true,
              hcCampaignGrantPending: true,
              firstValidListingProductId: true,
            },
          },
        },
      },
    },
  });
  if (!product || product.seller.userId !== viewerId) {
    return NextResponse.json({ ok: false }, { status: 403, headers: NO_STORE });
  }

  const scored = scoreListingQuality(
    productToListingQualityInput({
      ...product,
      seller: product.seller,
    }),
  );
  const owner = product.seller.User;
  const reward = explainListingReward({
    score: scored.score,
    linkedToCampaign: Boolean(owner?.hcCampaignCode),
    isFirstQualifiedListing: owner?.firstValidListingProductId === product.id,
    grantPending: owner?.hcCampaignGrantPending === true,
  });
  const band = listingQualityBand(scored.score);

  return NextResponse.json(
    {
      ok: true,
      score: scored.score,
      isQuality: scored.isQuality,
      bandNl: band.nl,
      bandEn: band.en,
      hints: listingQualityHints(scored).map(({ nl, en }) => ({ nl, en })),
      summaryNl: reward.nl,
      summaryEn: reward.en,
      promised: reward.promised,
      granted: reward.granted,
    },
    { headers: NO_STORE },
  );
}

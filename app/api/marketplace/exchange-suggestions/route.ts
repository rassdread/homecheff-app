import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  exchangeSuggestionProductSelect,
  isAllowedExchangeSuggestionSurface,
  productRowIsSuggestionEligible,
  productRowToExchangeProfile,
  resolveExchangeSuggestions,
  type ExchangeSuggestionCapState,
  type ExchangeSuggestionSurface,
} from '@/lib/marketplace/exchange-suggestions';

export const dynamic = 'force-dynamic';

const CANDIDATE_LIMIT = 80;

export async function GET(req: Request) {
  try {
    const session = await auth();
    const viewerUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!viewerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const surfaceRaw = url.searchParams.get('surface') ?? 'detail';
    if (!isAllowedExchangeSuggestionSurface(surfaceRaw)) {
      return NextResponse.json({ error: 'Invalid surface' }, { status: 400 });
    }
    const surface = surfaceRaw as ExchangeSuggestionSurface;
    const listingId = url.searchParams.get('listingId');

    let capState: ExchangeSuggestionCapState | undefined;
    const capParam = url.searchParams.get('capState');
    if (capParam) {
      try {
        capState = JSON.parse(capParam) as ExchangeSuggestionCapState;
      } catch {
        capState = undefined;
      }
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: viewerUserId },
      select: { id: true },
    });

    const viewerProducts = sellerProfile
      ? await prisma.product.findMany({
          where: {
            sellerId: sellerProfile.id,
            isActive: true,
          },
          select: exchangeSuggestionProductSelect(),
          take: 20,
        })
      : [];

    const viewerListingIds = viewerProducts.map((p) => p.id);

    const candidates = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(sellerProfile ? { sellerId: { not: sellerProfile.id } } : {}),
        OR: [
          { barterOpenness: { in: ['BARTER_ONLY', 'MONEY_AND_BARTER'] } },
          { listingIntent: 'REQUEST' },
        ],
      },
      select: exchangeSuggestionProductSelect(),
      orderBy: { createdAt: 'desc' },
      take: CANDIDATE_LIMIT,
    });

    const allRows = [...viewerProducts, ...candidates];
    const profiles = allRows
      .filter(productRowIsSuggestionEligible)
      .map((row) =>
        productRowToExchangeProfile({
          id: row.id,
          sellerId: row.sellerId,
          sellerUserId: row.seller.userId,
          title: row.title,
          listingIntent: row.listingIntent,
          marketplaceCategory: row.marketplaceCategory,
          category: row.category,
          subcategory: row.subcategory,
          specializations: row.specializations,
          acceptedSpecializations: row.acceptedSpecializations,
          barterOpenness: row.barterOpenness,
          priceModel: row.priceModel,
          createdAt: row.createdAt,
          availabilityDate: row.availabilityDate,
          isActive: row.isActive,
          sellerUsername: row.seller.User?.username ?? null,
        }),
      );

    const candidateMeta: Record<
      string,
      { title: string; username: string | null; userId: string }
    > = {};
    for (const row of allRows) {
      candidateMeta[row.id] = {
        title: row.title,
        username: row.seller.User?.username ?? null,
        userId: row.seller.userId,
      };
    }

    const sourceListing =
      listingId &&
      (surface === 'detail' || surface === 'mobile')
        ? profiles.find((p) => p.listingId === listingId) ?? null
        : null;

    if (
      (surface === 'detail' || surface === 'mobile') &&
      listingId &&
      !sourceListing
    ) {
      return NextResponse.json(
        { error: 'Listing not eligible for exchange suggestions' },
        { status: 404 },
      );
    }

    const sidebarVariantRaw = url.searchParams.get('sidebarVariant');
    const sidebarVariant =
      sidebarVariantRaw === 'mobile' || sidebarVariantRaw === 'desktop'
        ? sidebarVariantRaw
        : undefined;
    const feedBatch = url.searchParams.get('feedBatch') === '1';

    const plan = resolveExchangeSuggestions({
      surface,
      viewerUserId,
      viewerListingIds,
      sourceListing,
      candidates: profiles,
      candidateMeta,
      capState,
      sidebarVariant,
      feedBatch,
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('[exchange-suggestions]', error);
    return NextResponse.json(
      { error: 'Failed to resolve exchange suggestions' },
      { status: 500 },
    );
  }
}

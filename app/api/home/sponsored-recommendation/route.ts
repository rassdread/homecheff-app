import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { andPublicListingWhere } from '@/lib/marketplace/public-listing-eligibility';
import { resolveBusinessPlanId } from '@/lib/business/visibility-profile';
import { safeDistanceKm } from '@/lib/geocoding';
import { toPublicPlaceLabel } from '@/lib/geo/public-place';
import { buildProductDetailPath } from '@/lib/seo/productSlug';
import { formatMarketplaceDistanceKm } from '@/lib/geo/distance-format';
import {
  selectSponsoredRecommendation,
  sponsoredRecommendationsEnabled,
  type SponsoredCandidateInput,
  type SponsoredPlan,
} from '@/lib/sponsored/recommendation';

export const dynamic = 'force-dynamic';

function listParam(value: string | null, max: number): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Optional sponsored card. Failure and irrelevance both return no item. */
export async function GET(request: NextRequest) {
  if (!sponsoredRecommendationsEnabled()) {
    return NextResponse.json({ item: null });
  }

  try {
    const params = request.nextUrl.searchParams;
    const viewerLat = Number(params.get('lat'));
    const viewerLng = Number(params.get('lng'));
    const hasViewer = Number.isFinite(viewerLat) && Number.isFinite(viewerLng);
    const radiusRaw = Number(params.get('radiusKm'));
    const radiusKm = Number.isFinite(radiusRaw) ? radiusRaw : null;
    const session = await auth();
    const viewerUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const products = await prisma.product.findMany({
      where: andPublicListingWhere({
        seller: {
          subscriptionId: { not: null },
          subscriptionValidUntil: { gt: new Date() },
        },
      }),
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: {
        id: true,
        title: true,
        priceCents: true,
        category: true,
        marketplaceCategory: true,
        delivery: true,
        pickupLat: true,
        pickupLng: true,
        placeName: true,
        Image: { select: { fileUrl: true }, take: 1, orderBy: { sortOrder: 'asc' } },
        seller: {
          select: {
            subscriptionId: true,
            subscriptionValidUntil: true,
            companyName: true,
            lat: true,
            lng: true,
            Subscription: { select: { name: true, feeBps: true } },
            User: {
              select: {
                id: true,
                username: true,
                name: true,
                place: true,
                city: true,
                country: true,
              },
            },
          },
        },
      },
    });

    const candidates: SponsoredCandidateInput[] = [];
    for (const product of products) {
      const plan = resolveBusinessPlanId({
        subscriptionId: product.seller?.subscriptionId,
        subscriptionValidUntil: product.seller?.subscriptionValidUntil,
        Subscription: product.seller?.Subscription,
      });
      if (plan === 'individual') continue;
      const sellerUserId = product.seller?.User?.id;
      if (!sellerUserId) continue;
      const lat = product.pickupLat ?? product.seller?.lat ?? null;
      const lng = product.pickupLng ?? product.seller?.lng ?? null;
      const distance =
        hasViewer && lat != null && lng != null
          ? safeDistanceKm(viewerLat, viewerLng, lat, lng)
          : null;
      candidates.push({
        listingId: product.id,
        sellerUserId,
        title: product.title,
        businessName: product.seller?.companyName?.trim() || product.seller?.User?.name?.trim() || '',
        category: product.category,
        marketplaceCategory: product.marketplaceCategory,
        delivery: product.delivery,
        plan: plan as SponsoredPlan,
        distanceKm: distance,
        country: product.seller?.User?.country ?? null,
        active: true,
        publicListing: true,
      });
    }

    const day = new Date().toISOString().slice(0, 10);
    const chosen = selectSponsoredRecommendation(
      candidates,
      {
        query: params.get('q'),
        category: params.get('category'),
        radiusKm,
        country: params.get('country'),
        viewerUserId,
        excludeListingIds: listParam(params.get('exclude'), 24),
        seenSellerIds: listParam(params.get('seenSellers'), 12),
      },
      `${day}:${params.get('q') ?? ''}:${params.get('category') ?? ''}`,
    );

    if (!chosen) return NextResponse.json({ item: null });

    const product = products.find((row) => row.id === chosen.candidate.listingId);
    if (!product) return NextResponse.json({ item: null });
    const place = toPublicPlaceLabel(
      product.seller?.User?.city || product.seller?.User?.place || product.placeName,
    );

    return NextResponse.json({
      item: {
        listingId: product.id,
        sellerUserId: chosen.candidate.sellerUserId,
        href: buildProductDetailPath(product.title, place, product.id),
        title: product.title,
        businessName: chosen.candidate.businessName,
        place,
        distanceLabel:
          chosen.candidate.distanceKm != null
            ? formatMarketplaceDistanceKm(chosen.candidate.distanceKm)
            : null,
        priceCents: product.priceCents,
        imageUrl: product.Image[0]?.fileUrl ?? null,
        why: chosen.why,
        plan: chosen.candidate.plan,
      },
    });
  } catch {
    return NextResponse.json({ item: null });
  }
}

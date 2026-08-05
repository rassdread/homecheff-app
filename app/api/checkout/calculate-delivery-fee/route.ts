import { NextRequest, NextResponse } from 'next/server';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { calculateDeliveryFee, calculateLongDistanceDeliveryFee } from '@/lib/deliveryPricing';
import { DELIVERY_PLATFORM_FEE_PERCENT, DELIVERY_DELIVERER_PERCENT } from '@/lib/fees';
import { PrismaClient } from '@prisma/client';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import { normalizeFulfillmentInput } from '@/lib/delivery/delivery-fulfillment-vocabulary';
import { resolveDeliveryPickupCoords } from '@/lib/delivery/delivery-position';
import { normalizeCountryCode } from '@/lib/gamification/country-code';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Calculate delivery fee based on coordinates and cart items.
 * Phase 2: when DELIVERY_PROVIDER_PRICING_ENABLED and LOCAL_PROVIDER,
 * price is read only from DeliveryProfile (no platform-constant mix).
 * Phase 5.7: pickup = listing pickup → SellerProfile → User (not browse location).
 */
export async function POST(req: NextRequest) {
  try {
    const {
      items,
      coordinates,
      deliveryMode,
      country,
      deliveryProfileId,
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return NextResponse.json(
        { error: 'Coordinates required' },
        { status: 400 }
      );
    }

    const deliveryModeUpper = (deliveryMode || '').toUpperCase();
    const normalized = normalizeFulfillmentInput(deliveryMode);
    const isLocalProvider =
      normalized.canonical === 'LOCAL_PROVIDER' ||
      deliveryModeUpper === 'LOCAL_PROVIDER' ||
      deliveryModeUpper === 'TEEN_DELIVERY' ||
      deliveryModeUpper === 'DELIVERY';
    const isSellerDelivery =
      normalized.canonical === 'SELLER_DELIVERY' ||
      deliveryModeUpper === 'LOCAL_DELIVERY';
    const isDelivery = isLocalProvider || isSellerDelivery;

    if (!isDelivery) {
      return NextResponse.json({
        deliveryFeeCents: 0,
        distance: 0,
        breakdown: null,
      });
    }

    const productIds = items.map((item: { productId: string }) => item.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        pickupLat: true,
        pickupLng: true,
        seller: {
          select: {
            lat: true,
            lng: true,
            User: {
              select: {
                lat: true,
                lng: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    const buyerCountryCode = normalizeCountryCode(country) || 'NL';

    let totalDistance = 0;
    let isInternationalDelivery = false;
    let sellerCountry = 'NL';
    let routeOk = false;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      const pickup = resolveDeliveryPickupCoords(product);
      if (pickup) {
        sellerCountry =
          normalizeCountryCode(product?.seller?.User?.country) || 'NL';

        if (sellerCountry !== buyerCountryCode) {
          isInternationalDelivery = true;
        }

        const routeResult = await getRouteDistance(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: coordinates.lat, lng: coordinates.lng },
          'driving'
        );

        if ('distance' in routeResult) {
          totalDistance = Math.max(totalDistance, routeResult.distance);
          routeOk = true;
        }
      }
    }

    totalDistance = Math.round(totalDistance * 10) / 10;

    const flags = getDeliveryAlignmentFlags();

    // --- Provider-owned pricing path (LOCAL_PROVIDER only) ---
    if (flags.providerPricingEnabled && isLocalProvider) {
      if (!routeOk) {
        return NextResponse.json(
          {
            error: 'Routeafstand ontbreekt; prijs kan niet worden berekend.',
            code: 'DELIVERY_ROUTE_UNAVAILABLE',
          },
          { status: 422 }
        );
      }

      if (!deliveryProfileId || typeof deliveryProfileId !== 'string') {
        return NextResponse.json(
          {
            error:
              'Bezorgaanbieder is vereist voor provider-prijzen (deliveryProfileId).',
            code: 'DELIVERY_PROVIDER_REQUIRED',
          },
          { status: 400 }
        );
      }

      const profile = await prisma.deliveryProfile.findUnique({
        where: { id: deliveryProfileId },
        select: {
          id: true,
          pricingEnabled: true,
          baseFeeCents: true,
          pricePerKmCents: true,
          minimumFeeCents: true,
          freeDeliveryRadiusKm: true,
          currency: true,
          nationalCoverage: true,
          maxDistance: true,
        },
      });

      if (!profile) {
        return NextResponse.json(
          { error: 'Bezorgaanbieder niet gevonden', code: 'DELIVERY_PROVIDER_REQUIRED' },
          { status: 404 }
        );
      }

      const quote = calculateProviderDeliveryPrice({
        pricing: {
          pricingEnabled: profile.pricingEnabled,
          baseFeeCents: profile.baseFeeCents,
          pricePerKmCents: profile.pricePerKmCents,
          minimumFeeCents: profile.minimumFeeCents,
          freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
          maxDistanceKm: profile.maxDistance,
          currency: profile.currency,
          nationalCoverage: profile.nationalCoverage,
        },
        routeDistanceKm: totalDistance,
        pickupCountryCode: sellerCountry,
        dropoffCountryCode: buyerCountryCode,
        providerCountryCode: sellerCountry,
      });

      if (!quote.ok) {
        return NextResponse.json(
          { error: quote.error, code: quote.code },
          { status: quote.code === 'DELIVERY_OUT_OF_RADIUS' ? 422 : 400 }
        );
      }

      const delivererCut = Math.round(
        quote.deliveryFeeCents * (DELIVERY_DELIVERER_PERCENT / 100)
      );
      const platformCut = Math.round(
        quote.deliveryFeeCents * (DELIVERY_PLATFORM_FEE_PERCENT / 100)
      );

      return NextResponse.json({
        deliveryFeeCents: quote.deliveryFeeCents,
        quotedFeeCents: quote.deliveryFeeCents,
        distance: quote.routeDistanceKm,
        routeDistanceKm: quote.routeDistanceKm,
        isInternational: isInternationalDelivery,
        sellerCountry,
        buyerCountry: buyerCountryCode,
        pricingSource: 'PROVIDER',
        pricingFormulaVersion: quote.breakdown.formulaVersion,
        deliveryProfileId: profile.id,
        baseFeeCents: quote.breakdown.baseFeeCents,
        pricePerKmCents: quote.breakdown.pricePerKmCents,
        minimumFeeCents: quote.breakdown.minimumFeeCents,
        freeDeliveryRadiusKm: quote.breakdown.freeDeliveryRadiusKm,
        currency: profile.currency || 'EUR',
        breakdown: {
          baseFee: quote.breakdown.baseFeeCents,
          baseFeeCents: quote.breakdown.baseFeeCents,
          distanceFee: quote.breakdown.distanceFeeCents,
          totalDeliveryFee: quote.deliveryFeeCents,
          delivererCut,
          homecheffCut: platformCut,
          homecheffFeePercent: DELIVERY_PLATFORM_FEE_PERCENT,
          distance: quote.routeDistanceKm,
          pricePerKmCents: quote.breakdown.pricePerKmCents,
          minimumFeeCents: quote.breakdown.minimumFeeCents,
          freeDeliveryRadiusKm: quote.breakdown.freeDeliveryRadiusKm,
          withinFreeRadius: quote.withinFreeRadius,
          formulaVersion: quote.breakdown.formulaVersion,
          pricingFormulaVersion: quote.breakdown.formulaVersion,
        },
      });
    }

    // --- Legacy platform-constant path (flag off, or seller delivery) ---
    const deliveryType = isSellerDelivery
      ? 'SELLER_DELIVERY'
      : 'PLATFORM_DELIVERERS';

    let pricing;
    if (isInternationalDelivery || totalDistance > 30) {
      pricing = calculateLongDistanceDeliveryFee(totalDistance);
      if (isInternationalDelivery) {
        const internationalSurcharge = 500;
        pricing.totalDeliveryFee += internationalSurcharge;
        pricing.distanceFee += internationalSurcharge;
        pricing.delivererCut = Math.round(
          (pricing.totalDeliveryFee * DELIVERY_DELIVERER_PERCENT) / 100
        );
        pricing.platformCut = Math.round(
          (pricing.totalDeliveryFee * DELIVERY_PLATFORM_FEE_PERCENT) / 100
        );
      }
    } else {
      pricing = calculateDeliveryFee(totalDistance, deliveryType);
    }

    return NextResponse.json({
      deliveryFeeCents: pricing.totalDeliveryFee,
      distance: totalDistance,
      isInternational: isInternationalDelivery,
      sellerCountry,
      buyerCountry: buyerCountryCode,
      pricingSource: 'PLATFORM_LEGACY',
      breakdown: {
        baseFee: pricing.baseFee,
        distanceFee: pricing.distanceFee,
        totalDeliveryFee: pricing.totalDeliveryFee,
        delivererCut: pricing.delivererCut,
        homecheffCut: pricing.platformCut,
        homecheffFeePercent: DELIVERY_PLATFORM_FEE_PERCENT,
        distance: totalDistance,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating delivery fee:', error);
    return NextResponse.json(
      { error: 'Failed to calculate delivery fee', details: message },
      { status: 500 }
    );
  }
}

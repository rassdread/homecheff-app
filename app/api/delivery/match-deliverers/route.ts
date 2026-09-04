import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/geocoding";
import { getRouteDistance } from "@/lib/google-maps-distance";
import { delivererMatchingWhere, isCommerciallyMatchableDeliverer } from "@/lib/delivery/delivery-eligibility";
import { resolveDelivererPosition, resolveDeliveryPickupCoords } from "@/lib/delivery/delivery-position";
import { logCommercialAgeBlock } from "@/lib/delivery/delivery-age";
import { calculateProviderDeliveryPrice } from "@/lib/delivery/provider-pricing";
import {
  resolvePublicAvailabilityBadge,
  validateProviderAutoConfirm,
  ACCEPTANCE_MODE_AUTO,
} from "@/lib/delivery/provider-acceptance";
import { getDeliveryAlignmentFlags } from "@/lib/delivery/delivery-alignment-flags";
import { normalizeCountryCode } from "@/lib/gamification/country-code";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const buyerLat = parseFloat(searchParams.get('buyerLat') || '0');
    const buyerLng = parseFloat(searchParams.get('buyerLng') || '0');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get product and seller location
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        pickupLat: true,
        pickupLng: true,
        seller: {
          select: {
            lat: true,
            lng: true,
            userId: true,
            User: {
              select: {
                name: true,
                place: true,
                country: true,
                lat: true,
                lng: true,
              }
            }
          }
        }
      }
    });

    const pickup = resolveDeliveryPickupCoords(product);
    if (!product || !pickup) {
      return NextResponse.json(
        { error: 'Product or seller location not found', code: 'DELIVERY_ROUTE_UNAVAILABLE' },
        { status: 404 },
      );
    }

    // Get seller's country from product data
    const sellerCountry =
      normalizeCountryCode(product.seller.User?.country) || 'NL';

    // Get all active delivery profiles from the same country/island
    const deliveryProfiles = await prisma.deliveryProfile.findMany({
      where: {
        ...delivererMatchingWhere(),
        user: {
          lat: { not: null },
          lng: { not: null },
          country: sellerCountry // Match same country/island
        }
      },
      select: {
        id: true,
        maxDistance: true,
        transportation: true,
        deliveryMode: true,
        averageRating: true,
        totalDeliveries: true,
        gpsTrackingEnabled: true,
        currentLat: true,
        currentLng: true,
        lastGpsUpdate: true,
        homeLat: true,
        homeLng: true,
        isOnline: true,
        isActive: true,
        isVerified: true,
        isBlocked: true,
        age: true,
        pricingEnabled: true,
        baseFeeCents: true,
        pricePerKmCents: true,
        minimumFeeCents: true,
        freeDeliveryRadiusKm: true,
        currency: true,
        nationalCoverage: true,
        acceptanceMode: true,
        providerType: true,
        companyDisplayName: true,
        companyLogoUrl: true,
        temporaryOffline: true,
        workStartTime: true,
        workEndTime: true,
        estimatedPickupDelayMinutes: true,
        preparationTimeMinutes: true,
        maxSimultaneousDeliveries: true,
        availableDays: true,
        user: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            place: true,
            profileImage: true,
            dateOfBirth: true,
            country: true,
          }
        }
      }
    });

    const ageEligibleProfiles = deliveryProfiles.filter((delivery) => {
      const ok = isCommerciallyMatchableDeliverer({
        isActive: delivery.isActive,
        isVerified: delivery.isVerified,
        isBlocked: delivery.isBlocked,
        dateOfBirth: delivery.user?.dateOfBirth,
        profileAge: delivery.age,
      });
      if (!ok) {
        logCommercialAgeBlock({
          boundary: 'matching',
          userId: delivery.user?.id,
          profileId: delivery.id,
          reason: 'EXCLUDED_FROM_MATCH',
        });
      }
      return ok;
    });

    // Check if this is a Caribbean country/island
    const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'SR'];
    const isCaribbean = sellerCountry && caribbeanCountries.includes(sellerCountry);

    // Calculate distances and filter deliverers within range
    // Use Google Maps for accurate route distances
    // Priority: Use GPS location (currentLat/currentLng) if GPS tracking is enabled and online, otherwise use home location (user.lat/lng)
    const matchedDeliverers = await Promise.all(
      ageEligibleProfiles.map(async (delivery) => {
        const position = resolveDelivererPosition(delivery);
        if (!position) return null;

        const delivererLat = position.lat;
        const delivererLng = position.lng;
        
        // Calculate route distance from delivery person to seller (pickup location)
        const routeToSeller = await getRouteDistance(
          { lat: delivererLat, lng: delivererLng },
          { lat: pickup.lat, lng: pickup.lng },
          'driving'
        );
        const distanceToSeller = 'distance' in routeToSeller 
          ? Math.round(routeToSeller.distance * 10) / 10
          : Math.round(calculateDistance(
              delivererLat,
              delivererLng,
              pickup.lat,
              pickup.lng
            ) * 10) / 10;

        // Calculate distance from delivery person to buyer (delivery location)
        let distanceToBuyer = 0;
        let distanceFromDelivererToBuyer = 0;
        if (buyerLat && buyerLng) {
          // Route distance from seller to buyer (total delivery route)
          const routeSellerToBuyer = await getRouteDistance(
            { lat: pickup.lat, lng: pickup.lng },
            { lat: buyerLat, lng: buyerLng },
            'driving'
          );
          distanceToBuyer = 'distance' in routeSellerToBuyer
            ? Math.round(routeSellerToBuyer.distance * 10) / 10
            : Math.round(calculateDistance(
                pickup.lat,
                pickup.lng,
                buyerLat,
                buyerLng
              ) * 10) / 10;
          
          // Route distance from deliverer's current location (GPS or home) to buyer
          const routeDelivererToBuyer = await getRouteDistance(
            { lat: delivererLat, lng: delivererLng },
            { lat: buyerLat, lng: buyerLng },
            'driving'
          );
          distanceFromDelivererToBuyer = 'distance' in routeDelivererToBuyer
            ? Math.round(routeDelivererToBuyer.distance * 10) / 10
            : Math.round(calculateDistance(
                delivererLat,
                delivererLng,
                buyerLat,
                buyerLng
              ) * 10) / 10;
        }

        // Total delivery distance (from deliverer to seller, then to buyer)
        const totalDeliveryDistance = distanceToSeller + distanceToBuyer;

        return {
          ...delivery,
          distanceToSeller,
          distanceToBuyer,
          distanceFromDelivererToBuyer,
          totalDeliveryDistance,
          deliveryRadius: delivery.maxDistance
        };
      })
    );

    // Filter and sort the matched deliverers
    const filteredAndSortedDeliverers = matchedDeliverers
      .filter((delivery): delivery is NonNullable<typeof delivery> => delivery != null)
      .filter(delivery => {
        if (isCaribbean) {
          // For Caribbean islands: only check if deliverer is on the same island
          // Distance is less important since islands are small
          return delivery.distanceToSeller <= 50; // Max 50km on same island
        } else {
          // National coverage: same-country only (already filtered); radius not required.
          if (delivery.nationalCoverage) {
            return true;
          }
          // Local: deliverer must be within radius of BOTH seller and buyer
          const withinRadiusOfSeller = delivery.distanceToSeller <= delivery.deliveryRadius;
          const withinRadiusOfBuyer = buyerLat && buyerLng 
            ? delivery.distanceFromDelivererToBuyer <= delivery.deliveryRadius 
            : true; // If no buyer location, only check seller
          const reasonableDistance = delivery.totalDeliveryDistance <= 100;
          
          return withinRadiusOfSeller && withinRadiusOfBuyer && reasonableDistance;
        }
      })
      .sort((a, b) => {
        if (isCaribbean) {
          // For Caribbean: prioritize by rating and completed deliveries
          const ratingA = a.averageRating || 0;
          const ratingB = b.averageRating || 0;
          const deliveriesA = a.totalDeliveries || 0;
          const deliveriesB = b.totalDeliveries || 0;
          
          // Sort by rating first, then by number of deliveries
          if (ratingA !== ratingB) return ratingB - ratingA;
          return deliveriesB - deliveriesA;
        } else {
          // For other countries: sort by total distance
          return a.totalDeliveryDistance - b.totalDeliveryDistance;
        }
      });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        seller: {
          name: product.seller.User?.name,
          place: product.seller.User?.place,
          // Phase 5.7 — exact pickup coords are not public; distances remain.
          country: sellerCountry
        }
      },
      region: {
        country: sellerCountry,
        isCaribbean: isCaribbean,
        deliveryMode: isCaribbean ? 'island' : 'distance'
      },
      // Named provider selection contract (Phase 3). No GPS in public payload.
      matchedDeliverers: filteredAndSortedDeliverers.map((delivery) => {
        const routeDistance =
          buyerLat && buyerLng ? delivery.distanceToBuyer : null;

        let calculatedDeliveryPrice: number | null = null;
        let pricingCode: string | null = null;
        if (routeDistance != null) {
          const quote = calculateProviderDeliveryPrice({
            pricing: {
              pricingEnabled: delivery.pricingEnabled,
              baseFeeCents: delivery.baseFeeCents,
              pricePerKmCents: delivery.pricePerKmCents,
              minimumFeeCents: delivery.minimumFeeCents,
              freeDeliveryRadiusKm: delivery.freeDeliveryRadiusKm,
              maxDistanceKm: delivery.maxDistance,
              currency: delivery.currency,
              nationalCoverage: delivery.nationalCoverage,
            },
            routeDistanceKm: routeDistance,
            pickupCountryCode: sellerCountry,
            providerCountryCode:
              normalizeCountryCode(delivery.user?.country) || sellerCountry,
            dropoffCountryCode: sellerCountry,
          });
          if (quote.ok) {
            calculatedDeliveryPrice = quote.deliveryFeeCents;
          } else {
            pricingCode = quote.code;
          }
        }

        const flags = getDeliveryAlignmentFlags();
        const autoCheck = validateProviderAutoConfirm(
          {
            id: delivery.id,
            isActive: delivery.isActive,
            isVerified: delivery.isVerified,
            isBlocked: delivery.isBlocked,
            isOnline: delivery.isOnline,
            pricingEnabled: delivery.pricingEnabled,
            baseFeeCents: delivery.baseFeeCents,
            pricePerKmCents: delivery.pricePerKmCents,
            minimumFeeCents: delivery.minimumFeeCents,
            age: delivery.age,
            maxDistance: delivery.maxDistance,
            nationalCoverage: delivery.nationalCoverage,
            temporaryOffline: delivery.temporaryOffline,
            workStartTime: delivery.workStartTime,
            workEndTime: delivery.workEndTime,
            availableDays: delivery.availableDays,
            maxSimultaneousDeliveries: delivery.maxSimultaneousDeliveries,
            preparationTimeMinutes: delivery.preparationTimeMinutes,
            estimatedPickupDelayMinutes: delivery.estimatedPickupDelayMinutes,
            transportation: delivery.transportation,
            acceptanceMode: delivery.acceptanceMode,
            dateOfBirth: delivery.user?.dateOfBirth,
          },
          {
            routeDistanceKm: routeDistance,
            requirePricingEnabled: flags.providerPricingEnabled,
          }
        );

        const availabilityBadge = resolvePublicAvailabilityBadge({
          acceptanceMode: delivery.acceptanceMode,
          temporaryOffline: delivery.temporaryOffline,
          isActive: delivery.isActive,
          isOnline: delivery.isOnline,
          autoConfirmOk: autoCheck.ok,
        });

        const etaMinutes =
          (delivery.estimatedPickupDelayMinutes ?? 10) +
          (delivery.preparationTimeMinutes ?? 15) +
          Math.round((delivery.totalDeliveryDistance || 0) * 3);

        return {
          id: delivery.id,
          userId: delivery.user.id,
          name: delivery.user.name,
          place: delivery.user.place,
          profileImage: delivery.user.profileImage,
          vehicleType: delivery.transportation[0] || 'BIKE',
          vehicle: delivery.transportation[0] || 'BIKE',
          deliveryRadius: delivery.maxDistance,
          distanceToSeller: delivery.distanceToSeller,
          distanceToBuyer: delivery.distanceToBuyer,
          totalDeliveryDistance: delivery.totalDeliveryDistance,
          rating: delivery.averageRating || 0,
          verification: delivery.isVerified,
          completedDeliveries: delivery.totalDeliveries,
          pricingEnabled: delivery.pricingEnabled,
          baseFeeCents: delivery.baseFeeCents,
          pricePerKmCents: delivery.pricePerKmCents,
          minimumFeeCents: delivery.minimumFeeCents,
          freeDeliveryRadiusKm: delivery.freeDeliveryRadiusKm,
          currency: delivery.currency,
          nationalCoverage: delivery.nationalCoverage,
          routeDistanceKm: routeDistance,
          quotedFeeCents: calculatedDeliveryPrice,
          pricingSource: delivery.pricingEnabled ? 'PROVIDER' : null,
          pricingFormulaVersion: calculatedDeliveryPrice != null ? 'provider-v1' : null,
          pricingCode,
          baseFee: delivery.baseFeeCents,
          pricePerKm: delivery.pricePerKmCents,
          minimumFee: delivery.minimumFeeCents,
          routeDistance,
          calculatedDeliveryPrice,
          acceptanceMode: delivery.acceptanceMode || 'MANUAL_CONFIRM',
          providerType: delivery.providerType || 'INDEPENDENT',
          companyDisplayName: (delivery as any).companyDisplayName || null,
          companyLogoUrl: (delivery as any).companyLogoUrl || null,
          displayName:
            String(delivery.providerType || '').toUpperCase() === 'DELIVERY_BUSINESS'
              ? (delivery as any).companyDisplayName || delivery.user.name || 'Bezorgdienst'
              : delivery.user.name,
          providerKind:
            String(delivery.providerType || '').toUpperCase() === 'DELIVERY_BUSINESS'
              ? 'COMPANY'
              : 'INDIVIDUAL',
          confirmationMode:
            delivery.acceptanceMode === ACCEPTANCE_MODE_AUTO
              ? 'AUTO_CONFIRM'
              : 'MANUAL_CONFIRM',
          availabilityBadge,
          estimatedArrivalMinutes: etaMinutes,
          isAutoConfirmEligible: autoCheck.ok && delivery.acceptanceMode === ACCEPTANCE_MODE_AUTO,
        };
      }),
      totalMatches: filteredAndSortedDeliverers.length
    });

  } catch (error) {
    console.error('Error matching deliverers:', error);
    return NextResponse.json({ error: 'Failed to match deliverers' }, { status: 500 });
  }
}

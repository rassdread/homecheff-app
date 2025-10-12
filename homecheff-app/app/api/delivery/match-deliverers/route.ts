import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/geocoding";

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
        seller: {
          select: {
            lat: true,
            lng: true,
            userId: true,
            User: {
              select: {
                name: true,
                place: true,
                country: true
              }
            }
          }
        }
      }
    });

    if (!product || !product.seller.lat || !product.seller.lng) {
      return NextResponse.json({ error: 'Product or seller location not found' }, { status: 404 });
    }

    // Get seller's country from product data
    const sellerCountry = product.seller.User?.country || 'NL';

    // Get all active delivery profiles from the same country/island
    const deliveryProfiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true,
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
        user: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            place: true,
            profileImage: true
          }
        }
      }
    });

    // Check if this is a Caribbean country/island
    const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'SR'];
    const isCaribbean = sellerCountry && caribbeanCountries.includes(sellerCountry);

    // Calculate distances and filter deliverers within range
    const matchedDeliverers = deliveryProfiles
      .map(delivery => {
        // Calculate distance from delivery person to seller (pickup location)
        const distanceToSeller = Math.round(calculateDistance(
          delivery.user.lat!,
          delivery.user.lng!,
          product.seller.lat!,
          product.seller.lng!
        ) * 10) / 10;

        // Calculate distance from delivery person to buyer (delivery location)
        let distanceToBuyer = 0;
        let distanceFromDelivererToBuyer = 0;
        if (buyerLat && buyerLng) {
          // Distance from seller to buyer (total route distance)
          distanceToBuyer = Math.round(calculateDistance(
            product.seller.lat!,
            product.seller.lng!,
            buyerLat,
            buyerLng
          ) * 10) / 10;
          
          // Distance from deliverer's home location to buyer
          distanceFromDelivererToBuyer = Math.round(calculateDistance(
            delivery.user.lat!,
            delivery.user.lng!,
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
      .filter(delivery => {
        if (isCaribbean) {
          // For Caribbean islands: only check if deliverer is on the same island
          // Distance is less important since islands are small
          return delivery.distanceToSeller <= 50; // Max 50km on same island
        } else {
          // For other countries: deliverer must be within radius of BOTH seller and buyer
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
          lat: product.seller.lat,
          lng: product.seller.lng,
          country: sellerCountry
        }
      },
      region: {
        country: sellerCountry,
        isCaribbean: isCaribbean,
        deliveryMode: isCaribbean ? 'island' : 'distance'
      },
      matchedDeliverers: matchedDeliverers.map(delivery => ({
        id: delivery.id,
        userId: delivery.user.id,
        name: delivery.user.name,
        place: delivery.user.place,
        profileImage: delivery.user.profileImage,
        vehicleType: delivery.transportation[0] || 'BIKE',
        deliveryRadius: delivery.maxDistance,
        distanceToSeller: delivery.distanceToSeller,
        distanceToBuyer: delivery.distanceToBuyer,
        totalDeliveryDistance: delivery.totalDeliveryDistance,
        rating: delivery.averageRating || 0,
        completedDeliveries: delivery.totalDeliveries
      })),
      totalMatches: matchedDeliverers.length
    });

  } catch (error) {
    console.error('Error matching deliverers:', error);
    return NextResponse.json({ error: 'Failed to match deliverers' }, { status: 500 });
  }
}

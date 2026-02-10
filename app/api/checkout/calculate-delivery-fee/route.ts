import { NextRequest, NextResponse } from 'next/server';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { calculateDeliveryFee, calculateLongDistanceDeliveryFee } from '@/lib/deliveryPricing';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Calculate delivery fee based on coordinates and cart items
 * Used for real-time price display in checkout
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      items,
      coordinates,
      deliveryMode,
      country
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
    const isDelivery = deliveryModeUpper === 'DELIVERY' || 
                       deliveryModeUpper === 'LOCAL_DELIVERY' || 
                       deliveryModeUpper === 'TEEN_DELIVERY';

    if (!isDelivery) {
      return NextResponse.json({
        deliveryFeeCents: 0,
        distance: 0,
        breakdown: null
      });
    }

    const productIds = items.map((item: any) => item.productId);
    
    // Get products with seller locations
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        seller: {
          include: {
            User: {
              select: {
                lat: true,
                lng: true,
                country: true
              }
            }
          }
        }
      }
    });

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Products not found' },
        { status: 404 }
      );
    }

    // Get buyer country
    const buyerCountryCode = country || 'NL';
    
    // Calculate actual distance from seller to buyer using Google Maps
    let totalDistance = 0;
    let isInternationalDelivery = false;
    let sellerCountry = 'NL';

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product?.seller?.User?.lat && product?.seller?.User?.lng) {
        // Get seller's country
        sellerCountry = product.seller.User.country || 'NL';
        
        // Check if this is international delivery
        if (sellerCountry !== buyerCountryCode) {
          isInternationalDelivery = true;
        }
        
        // Use Google Maps Distance Matrix for accurate route distance
        const routeResult = await getRouteDistance(
          { lat: product.seller.User.lat, lng: product.seller.User.lng },
          { lat: coordinates.lat, lng: coordinates.lng },
          'driving'
        );
        
        if ('distance' in routeResult) {
          totalDistance = Math.max(totalDistance, routeResult.distance);
        }
      }
    }

    // Round to 1 decimal
    totalDistance = Math.round(totalDistance * 10) / 10;

    // Determine delivery type
    const deliveryType = deliveryModeUpper === 'LOCAL_DELIVERY' ? 'SELLER_DELIVERY' : 'PLATFORM_DELIVERERS';
    
    // Calculate fee
    let pricing;
    if (isInternationalDelivery || totalDistance > 30) {
      pricing = calculateLongDistanceDeliveryFee(totalDistance);
      if (isInternationalDelivery) {
        // Add international surcharge
        const internationalSurcharge = 500; // €5.00
        pricing.totalDeliveryFee += internationalSurcharge;
        pricing.distanceFee += internationalSurcharge;
        pricing.delivererCut = Math.round(pricing.totalDeliveryFee * 0.88);
        pricing.platformCut = Math.round(pricing.totalDeliveryFee * 0.12);
      }
    } else {
      pricing = calculateDeliveryFee(totalDistance, deliveryType);
    }

    return NextResponse.json({
      deliveryFeeCents: pricing.totalDeliveryFee,
      distance: totalDistance,
      isInternational: isInternationalDelivery,
      sellerCountry: sellerCountry,
      buyerCountry: buyerCountryCode,
      breakdown: {
        baseFee: pricing.baseFee,
        distanceFee: pricing.distanceFee,
        totalDeliveryFee: pricing.totalDeliveryFee,
        distance: totalDistance
      }
    });

  } catch (error: any) {
    console.error('Error calculating delivery fee:', error);
    return NextResponse.json(
      { error: 'Failed to calculate delivery fee', details: error.message },
      { status: 500 }
    );
  }
}












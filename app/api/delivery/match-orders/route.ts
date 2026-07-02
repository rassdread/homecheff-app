import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/geocoding";
import { getRouteDistance } from "@/lib/google-maps-distance";
import { assertDelivererCanAccept } from "@/lib/delivery/delivery-eligibility";
import { resolveDelivererPosition } from "@/lib/delivery/delivery-position";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliveryUserId = searchParams.get('deliveryUserId');

    if (!deliveryUserId) {
      return NextResponse.json({ error: 'Delivery user ID required' }, { status: 400 });
    }

    // Get delivery user location and radius
    const deliveryUser = await prisma.user.findUnique({
      where: { id: deliveryUserId },
      select: {
        id: true,
        lat: true,
        lng: true,
        place: true,
        DeliveryProfile: {
          select: {
            isActive: true,
            isVerified: true,
            age: true,
            maxDistance: true,
            transportation: true,
            deliveryMode: true,
            gpsTrackingEnabled: true,
            currentLat: true,
            currentLng: true,
            lastGpsUpdate: true,
            homeLat: true,
            homeLng: true,
            isOnline: true
          }
        }
      }
    });

    if (!deliveryUser?.DeliveryProfile) {
      return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
    }

    if (!deliveryUser.DeliveryProfile.isActive) {
      return NextResponse.json({ error: 'Delivery profile not active' }, { status: 400 });
    }

    const acceptCheck = assertDelivererCanAccept(deliveryUser.DeliveryProfile);
    if (!acceptCheck.ok) {
      return NextResponse.json({ error: acceptCheck.error, code: acceptCheck.code }, { status: 403 });
    }

    const position = resolveDelivererPosition({
      gpsTrackingEnabled: deliveryUser.DeliveryProfile.gpsTrackingEnabled,
      isOnline: deliveryUser.DeliveryProfile.isOnline,
      currentLat: deliveryUser.DeliveryProfile.currentLat,
      currentLng: deliveryUser.DeliveryProfile.currentLng,
      lastGpsUpdate: deliveryUser.DeliveryProfile.lastGpsUpdate,
      homeLat: deliveryUser.DeliveryProfile.homeLat,
      homeLng: deliveryUser.DeliveryProfile.homeLng,
      user: deliveryUser,
    });

    if (!position) {
      return NextResponse.json({ error: 'Delivery user location not found' }, { status: 404 });
    }

    const delivererLat = position.lat;
    const delivererLng = position.lng;
    const useGpsLocation = position.source === 'gps';
    const availableOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                Product: {
                  include: {
                    seller: {
                      select: {
                        lat: true,
                        lng: true,
                        User: {
                          select: {
                            name: true,
                            place: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Filter orders within delivery radius using Google Maps for accurate route distances
    const matchedOrders = await Promise.all(
      availableOrders.map(async (deliveryOrder) => {
        const order = deliveryOrder.order;
        const product = order.items[0]?.Product;
        
        if (!product || !product.seller.lat || !product.seller.lng) {
          return null;
        }

        // Calculate route distance from delivery user to seller using Google Maps
        const routeResult = await getRouteDistance(
          { lat: delivererLat, lng: delivererLng },
          { lat: product.seller.lat!, lng: product.seller.lng! },
          'driving'
        );
        
        const distance = 'distance' in routeResult
          ? Math.round(routeResult.distance * 10) / 10
          : Math.round(calculateDistance(
              delivererLat,
              delivererLng,
              product.seller.lat!,
              product.seller.lng!
            ) * 10) / 10;

        return {
          ...deliveryOrder,
          distance,
          product: {
            id: product.id,
            title: product.title,
            seller: {
              name: product.seller.User?.name,
              place: product.seller.User?.place,
              lat: product.seller.lat,
              lng: product.seller.lng
            }
          }
        };
      })
    );

    // Filter and sort the matched orders
    const filteredAndSortedOrders = matchedOrders
      .filter(order => order && order.distance <= (deliveryUser.DeliveryProfile?.maxDistance || 50))
      .sort((a, b) => a!.distance - b!.distance);

    return NextResponse.json({
      success: true,
      deliveryUser: {
        id: deliveryUser.id,
        place: deliveryUser.place,
        lat: delivererLat,
        lng: delivererLng,
        maxDistance: deliveryUser.DeliveryProfile?.maxDistance,
        usingGpsLocation: useGpsLocation
      },
      matchedOrders: filteredAndSortedOrders.map(order => ({
        id: order!.id,
        orderId: order!.orderId,
        product: order!.product,
        distance: order!.distance,
        deliveryFee: order!.deliveryFee,
        status: order!.status
      })),
      totalMatches: filteredAndSortedOrders.length
    });

  } catch (error) {
    console.error('Error matching orders:', error);
    return NextResponse.json({ error: 'Failed to match orders' }, { status: 500 });
  }
}
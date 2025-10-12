import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session as any).user.id },
      include: {
        deliveryOrders: {
          include: {
            order: {
              include: {
                items: {
                  include: {
                    Product: {
                      include: {
                        Image: {
                          select: { fileUrl: true },
                          take: 1
                        },
                        seller: {
                          include: {
                            User: {
                              select: {
                                name: true,
                                username: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                User: {
                  select: {
                    name: true,
                    username: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // Calculate stats
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayOrders = deliveryProfile.deliveryOrders.filter(order => 
      new Date(order.createdAt) >= startOfDay && order.status === 'DELIVERED'
    );

    const weekOrders = deliveryProfile.deliveryOrders.filter(order => 
      new Date(order.createdAt) >= startOfWeek && order.status === 'DELIVERED'
    );

    const todayEarnings = todayOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
    const weekEarnings = weekOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
    const totalEarnings = deliveryProfile.totalEarnings;

    const completedDeliveries = deliveryProfile.deliveryOrders.filter(order => 
      order.status === 'DELIVERED' && new Date(order.createdAt) >= startOfDay
    ).length;

    const pendingDeliveries = deliveryProfile.deliveryOrders.filter(order => 
      ['PENDING', 'ACCEPTED', 'PICKED_UP'].includes(order.status)
    ).length;

    // Get current order (if any)
    const currentOrder = deliveryProfile.deliveryOrders.find(order => 
      ['PENDING', 'ACCEPTED', 'PICKED_UP'].includes(order.status)
    );

    // Transform current order for frontend
    let transformedCurrentOrder: any = null;
    if (currentOrder) {
      // Find conversation for this delivery order
      const conversation = await prisma.conversation.findFirst({
        where: {
          orderId: currentOrder.orderId,
          ConversationParticipant: {
            some: {
              userId: (session as any).user.id
            }
          }
        },
        select: { id: true }
      });

      transformedCurrentOrder = {
        id: currentOrder.id,
        orderId: currentOrder.orderId,
        status: currentOrder.status,
        deliveryFee: currentOrder.deliveryFee,
        estimatedTime: currentOrder.estimatedTime || 30,
        distance: 5, // Mock distance - would be calculated from coordinates
        customerName: currentOrder.order.User.name || currentOrder.order.User.username || 'Klant',
        customerAddress: currentOrder.order.deliveryAddress || 'Adres niet beschikbaar',
        customerPhone: '06-12345678', // Mock phone - would come from user profile
        notes: currentOrder.notes || '',
        createdAt: currentOrder.createdAt,
        pickedUpAt: currentOrder.pickedUpAt,
        deliveredAt: currentOrder.deliveredAt,
        conversationId: conversation?.id,
        product: {
          title: currentOrder.order.items[0]?.Product?.title || 'Product',
          image: currentOrder.order.items[0]?.Product?.Image?.[0]?.fileUrl || '',
          seller: {
            name: currentOrder.order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
            address: 'Verkoper adres' // Mock address - would come from seller profile
          }
        }
      };
    }

    // Transform recent orders
    const transformedRecentOrders = deliveryProfile.deliveryOrders.slice(0, 5).map(order => ({
      id: order.id,
      orderId: order.orderId,
      status: order.status,
      deliveryFee: order.deliveryFee,
      estimatedTime: order.estimatedTime || 30,
      distance: 5, // Mock distance
      customerName: order.order.User.name || order.order.User.username || 'Klant',
      customerAddress: order.order.deliveryAddress || 'Adres niet beschikbaar',
      customerPhone: '06-12345678', // Mock phone
      notes: order.notes || '',
      createdAt: order.createdAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      product: {
        title: order.order.items[0]?.Product?.title || 'Product',
        image: order.order.items[0]?.Product?.Image?.[0]?.fileUrl || '',
        seller: {
          name: order.order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
          address: 'Verkoper adres' // Mock address
        }
      }
    }));

    // Get user location
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: { lat: true, lng: true }
    });

    // Get available orders within deliverer's radius
    const availableDeliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: 'PENDING',
        deliveryProfileId: ''
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                Product: {
                  include: {
                    Image: {
                      select: { fileUrl: true },
                      take: 1
                    },
                    seller: {
                      include: {
                        User: {
                          select: {
                            id: true,
                            name: true,
                            username: true,
                            lat: true,
                            lng: true,
                            place: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                lat: true,
                lng: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Filter orders by GPS distance and time availability
    const filteredAvailableOrders = availableDeliveryOrders.filter(deliveryOrder => {
      if (!user?.lat || !user?.lng) return false;
      if (!deliveryOrder.order) return false;

      const product = deliveryOrder.order.items[0]?.Product;
      if (!product?.seller?.User?.lat || !product?.seller?.User?.lng) return false;
      if (!deliveryOrder.order.User?.lat || !deliveryOrder.order.User?.lng) return false;

      // Calculate distance to seller (pickup)
      const distanceToSeller = calculateDistance(
        user.lat,
        user.lng,
        product.seller.User.lat,
        product.seller.User.lng
      );

      // Calculate distance to buyer (delivery)
      const distanceToBuyer = calculateDistance(
        user.lat,
        user.lng,
        deliveryOrder.order.User.lat,
        deliveryOrder.order.User.lng
      );

      // Check if within delivery radius of BOTH
      const withinSellerRadius = distanceToSeller <= deliveryProfile.maxDistance;
      const withinBuyerRadius = distanceToBuyer <= deliveryProfile.maxDistance;

      return withinSellerRadius && withinBuyerRadius;
    });

    // Transform available orders for frontend
    const transformedAvailableOrders = filteredAvailableOrders.map(deliveryOrder => {
      const product = deliveryOrder.order.items[0]?.Product;
      const sellerLat = product?.seller?.User?.lat || 0;
      const sellerLng = product?.seller?.User?.lng || 0;
      const buyerLat = deliveryOrder.order.User?.lat || 0;
      const buyerLng = deliveryOrder.order.User?.lng || 0;

      // Calculate distances
      const distanceToSeller = user?.lat && user?.lng && sellerLat && sellerLng
        ? calculateDistance(user.lat, user.lng, sellerLat, sellerLng)
        : 0;
      const distanceToBuyer = user?.lat && user?.lng && buyerLat && buyerLng
        ? calculateDistance(user.lat, user.lng, buyerLat, buyerLng)
        : 0;
      const totalDistance = distanceToSeller + distanceToBuyer;

      return {
        id: deliveryOrder.id,
        orderId: deliveryOrder.orderId,
        status: 'PENDING' as const,
        deliveryFee: deliveryOrder.deliveryFee,
        estimatedTime: Math.round(totalDistance * 5), // ~5 min per km
        distance: totalDistance,
        customerName: deliveryOrder.order.User?.name || deliveryOrder.order.User?.username || 'Klant',
        customerAddress: deliveryOrder.deliveryAddress || 'Bezorgadres',
        customerPhone: '06-12345678', // Mock - would come from user
        notes: deliveryOrder.notes || '',
        createdAt: deliveryOrder.createdAt,
        product: {
          title: product?.title || 'Product',
          image: product?.Image?.[0]?.fileUrl || '',
          seller: {
            name: product?.seller?.User?.name || 'Verkoper',
            address: product?.seller?.User?.place || 'Ophaaladres'
          }
        }
      };
    });

    const availableOrdersCount = transformedAvailableOrders.length;
    
    // Helper function for distance calculation
    function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const stats = {
      todayEarnings,
      weekEarnings,
      totalDeliveries: deliveryProfile.totalDeliveries,
      averageRating: deliveryProfile.averageRating || 0,
      onlineTime: 480, // Mock online time in minutes - would be calculated from activity
      completedDeliveries,
      pendingDeliveries,
      totalEarnings,
      availableOrders: availableOrdersCount,
      deliveryRadius: deliveryProfile.maxDistance || 10,
      currentLocation: user?.lat && user?.lng ? {
        lat: user.lat,
        lng: user.lng
      } : undefined
    };

    return NextResponse.json({
      stats,
      currentOrder: transformedCurrentOrder,
      recentOrders: transformedRecentOrders,
      availableOrders: transformedAvailableOrders
    });

  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch delivery dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

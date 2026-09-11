import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateDistance } from '@/lib/geocoding';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { Stripe } from 'stripe';
import { resolveDelivererPosition, resolveDeliveryPickupCoords, resolveSellerCoords } from '@/lib/delivery/delivery-position';
import {
  customerAddressForPhase,
  customerPhoneForPhase,
  sellerAddressForPhase,
  sellerPhoneForPhase,
} from '@/lib/delivery/delivery-privacy';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;

    // Check if user is a seller (has sellerRoles or is SELLER role)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sellerRoles: true,
        role: true,
        SellerProfile: {
          select: { id: true }
        }
      }
    });

    const isSeller = (user?.sellerRoles && user.sellerRoles.length > 0) || user?.role === 'SELLER';
    const sellerProfileId = user?.SellerProfile?.id;

    // Check if user has delivery profile (for ambassadors)
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        isOnline: true,
        isActive: true,
        isVerified: true,
        maxDistance: true,
        totalDeliveries: true,
        averageRating: true,
        totalEarnings: true,
        deliveryMode: true,
        gpsTrackingEnabled: true,
        currentLat: true,
        currentLng: true,
        lastGpsUpdate: true,
        homeLat: true,
        homeLng: true,
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
                                username: true,
                                address: true,
                                postalCode: true,
                                city: true,
                                place: true,
                                phoneNumber: true,
                                lat: true,
                                lng: true
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
                    username: true,
                    phoneNumber: true,
                    address: true,
                    postalCode: true,
                    city: true,
                    place: true,
                    lat: true,
                    lng: true
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

    // If user is a seller but has no delivery profile, they should see their own LOCAL_DELIVERY orders
    // If user has delivery profile, they are an ambassador and should see TEEN_DELIVERY orders
    if (!deliveryProfile && !isSeller) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // Calculate stats
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let todayOrders: any[] = [];
    let weekOrders: any[] = [];
    let todayEarnings = 0;
    let weekEarnings = 0;
    let totalEarnings = 0;
    let completedDeliveries = 0;
    let pendingDeliveries = 0;
    let transformedCurrentOrder: any = null;
    let transformedRecentOrders: any[] = [];
    let transformedAvailableOrders: any[] = [];

    // Get user location
    const userLocation = await prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true }
    });

    if (isSeller && sellerProfileId && !deliveryProfile) {
      // SELLER VIEW: Show only their own LOCAL_DELIVERY orders
      // LOCAL_DELIVERY orders don't have DeliveryOrder records, so we query Orders directly
      const sellerOrders = await prisma.order.findMany({
        where: {
          deliveryMode: 'DELIVERY', // LOCAL_DELIVERY is mapped to DELIVERY in Order
          items: {
            some: {
              Product: {
                sellerId: sellerProfileId
              }
            }
          },
          // Exclude orders that have DeliveryOrder (those are TEEN_DELIVERY)
          deliveryOrder: null
        },
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
                          username: true,
                          address: true,
                          postalCode: true,
                          city: true,
                          place: true,
                          phoneNumber: true,
                          lat: true,
                          lng: true
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
              username: true,
              lat: true,
              lng: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Filter to only LOCAL_DELIVERY orders by checking Stripe metadata
      const localDeliveryOrders: typeof sellerOrders = [];
      for (const order of sellerOrders) {
        if (order.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            const originalDeliveryMode = stripeSession.metadata?.deliveryMode;
            if (originalDeliveryMode === 'LOCAL_DELIVERY') {
              localDeliveryOrders.push(order);
            }
          } catch (error) {
            // If we can't retrieve Stripe session, skip this order
            console.warn(`Could not retrieve Stripe session for order ${order.id}:`, error);
          }
        }
      }

      // Calculate stats for seller
      todayOrders = localDeliveryOrders.filter(order => 
        new Date(order.createdAt) >= startOfDay && order.status === 'DELIVERED'
      );

      weekOrders = localDeliveryOrders.filter(order => 
        new Date(order.createdAt) >= startOfWeek && order.status === 'DELIVERED'
      );

      // For LOCAL_DELIVERY, seller gets the delivery fee (stored in order metadata or calculated)
      const todayEarningsPromises = todayOrders.map(async (order) => {
        // Try to get delivery fee from Stripe metadata
        if (order.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            const deliveryFeeCents = parseInt(stripeSession.metadata?.deliveryFeeCents || '0');
            return deliveryFeeCents / 100;
          } catch {
            // Fallback: estimate delivery fee (€3 base for LOCAL_DELIVERY)
            return 3;
          }
        }
        return 3;
      });
      todayEarnings = (await Promise.all(todayEarningsPromises)).reduce((sum, fee) => sum + fee, 0);

      const weekEarningsPromises = weekOrders.map(async (order) => {
        if (order.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            const deliveryFeeCents = parseInt(stripeSession.metadata?.deliveryFeeCents || '0');
            return deliveryFeeCents / 100;
          } catch {
            return 3;
          }
        }
        return 3;
      });
      weekEarnings = (await Promise.all(weekEarningsPromises)).reduce((sum, fee) => sum + fee, 0);

      // Calculate total earnings from ALL delivered LOCAL_DELIVERY orders (not just this week)
      const allDeliveredOrders = localDeliveryOrders.filter(order => order.status === 'DELIVERED');
      const totalEarningsPromises = allDeliveredOrders.map(async (order) => {
        if (order.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
            const deliveryFeeCents = parseInt(stripeSession.metadata?.deliveryFeeCents || '0');
            return deliveryFeeCents / 100;
          } catch {
            return 3;
          }
        }
        return 3;
      });
      totalEarnings = (await Promise.all(totalEarningsPromises)).reduce((sum, fee) => sum + fee, 0);
      
      completedDeliveries = todayOrders.length;
      pendingDeliveries = localDeliveryOrders.filter(order => 
        ['CONFIRMED', 'PROCESSING'].includes(order.status)
      ).length;

      // Get current order (if any)
      const currentOrder = localDeliveryOrders.find(order => 
        ['CONFIRMED', 'PROCESSING'].includes(order.status)
      );

      if (currentOrder) {
        const conversation = await prisma.conversation.findFirst({
          where: {
            orderId: currentOrder.id,
            ConversationParticipant: {
              some: {
                userId: userId
              }
            }
          },
          select: { id: true }
        });

        const product = currentOrder.items[0]?.Product;
        // Get delivery fee from Stripe metadata (in cents) or use default
        let deliveryFeeCents = 300; // Default €3.00 in cents
        if (currentOrder.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(currentOrder.stripeSessionId);
            const feeFromMetadata = parseInt(stripeSession.metadata?.deliveryFeeCents || '0');
            if (feeFromMetadata > 0) {
              deliveryFeeCents = feeFromMetadata;
            }
          } catch (error) {
            console.warn('Could not retrieve delivery fee from Stripe:', error);
          }
        }

        transformedCurrentOrder = {
          id: currentOrder.id,
          orderId: currentOrder.id,
          status: currentOrder.status === 'CONFIRMED' ? 'PENDING' : currentOrder.status,
          deliveryFee: deliveryFeeCents, // In cents for consistency
          estimatedTime: 30,
          distance: 0,
          customerName: currentOrder.User.name || currentOrder.User.username || 'Klant',
          customerAddress: currentOrder.deliveryAddress || 'Adres niet beschikbaar',
          customerPhone: customerPhoneForPhase(currentOrder.User, 'assigned'),
          notes: currentOrder.notes || '',
          createdAt: currentOrder.createdAt,
          conversationId: conversation?.id,
          product: {
            title: product?.title || 'Product',
            image: product?.Image?.[0]?.fileUrl || '',
            seller: {
              name: product?.seller?.User?.name || 'Verkoper',
              address: (() => {
                const sellerUser = product?.seller?.User;
                if (!sellerUser) return 'Adres niet beschikbaar';
                const addressParts = [
                  sellerUser.address,
                  sellerUser.postalCode,
                  sellerUser.city || sellerUser.place
                ].filter(Boolean);
                return addressParts.length > 0 ? addressParts.join(', ') : 'Adres niet beschikbaar';
              })(),
              phone: product?.seller?.User?.phoneNumber || null,
              lat: product?.seller?.User?.lat || null,
              lng: product?.seller?.User?.lng || null
            }
          }
        };
      }

      // Transform recent orders
      transformedRecentOrders = await Promise.all(
        localDeliveryOrders.slice(0, 5).map(async (order) => {
          const product = order.items[0]?.Product;
          
          // Get delivery fee from Stripe metadata (in cents) or use default
          let deliveryFeeCents = 300; // Default €3.00 in cents
          if (order.stripeSessionId) {
            try {
              const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
              const feeFromMetadata = parseInt(stripeSession.metadata?.deliveryFeeCents || '0');
              if (feeFromMetadata > 0) {
                deliveryFeeCents = feeFromMetadata;
              }
            } catch (error) {
              console.warn('Could not retrieve delivery fee from Stripe:', error);
            }
          }
          
          return {
            id: order.id,
            orderId: order.id,
            orderNumber: order.orderNumber || `HC-${order.id.slice(-6).toUpperCase()}`,
            status: order.status === 'DELIVERED' ? 'DELIVERED' : 'PENDING',
            deliveryFee: deliveryFeeCents, // In cents for consistency
            estimatedTime: 30,
            distance: 0,
            customerName: order.User.name || order.User.username || 'Klant',
            customerAddress: order.deliveryAddress || 'Adres niet beschikbaar',
            deliveryAddress: order.deliveryAddress || 'Adres niet beschikbaar',
            customerPhone: customerPhoneForPhase(order.User, 'assigned'),
            notes: order.notes || '',
            createdAt: order.createdAt,
            product: {
              title: product?.title || 'Product',
              image: product?.Image?.[0]?.fileUrl || '',
              seller: {
                name: product?.seller?.User?.name || 'Verkoper',
                address: (() => {
                  const sellerUser = product?.seller?.User;
                  if (!sellerUser) return 'Adres niet beschikbaar';
                  const addressParts = [
                    sellerUser.address,
                    sellerUser.postalCode,
                    sellerUser.city || sellerUser.place
                  ].filter(Boolean);
                  return addressParts.length > 0 ? addressParts.join(', ') : 'Adres niet beschikbaar';
                })(),
                phone: product?.seller?.User?.phoneNumber || null,
                lat: product?.seller?.User?.lat || null,
                lng: product?.seller?.User?.lng || null
              }
            }
          };
        })
      );

      // Available orders for seller: empty (they only see their own orders)
      transformedAvailableOrders = [];

      // Get ALL orders for seller (not just LOCAL_DELIVERY and SHIPPING)
      const allSellerOrders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              Product: {
                sellerId: sellerProfileId
              }
            }
          },
          stripeSessionId: { not: null }, // Only paid orders
          NOT: {
            orderNumber: {
              startsWith: 'SUB-' // Exclude subscription orders
            }
          }
        },
        include: {
          items: {
            include: {
              Product: {
                select: {
                  title: true,
                  sellerId: true,
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                }
              }
            }
          },
          User: {
            select: {
              name: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Filter to only include items from this seller and calculate amounts
      const transformedAllOrders = allSellerOrders.map(order => {
        const sellerItems = order.items.filter((item: any) => item.Product?.sellerId === sellerProfileId);
        const totalAmount = sellerItems.reduce((sum, item) => {
          return sum + (item.priceCents * item.quantity);
        }, 0);
        
        const productTitle = sellerItems.length === 1 
          ? sellerItems[0].Product?.title || 'Onbekend product'
          : `${sellerItems.length} producten`;
        const productImage = sellerItems[0]?.Product?.Image?.[0]?.fileUrl || '';

        return {
          id: order.id,
          orderNumber: order.orderNumber || order.id,
          customerName: order.User?.name || order.User?.username || 'Onbekend',
          productTitle,
          productImage,
          amount: totalAmount,
          status: order.status,
          deliveryMode: order.deliveryMode || 'PICKUP',
          deliveryAddress: order.deliveryAddress || '',
          createdAt: order.createdAt.toISOString()
        };
      }).filter(order => order.amount > 0);

      // Calculate total sales revenue from all orders
      const totalSalesRevenue = transformedAllOrders.reduce((sum, order) => sum + order.amount, 0);
      
      // Calculate today's sales revenue
      const todaySalesRevenue = transformedAllOrders
        .filter(order => new Date(order.createdAt) >= startOfDay)
        .reduce((sum, order) => sum + order.amount, 0);
      
      // Calculate week's sales revenue
      const weekSalesRevenue = transformedAllOrders
        .filter(order => new Date(order.createdAt) >= startOfWeek)
        .reduce((sum, order) => sum + order.amount, 0);

      // Get SHIPPING orders with labels for sellers
      const shippingOrders = await prisma.order.findMany({
        where: {
          deliveryMode: 'SHIPPING',
          items: {
            some: {
              Product: {
                sellerId: sellerProfileId
              }
            }
          },
          stripeSessionId: { not: null } // Only paid orders
        },
        include: {
          shippingLabels: {
            select: {
              id: true,
              ectaroShipLabelId: true,
              pdfUrl: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              createdAt: true
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          User: {
            select: {
              name: true,
              username: true,
              email: true
            }
          },
          items: {
            include: {
              Product: {
                select: {
                  title: true,
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Transform shipping orders for response
      const transformedShippingOrders = shippingOrders.map(order => {
        const shippingLabel = order.shippingLabels?.[0] || null;
        const sellerItems = order.items.filter((item: any) => item.Product?.sellerId === sellerProfileId);
        const productTitle = sellerItems.length === 1 
          ? sellerItems[0].Product?.title || 'Onbekend product'
          : `${sellerItems.length} producten`;
        const productImage = sellerItems[0]?.Product?.Image?.[0]?.fileUrl || '';

        return {
          id: order.id,
          orderNumber: order.orderNumber || order.id,
          customerName: order.User?.name || order.User?.username || 'Onbekend',
          productTitle,
          productImage,
          status: order.status,
          deliveryAddress: order.deliveryAddress || '',
          createdAt: order.createdAt.toISOString(),
          shippingLabel: shippingLabel ? {
            id: shippingLabel.id,
            pdfUrl: shippingLabel.pdfUrl,
            trackingNumber: shippingLabel.trackingNumber || order.shippingTrackingNumber,
            carrier: shippingLabel.carrier || order.shippingCarrier,
            status: shippingLabel.status || order.shippingStatus,
            ectaroShipLabelId: shippingLabel.ectaroShipLabelId
          } : null
        };
      });

      // Calculate total earnings = sales revenue + delivery earnings
      const totalCombinedEarnings = totalSalesRevenue + totalEarnings;
      const todayCombinedEarnings = todaySalesRevenue + todayEarnings;
      const weekCombinedEarnings = weekSalesRevenue + weekEarnings;

      // Count all orders (not just deliveries)
      const allPendingOrders = transformedAllOrders.filter(order => 
        ['CONFIRMED', 'PROCESSING'].includes(order.status)
      ).length;
      const allCompletedOrders = transformedAllOrders.filter(order => 
        order.status === 'DELIVERED'
      ).length;

      // Create stats for seller
      const sellerStats = {
        todayEarnings: todayCombinedEarnings, // Combined: sales + delivery
        weekEarnings: weekCombinedEarnings, // Combined: sales + delivery
        totalDeliveries: completedDeliveries,
        averageRating: 0,
        onlineTime: 0,
        completedDeliveries: allCompletedOrders, // All completed orders
        pendingDeliveries: allPendingOrders, // All pending orders
        totalEarnings: totalCombinedEarnings, // Combined: sales + delivery
        totalSalesRevenue: totalSalesRevenue, // Only product sales
        totalDeliveryEarnings: totalEarnings, // Only delivery earnings
        availableOrders: 0,
        deliveryRadius: 10,
        currentLocation: userLocation?.lat && userLocation?.lng ? {
          lat: userLocation.lat,
          lng: userLocation.lng
        } : undefined
      };

      // Add all orders and shipping orders to response
      return NextResponse.json({
        stats: sellerStats,
        isOnline: false,
        currentOrder: transformedCurrentOrder,
        recentOrders: transformedRecentOrders,
        availableOrders: transformedAvailableOrders,
        isSeller: true,
        shippingOrders: transformedShippingOrders,
        allOrders: transformedAllOrders // All seller orders (PICKUP, DELIVERY, SHIPPING)
      });

    } else if (deliveryProfile) {
      // AMBASSADOR VIEW: Show only TEEN_DELIVERY orders (DeliveryOrders without deliveryProfileId)
      todayOrders = deliveryProfile.deliveryOrders.filter(order => 
        new Date(order.createdAt) >= startOfDay && order.status === 'DELIVERED'
      );

      weekOrders = deliveryProfile.deliveryOrders.filter(order => 
        new Date(order.createdAt) >= startOfWeek && order.status === 'DELIVERED'
      );

      todayEarnings = todayOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      weekEarnings = weekOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      totalEarnings = deliveryProfile.totalEarnings;

      completedDeliveries = deliveryProfile.deliveryOrders.filter(order => 
        order.status === 'DELIVERED' && new Date(order.createdAt) >= startOfDay
      ).length;

      pendingDeliveries = deliveryProfile.deliveryOrders.filter(order => 
        ['PENDING', 'ACCEPTED', 'PICKED_UP'].includes(order.status)
      ).length;

      // Get current order (if any)
      const currentOrder = deliveryProfile.deliveryOrders.find(order => 
        ['PENDING', 'ACCEPTED', 'PICKED_UP'].includes(order.status)
      );

      if (currentOrder) {
        const conversation = await prisma.conversation.findFirst({
          where: {
            orderId: currentOrder.orderId,
            ConversationParticipant: {
              some: {
                userId: userId
              }
            }
          },
          select: { id: true }
        });

        let currentDistance = 0;
        let currentEstimatedMin = currentOrder.estimatedTime || 30;
        const sellerUser = currentOrder.order.items[0]?.Product?.seller?.User;
        const buyerUser = currentOrder.order.User as { lat?: number | null; lng?: number | null };
        const dlLat = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.currentLat && deliveryProfile.currentLng)
          ? deliveryProfile.currentLat
          : userLocation?.lat;
        const dlLng = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.currentLng)
          ? deliveryProfile.currentLng
          : userLocation?.lng;
        if (sellerUser?.lat != null && sellerUser?.lng != null && buyerUser?.lat != null && buyerUser?.lng != null && dlLat != null && dlLng != null) {
          const [r1, r2] = await Promise.all([
            getRouteDistance({ lat: dlLat, lng: dlLng }, { lat: sellerUser.lat, lng: sellerUser.lng }, 'driving'),
            getRouteDistance({ lat: sellerUser.lat, lng: sellerUser.lng }, { lat: buyerUser.lat, lng: buyerUser.lng }, 'driving')
          ]);
          if ('distance' in r1 && 'distance' in r2) {
            currentDistance = Math.round((r1.distance + r2.distance) * 10) / 10;
            currentEstimatedMin = r1.duration + r2.duration;
          }
        }

        transformedCurrentOrder = {
          id: currentOrder.id,
          orderId: currentOrder.orderId,
          status: currentOrder.status,
          deliveryFee: currentOrder.deliveryFee,
          estimatedTime: currentEstimatedMin,
          distance: currentDistance || 0,
          customerName: currentOrder.order.User.name || currentOrder.order.User.username || 'Klant',
          customerAddress: customerAddressForPhase(
            currentOrder.order.User,
            currentOrder.order.deliveryAddress || currentOrder.deliveryAddress,
            'assigned'
          ),
          customerPhone: customerPhoneForPhase(currentOrder.order.User, 'assigned'),
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
              address: sellerAddressForPhase(
                currentOrder.order.items[0]?.Product?.seller?.User,
                'assigned'
              ),
              phone: sellerPhoneForPhase(
                currentOrder.order.items[0]?.Product?.seller?.User,
                'assigned'
              ),
              lat: currentOrder.order.items[0]?.Product?.seller?.User?.lat || null,
              lng: currentOrder.order.items[0]?.Product?.seller?.User?.lng || null
            }
          }
        };
      }

      // Transform recent orders (met echte route-afstand waar coördinaten beschikbaar zijn)
      const recentWithDistance = await Promise.all(
        deliveryProfile.deliveryOrders.slice(0, 5).map(async (order) => {
          let dist = 0;
          let estMin = order.estimatedTime || 30;
          const sUser = order.order.items[0]?.Product?.seller?.User;
          const bUser = order.order.User as { lat?: number | null; lng?: number | null };
          const dLat = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.currentLat && deliveryProfile.currentLng) ? deliveryProfile.currentLat : userLocation?.lat;
          const dLng = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.currentLng) ? deliveryProfile.currentLng : userLocation?.lng;
          if (sUser?.lat != null && sUser?.lng != null && bUser?.lat != null && bUser?.lng != null && dLat != null && dLng != null) {
            const [r1, r2] = await Promise.all([
              getRouteDistance({ lat: dLat, lng: dLng }, { lat: sUser.lat, lng: sUser.lng }, 'driving'),
              getRouteDistance({ lat: sUser.lat, lng: sUser.lng }, { lat: bUser.lat, lng: bUser.lng }, 'driving')
            ]);
            if ('distance' in r1 && 'distance' in r2) {
              dist = Math.round((r1.distance + r2.distance) * 10) / 10;
              estMin = r1.duration + r2.duration;
            }
          }
          return {
            id: order.id,
            orderId: order.orderId,
            status: order.status,
            deliveryFee: order.deliveryFee,
            estimatedTime: estMin,
            distance: dist,
            customerName: order.order.User.name || order.order.User.username || 'Klant',
        customerAddress: customerAddressForPhase(
          order.order.User,
          order.order.deliveryAddress,
          'assigned'
        ),
        customerPhone: customerPhoneForPhase(order.order.User, 'assigned'),
        notes: order.notes || '',
        createdAt: order.createdAt,
        pickedUpAt: order.pickedUpAt,
        deliveredAt: order.deliveredAt,
        product: {
          title: order.order.items[0]?.Product?.title || 'Product',
          image: order.order.items[0]?.Product?.Image?.[0]?.fileUrl || '',
          seller: {
            name: order.order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
            address: sellerAddressForPhase(
              order.order.items[0]?.Product?.seller?.User,
              'assigned'
            ),
            phone: sellerPhoneForPhase(
              order.order.items[0]?.Product?.seller?.User,
              'assigned'
            ),
            lat: order.order.items[0]?.Product?.seller?.User?.lat || null,
            lng: order.order.items[0]?.Product?.seller?.User?.lng || null
          }
        }
        };
        })
      );
      transformedRecentOrders = recentWithDistance;

      // Available: legacy pool (null profile) OR targeted to this provider
      const availableDeliveryOrders = await prisma.deliveryOrder.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { deliveryProfileId: null },
            { deliveryProfileId: deliveryProfile.id },
          ],
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
                              address: true,
                              postalCode: true,
                              city: true,
                              place: true,
                              phoneNumber: true,
                              lat: true,
                              lng: true
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
                  phoneNumber: true,
                  address: true,
                  postalCode: true,
                  city: true,
                  place: true,
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

      // Filter orders by distance and time availability (Google Maps route of Haversine)
      // Only show orders if deliverer is online
      const delivererPosition = resolveDelivererPosition(
        {
          gpsTrackingEnabled: deliveryProfile.gpsTrackingEnabled,
          isOnline: deliveryProfile.isOnline,
          currentLat: deliveryProfile.currentLat,
          currentLng: deliveryProfile.currentLng,
          lastGpsUpdate: deliveryProfile.lastGpsUpdate,
          homeLat: deliveryProfile.homeLat,
          homeLng: deliveryProfile.homeLng,
          user: userLocation,
        }
      );
      const delivererLat = delivererPosition?.lat;
      const delivererLng = delivererPosition?.lng;

      const ordersWithDistance = await Promise.all(
        availableDeliveryOrders
          .filter((deliveryOrder) => {
            if (!deliveryProfile.isOnline || !deliveryOrder.order) return false;
            const product = deliveryOrder.order.items[0]?.Product;
            const pickupCoords = resolveDeliveryPickupCoords(product);
            const buyerUser = deliveryOrder.order.User;
            // Targeted jobs (assigned to this provider) stay visible even without geo.
            const isTargeted = deliveryOrder.deliveryProfileId === deliveryProfile.id;
            if (isTargeted && (!delivererLat || !delivererLng || !pickupCoords || buyerUser?.lat == null || buyerUser?.lng == null)) {
              return true;
            }
            if (delivererLat == null || delivererLng == null || !pickupCoords || buyerUser?.lat == null || buyerUser?.lng == null) {
              return false;
            }
            const dPickup = calculateDistance(delivererLat, delivererLng, pickupCoords.lat, pickupCoords.lng);
            const dBuyer = calculateDistance(delivererLat, delivererLng, buyerUser.lat, buyerUser.lng);
            return dPickup <= deliveryProfile.maxDistance * 1.5 && dBuyer <= deliveryProfile.maxDistance * 1.5;
          })
          .slice(0, 20)
          .map(async (deliveryOrder) => {
            const product = deliveryOrder.order!.items[0]?.Product!;
            const pickupCoords = resolveDeliveryPickupCoords(product);
            const buyerLat = deliveryOrder.order!.User!.lat;
            const buyerLng = deliveryOrder.order!.User!.lng;
            const hasGeo =
              delivererLat != null &&
              delivererLng != null &&
              pickupCoords != null &&
              buyerLat != null &&
              buyerLng != null;

            if (!hasGeo) {
              return {
                deliveryOrder,
                distanceToSeller: 0,
                distanceToBuyer: 0,
                totalDistance: 0,
                estimatedMinutes: deliveryOrder.estimatedTime || 30,
              };
            }

            const origin = { lat: delivererLat!, lng: delivererLng! };

            const [routeToPickup, routeToBuyer] = await Promise.all([
              getRouteDistance(origin, pickupCoords!, 'driving'),
              getRouteDistance(origin, { lat: buyerLat!, lng: buyerLng! }, 'driving')
            ]);

            const distanceToSeller = 'distance' in routeToPickup ? routeToPickup.distance : calculateDistance(delivererLat!, delivererLng!, pickupCoords!.lat, pickupCoords!.lng);
            const distanceToBuyer = 'distance' in routeToBuyer ? routeToBuyer.distance : calculateDistance(delivererLat!, delivererLng!, buyerLat!, buyerLng!);
            const durationToSeller = 'duration' in routeToPickup ? routeToPickup.duration : Math.ceil((distanceToSeller / 50) * 60);
            const durationToBuyer = 'duration' in routeToBuyer ? routeToBuyer.duration : Math.ceil((distanceToBuyer / 50) * 60);

            return {
              deliveryOrder,
              distanceToSeller: Math.round(distanceToSeller * 10) / 10,
              distanceToBuyer: Math.round(distanceToBuyer * 10) / 10,
              totalDistance: Math.round((distanceToSeller + distanceToBuyer) * 10) / 10,
              estimatedMinutes: durationToSeller + durationToBuyer
            };
          })
      );

      const filteredAvailableOrders = ordersWithDistance.filter((o) => {
        const isTargeted = o.deliveryOrder.deliveryProfileId === deliveryProfile.id;
        if (isTargeted && o.totalDistance === 0) return true;
        return o.distanceToSeller <= deliveryProfile.maxDistance && o.distanceToBuyer <= deliveryProfile.maxDistance;
      });

      // Transform available orders for frontend (echte route-afstand en geschatte tijd)
      transformedAvailableOrders = filteredAvailableOrders.map(({ deliveryOrder, totalDistance, estimatedMinutes }) => {
        const product = deliveryOrder.order?.items[0]?.Product;
        const buyerUser = deliveryOrder.order?.User;
        const sellerUser = product?.seller?.User;
        return {
          id: deliveryOrder.id,
          orderId: deliveryOrder.orderId,
          status: 'PENDING' as const,
          deliveryFee: deliveryOrder.deliveryFee,
          estimatedTime: estimatedMinutes,
          distance: totalDistance,
          customerName: buyerUser?.name || buyerUser?.username || 'Klant',
          customerAddress: customerAddressForPhase(
            buyerUser,
            deliveryOrder.deliveryAddress,
            'available'
          ),
          customerPhone: customerPhoneForPhase(buyerUser, 'available'),
          notes: deliveryOrder.notes || '',
          createdAt: deliveryOrder.createdAt,
          product: {
            title: product?.title || 'Product',
            image: product?.Image?.[0]?.fileUrl || '',
            seller: {
              name: sellerUser?.name || 'Verkoper',
              address: sellerAddressForPhase(sellerUser, 'available'),
              phone: sellerPhoneForPhase(sellerUser, 'available'),
              lat: resolveDeliveryPickupCoords(product)?.lat ?? resolveSellerCoords(product?.seller)?.lat ?? null,
              lng: resolveDeliveryPickupCoords(product)?.lng ?? resolveSellerCoords(product?.seller)?.lng ?? null
            }
          }
        };
      });
    }

    const availableOrdersCount = transformedAvailableOrders.length;

    // Upcoming scheduled jobs (platform calendar + future ACCEPTED DeliveryOrders)
    // and pending booking requests — same SoT, no duplicate dataset.
    let upcomingJobs: Array<Record<string, unknown>> = [];
    let pendingBookingRequests: Array<Record<string, unknown>> = [];

    if (deliveryProfile) {
      const now = new Date();
      const currentOrderId = transformedCurrentOrder?.id ?? null;
      const availableIds = new Set(
        transformedAvailableOrders.map((o: { id: string }) => o.id),
      );

      const [calendarRows, pendingBookings, communityUpcoming] = await Promise.all([
        prisma.deliveryCalendarEntry.findMany({
          where: {
            deliveryProfileId: deliveryProfile.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            OR: [
              { pickupAt: { gte: now } },
              { deliverAt: { gte: now } },
            ],
          },
          orderBy: [{ pickupAt: 'asc' }, { deliverAt: 'asc' }],
          take: 20,
        }),
        prisma.deliveryBookingRequest.findMany({
          where: {
            deliveryProfileId: deliveryProfile.id,
            status: 'PENDING',
            expiresAt: { gt: now },
          },
          include: {
            buyer: {
              select: { id: true, name: true, username: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 10,
        }),
        prisma.courierAssignment.findMany({
          where: {
            courierId: userId,
            status: { in: ['PENDING', 'ACCEPTED'] },
            DeliveryRequest: {
              OR: [
                { pickupDate: { gt: now } },
                { deliveryDate: { gt: now } },
              ],
            },
          },
          include: {
            DeliveryRequest: {
              select: {
                id: true,
                communityOrderId: true,
                pickupAddress: true,
                deliveryAddress: true,
                pickupDate: true,
                pickupTimeWindow: true,
                deliveryDate: true,
                deliveryTimeWindow: true,
                status: true,
                CommunityOrder: {
                  select: {
                    id: true,
                    conversationId: true,
                    Proposal: { select: { title: true } },
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
          take: 20,
        }),
      ]);

      upcomingJobs = [
        ...calendarRows
          .filter((row) => {
            if (!row.deliveryOrderId) return true;
            if (row.deliveryOrderId === currentOrderId) return false;
            if (availableIds.has(row.deliveryOrderId)) return false;
            return true;
          })
          .map((row) => ({
            id: row.id,
            source: 'calendar' as const,
            deliveryOrderId: row.deliveryOrderId,
            bookingRequestId: row.bookingRequestId,
            title: row.title,
            status: row.status,
            pickupAt: row.pickupAt,
            deliverAt: row.deliverAt,
            earningsCents: row.earningsCents,
            orderReference: row.orderReference,
            href: row.deliveryOrderId
              ? `/delivery/dashboard#order-${row.deliveryOrderId}`
              : '/delivery/dashboard',
          })),
        ...communityUpcoming.map((assignment) => {
          const dr = assignment.DeliveryRequest;
          const title =
            dr.CommunityOrder?.Proposal?.title ||
            'Community bezorging';
          return {
            id: `community-${dr.id}`,
            source: 'community' as const,
            deliveryRequestId: dr.id,
            communityOrderId: dr.communityOrderId,
            title,
            status: assignment.status,
            pickupAt: dr.pickupDate,
            deliverAt: dr.deliveryDate,
            pickupTimeWindow: dr.pickupTimeWindow,
            deliveryTimeWindow: dr.deliveryTimeWindow,
            pickupAddress: dr.pickupAddress,
            deliveryAddress: dr.deliveryAddress,
            href: dr.CommunityOrder?.conversationId
              ? `/messages?conversation=${dr.CommunityOrder.conversationId}`
              : '/delivery/dashboard?tab=community',
          };
        }),
      ].sort((a, b) => {
        const ta = a.pickupAt ? new Date(a.pickupAt as Date).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.pickupAt ? new Date(b.pickupAt as Date).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

      pendingBookingRequests = pendingBookings.map((b) => ({
        id: b.id,
        status: b.status,
        expiresAt: b.expiresAt,
        quotedFeeCents: b.quotedFeeCents,
        routeDistanceKm: b.routeDistanceKm,
        buyerName: b.buyer?.name || b.buyer?.username || 'Klant',
        href: `/delivery/dashboard#booking-${b.id}`,
      }));
    }

    const stats = {
      todayEarnings: todayEarnings,
      weekEarnings: weekEarnings,
      totalDeliveries: deliveryProfile?.totalDeliveries || completedDeliveries,
      averageRating: deliveryProfile?.averageRating || 0,
      onlineTime: 0,
      onlineTimeMeasured: false,
      completedDeliveries,
      pendingDeliveries,
      totalEarnings: totalEarnings,
      availableOrders: availableOrdersCount,
      scheduledJobs: upcomingJobs.length,
      deliveryRadius: deliveryProfile?.maxDistance || 10,
      currentLocation: userLocation?.lat && userLocation?.lng ? {
        lat: userLocation.lat,
        lng: userLocation.lng
      } : undefined
    };

    return NextResponse.json({
      stats,
      isOnline: deliveryProfile?.isOnline || false,
      currentOrder: transformedCurrentOrder,
      recentOrders: transformedRecentOrders,
      availableOrders: transformedAvailableOrders,
      upcomingJobs,
      pendingBookingRequests,
      isSeller: isSeller && !deliveryProfile, // True if seller without delivery profile (only delivering own products)
      shippingOrders: [] // Will be populated for sellers
    });

  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch delivery dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

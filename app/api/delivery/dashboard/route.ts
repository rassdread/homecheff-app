import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateDistance } from '@/lib/geocoding';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { Stripe } from 'stripe';

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
        maxDistance: true,
        totalDeliveries: true,
        averageRating: true,
        totalEarnings: true,
        deliveryMode: true,
        gpsTrackingEnabled: true,
        currentLat: true,
        currentLng: true,
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
          customerPhone: '06-12345678',
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
            customerPhone: '06-12345678',
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
          customerAddress: currentOrder.order.deliveryAddress || 'Adres niet beschikbaar',
          customerPhone: '06-12345678',
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
              address: (() => {
                const sellerUser = currentOrder.order.items[0]?.Product?.seller?.User;
                if (!sellerUser) return 'Adres niet beschikbaar';
                const addressParts = [
                  sellerUser.address,
                  sellerUser.postalCode,
                  sellerUser.city || sellerUser.place
                ].filter(Boolean);
                return addressParts.length > 0 ? addressParts.join(', ') : 'Adres niet beschikbaar';
              })(),
              phone: currentOrder.order.items[0]?.Product?.seller?.User?.phoneNumber || null,
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
        customerAddress: order.order.deliveryAddress || 'Adres niet beschikbaar',
        customerPhone: '06-12345678',
        notes: order.notes || '',
        createdAt: order.createdAt,
        pickedUpAt: order.pickedUpAt,
        deliveredAt: order.deliveredAt,
        product: {
          title: order.order.items[0]?.Product?.title || 'Product',
          image: order.order.items[0]?.Product?.Image?.[0]?.fileUrl || '',
          seller: {
            name: order.order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
            address: (() => {
              const sellerUser = order.order.items[0]?.Product?.seller?.User;
              if (!sellerUser) return 'Adres niet beschikbaar';
              const addressParts = [
                sellerUser.address,
                sellerUser.postalCode,
                sellerUser.city || sellerUser.place
              ].filter(Boolean);
              return addressParts.length > 0 ? addressParts.join(', ') : 'Adres niet beschikbaar';
            })(),
            phone: order.order.items[0]?.Product?.seller?.User?.phoneNumber || null,
            lat: order.order.items[0]?.Product?.seller?.User?.lat || null,
            lng: order.order.items[0]?.Product?.seller?.User?.lng || null
          }
        }
        };
        })
      );
      transformedRecentOrders = recentWithDistance;

      // Get available TEEN_DELIVERY orders (DeliveryOrders without deliveryProfileId)
      const availableDeliveryOrders = await prisma.deliveryOrder.findMany({
        where: {
          status: 'PENDING',
          deliveryProfileId: null // Only TEEN_DELIVERY orders
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
      const delivererLat = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.isOnline && deliveryProfile.currentLat && deliveryProfile.currentLng)
        ? deliveryProfile.currentLat
        : userLocation?.lat;
      const delivererLng = (deliveryProfile.gpsTrackingEnabled && deliveryProfile.isOnline && deliveryProfile.currentLng)
        ? deliveryProfile.currentLng
        : userLocation?.lng;

      const ordersWithDistance = await Promise.all(
        availableDeliveryOrders
          .filter((deliveryOrder) => {
            if (!deliveryProfile.isOnline || !userLocation?.lat || !userLocation?.lng || !deliveryOrder.order) return false;
            const product = deliveryOrder.order.items[0]?.Product;
            if (!product?.seller?.User?.lat || !product?.seller?.User?.lng || !deliveryOrder.order.User?.lat || !deliveryOrder.order.User?.lng) return false;
            const dSeller = calculateDistance(delivererLat!, delivererLng!, product.seller.User.lat, product.seller.User.lng);
            const dBuyer = calculateDistance(delivererLat!, delivererLng!, deliveryOrder.order.User.lat, deliveryOrder.order.User.lng);
            return dSeller <= deliveryProfile.maxDistance * 1.5 && dBuyer <= deliveryProfile.maxDistance * 1.5;
          })
          .slice(0, 20)
          .map(async (deliveryOrder) => {
            const product = deliveryOrder.order!.items[0]?.Product!;
            const sellerLat = product.seller.User.lat!;
            const sellerLng = product.seller.User.lng!;
            const buyerLat = deliveryOrder.order!.User!.lat!;
            const buyerLng = deliveryOrder.order!.User!.lng!;
            const origin = { lat: delivererLat!, lng: delivererLng! };

            const [routeToSeller, routeToBuyer] = await Promise.all([
              getRouteDistance(origin, { lat: sellerLat, lng: sellerLng }, 'driving'),
              getRouteDistance(origin, { lat: buyerLat, lng: buyerLng }, 'driving')
            ]);

            const distanceToSeller = 'distance' in routeToSeller ? routeToSeller.distance : calculateDistance(delivererLat!, delivererLng!, sellerLat, sellerLng);
            const distanceToBuyer = 'distance' in routeToBuyer ? routeToBuyer.distance : calculateDistance(delivererLat!, delivererLng!, buyerLat, buyerLng);
            const durationToSeller = 'duration' in routeToSeller ? routeToSeller.duration : Math.ceil((distanceToSeller / 50) * 60);
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

      const filteredAvailableOrders = ordersWithDistance.filter(
        (o) => o.distanceToSeller <= deliveryProfile.maxDistance && o.distanceToBuyer <= deliveryProfile.maxDistance
      );

      // Transform available orders for frontend (echte route-afstand en geschatte tijd)
      transformedAvailableOrders = filteredAvailableOrders.map(({ deliveryOrder, totalDistance, estimatedMinutes }) => {
        const product = deliveryOrder.order?.items[0]?.Product;
        return {
          id: deliveryOrder.id,
          orderId: deliveryOrder.orderId,
          status: 'PENDING' as const,
          deliveryFee: deliveryOrder.deliveryFee,
          estimatedTime: estimatedMinutes,
          distance: totalDistance,
          customerName: deliveryOrder.order?.User?.name || deliveryOrder.order?.User?.username || 'Klant',
          customerAddress: deliveryOrder.deliveryAddress || 'Bezorgadres',
          customerPhone: '06-12345678',
          notes: deliveryOrder.notes || '',
          createdAt: deliveryOrder.createdAt,
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
      });
    }

    const availableOrdersCount = transformedAvailableOrders.length;

    const stats = {
      todayEarnings: todayEarnings,
      weekEarnings: weekEarnings,
      totalDeliveries: deliveryProfile?.totalDeliveries || completedDeliveries,
      averageRating: deliveryProfile?.averageRating || 0,
      onlineTime: 480,
      completedDeliveries,
      pendingDeliveries,
      totalEarnings: totalEarnings,
      availableOrders: availableOrdersCount,
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

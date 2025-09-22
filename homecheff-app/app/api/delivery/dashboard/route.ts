import { NextRequest, NextResponse } from 'next/server';
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
    const transformedCurrentOrder = currentOrder ? {
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
      product: {
        title: currentOrder.order.items[0]?.Product?.title || 'Product',
        image: currentOrder.order.items[0]?.Product?.Image?.[0]?.fileUrl || '',
        seller: {
          name: currentOrder.order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
          address: 'Verkoper adres' // Mock address - would come from seller profile
        }
      }
    } : null;

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

    const stats = {
      todayEarnings,
      weekEarnings,
      totalDeliveries: deliveryProfile.totalDeliveries,
      averageRating: deliveryProfile.averageRating || 0,
      onlineTime: 480, // Mock online time in minutes - would be calculated from activity
      completedDeliveries,
      pendingDeliveries,
      totalEarnings
    };

    return NextResponse.json({
      stats,
      currentOrder: transformedCurrentOrder,
      recentOrders: transformedRecentOrders
    });

  } catch (error) {
    console.error('Delivery dashboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch delivery dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

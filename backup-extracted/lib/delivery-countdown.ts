/**
 * Delivery Countdown Service
 * 
 * Handles countdown timer for delivery orders (3 hours deadline)
 * Sends warnings at 30, 15, and 5 minutes remaining
 */

import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/notification-service';

export class DeliveryCountdownService {
  /**
   * Start countdown timer (3 hours from now)
   */
  static async startCountdown(deliveryOrderId: string): Promise<void> {
    const deliveryDeadline = new Date();
    deliveryDeadline.setHours(deliveryDeadline.getHours() + 3);

    await prisma.deliveryOrder.update({
      where: { id: deliveryOrderId },
      data: {
        deliveryDate: deliveryDeadline
      }
    });
  }

  /**
   * Check and send warnings for delivery orders
   * Should be called periodically (e.g., every minute via cron job)
   */
  static async checkAndSendWarnings(): Promise<void> {
    const now = new Date();
    
    // Get all active delivery orders with countdown
    const activeOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: {
          in: ['ACCEPTED', 'PICKED_UP']
        },
        deliveryDate: {
          not: null
        }
      },
      include: {
        order: {
          include: {
            User: {
              select: {
                id: true,
                name: true
              }
            },
            items: {
              include: {
                Product: {
                  include: {
                    seller: {
                      include: {
                        User: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        deliveryProfile: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    for (const order of activeOrders) {
      if (!order.deliveryDate) continue;

      const remainingMinutes = Math.floor((order.deliveryDate.getTime() - now.getTime()) / (1000 * 60));
      const warningsSent: number[] = [];

      // Check if we need to send warnings
      const warningTimes = [30, 15, 5];
      
      for (const warningTime of warningTimes) {
        if (remainingMinutes <= warningTime && remainingMinutes > warningTime - 1 && !warningsSent.includes(warningTime)) {
          // Send warning
          if (order.deliveryProfile?.user?.id) {
            try {
              await NotificationService.sendDeliveryCountdownWarning(
                order.deliveryProfile.user.id,
                order.id,
                order.orderId,
                (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(order.order.orderNumber, order.orderId),
                warningTime
              );

              // Warning sent (no field to track this in current schema)

              console.log(`✅ Countdown warning sent for order ${order.id}: ${warningTime} minutes remaining`);
            } catch (error) {
              console.error(`❌ Failed to send countdown warning for order ${order.id}:`, error);
            }
          }
        }
      }

      // Check if deadline has passed (send urgent notification)
      if (remainingMinutes < 0 && !warningsSent.includes(0)) {
        if (order.deliveryProfile?.user?.id) {
          try {
            await NotificationService.sendDeliveryCountdownWarning(
              order.deliveryProfile.user.id,
              order.id,
              order.orderId,
              order.order.orderNumber || `ORD-${order.orderId.slice(-6)}`,
              0 // 0 means overdue
            );

            // Overdue notification sent (no field to track this in current schema)

            console.log(`⚠️ Overdue notification sent for order ${order.id}`);
          } catch (error) {
            console.error(`❌ Failed to send overdue notification for order ${order.id}:`, error);
          }
        }
      }
    }
  }

  /**
   * Get remaining time for a delivery order
   */
  static async getRemainingTime(deliveryOrderId: string): Promise<{
    remainingMinutes: number;
    status: 'on_time' | 'warning' | 'urgent' | 'overdue';
    deadline: Date | null;
  }> {
    const order = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
      select: {
        deliveryDate: true,
        status: true
      }
    });

    if (!order || !order.deliveryDate) {
      return {
        remainingMinutes: 0,
        status: 'on_time',
        deadline: null
      };
    }

    const now = new Date();
    const remainingMinutes = Math.floor((order.deliveryDate.getTime() - now.getTime()) / (1000 * 60));

    let status: 'on_time' | 'warning' | 'urgent' | 'overdue' = 'on_time';
    if (remainingMinutes < 0) {
      status = 'overdue';
    } else if (remainingMinutes <= 5) {
      status = 'urgent';
    } else if (remainingMinutes <= 30) {
      status = 'warning';
    }

    return {
      remainingMinutes: Math.max(0, remainingMinutes),
      status,
      deadline: order.deliveryDate
    };
  }

  /**
   * Stop countdown (when delivery is completed)
   */
  static async stopCountdown(deliveryOrderId: string, actualDeliveryTime?: number): Promise<void> {
    const updateData: any = {
      deliveryDate: null
    };

    await prisma.deliveryOrder.update({
      where: { id: deliveryOrderId },
      data: updateData
    });
  }

  /**
   * Calculate actual delivery time in minutes
   */
  static async calculateActualDeliveryTime(deliveryOrderId: string): Promise<number | null> {
    const order = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
      select: {
        createdAt: true,
        deliveredAt: true
      }
    });

    if (!order || !order.createdAt || !order.deliveredAt) {
      return null;
    }

    const startTime = order.createdAt.getTime();
    const endTime = order.deliveredAt.getTime();
    const minutes = Math.floor((endTime - startTime) / (1000 * 60));

    return minutes;
  }
}



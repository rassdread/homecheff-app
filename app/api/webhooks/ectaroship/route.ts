import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/ectaroship';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * EctaroShip webhook handler
 * Receives tracking updates and triggers payouts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-ectaroship-signature') || 
                     req.headers.get('x-signature') || 
                     '';

    // Verify webhook signature (if configured)
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid && process.env.ECTAROSHIP_WEBHOOK_SECRET) {
      console.warn('⚠️ EctaroShip webhook signature verification failed');
      // Continue anyway if no secret is configured
    }

    const event = JSON.parse(body);

    console.log('📦 EctaroShip webhook received:', event.type || event.event);

    // Handle different event types
    switch (event.type || event.event) {
      case 'shipment.status_changed':
      case 'shipment.delivered':
      case 'shipment.shipped':
        await handleShipmentStatusUpdate(event);
        break;
      
      case 'label.created':
        await handleLabelCreated(event);
        break;
      
      default:
        console.log('Unhandled EctaroShip event:', event.type || event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('EctaroShip webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle shipment status updates (shipped, delivered, etc.)
 */
async function handleShipmentStatusUpdate(event: any) {
  const { shipment_id, label_id, order_id, status, tracking_number, delivered_at } = event;

  // Find order by EctaroShip label ID or order ID
  // Try multiple strategies to find the order
  let order: any = null;
  
  if (shipment_id || label_id) {
    // First try to find by shipping label
    const shippingLabel = await prisma.shippingLabel.findFirst({
      where: {
        ectaroShipLabelId: shipment_id || label_id,
      },
      select: { orderId: true }
    });
    
    if (shippingLabel) {
      order = await prisma.order.findUnique({
        where: { id: shippingLabel.orderId },
        include: {
          items: {
            include: {
              Product: {
                include: {
                  seller: {
                    include: {
                      User: true
                    }
                  }
                }
              }
            }
          },
          paymentEscrow: true,
        }
      });
    }
  }
  
  // If not found, try by order ID or shippingLabelId
  if (!order) {
    order = await prisma.order.findFirst({
      where: {
        OR: [
          { shippingLabelId: shipment_id || label_id },
          { id: order_id },
          { orderNumber: order_id },
        ]
      },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: true
                  }
                }
              }
            }
          }
        },
        paymentEscrow: true,
      }
    });
  }

  if (!order) {
    console.warn('Order not found for EctaroShip event:', shipment_id || label_id);
    return;
  }

    // Map EctaroShip status to our status
    const statusMap: Record<string, string> = {
      'created': 'label_created',
      'label_created': 'label_created',
      'shipped': 'shipped',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'failed': 'failed',
      'exception': 'failed',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || status || 'label_created';

    // Update order shipping status
    const updateData: any = {
      shippingStatus: mappedStatus,
    };

    if ((mappedStatus === 'shipped' || status?.toLowerCase() === 'shipped') && !order.shippedAt) {
      updateData.shippedAt = new Date();
      updateData.status = 'SHIPPED';
    }

    if ((mappedStatus === 'delivered' || status?.toLowerCase() === 'delivered') && !order.deliveredAt) {
      updateData.deliveredAt = delivered_at ? new Date(delivered_at) : new Date();
      updateData.status = 'DELIVERED';
      
      // Trigger payout if escrow exists and trigger is DELIVERED
      await triggerPayoutAfterDelivery(order);
    }

  if (tracking_number && !order.shippingTrackingNumber) {
    updateData.shippingTrackingNumber = tracking_number;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: updateData,
  });

  // Update shipping label status
  if (shipment_id || label_id) {
    const labelStatusMap: Record<string, string> = {
      'shipped': 'shipped',
      'in_transit': 'shipped',
      'out_for_delivery': 'shipped',
      'delivered': 'shipped',
      'failed': 'shipped', // Mark as shipped even if failed (for tracking)
    };
    
    await prisma.shippingLabel.updateMany({
      where: { ectaroShipLabelId: shipment_id || label_id },
      data: {
        status: labelStatusMap[status?.toLowerCase() || ''] || 'generated',
      }
    });
  }

  console.log(`✅ Order ${order.id} status updated to ${status}`);
}

/**
 * Handle label created event
 */
async function handleLabelCreated(event: any) {
  const { label_id, order_id, pdf_url, tracking_number, price } = event;

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { shippingLabelId: label_id },
        { id: order_id },
      ]
    },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                select: {
                  userId: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!order) {
    console.warn('Order not found for label created event:', label_id);
    return;
  }

  // Update order with label info
  await prisma.order.update({
    where: { id: order.id },
    data: {
      shippingStatus: 'label_created',
      shippingLabelCostCents: price ? Math.round(price * 100) : null,
    }
  });

  // Update or create shipping label
  const existingLabel = await prisma.shippingLabel.findFirst({
    where: { ectaroShipLabelId: label_id }
  });

  if (existingLabel) {
    await prisma.shippingLabel.update({
      where: { id: existingLabel.id },
      data: {
        pdfUrl: pdf_url,
        trackingNumber: tracking_number,
        status: 'generated',
      }
    });
  } else {
    await prisma.shippingLabel.create({
      data: {
        orderId: order.id,
        ectaroShipLabelId: label_id,
        pdfUrl: pdf_url,
        trackingNumber: tracking_number,
        carrier: 'PostNL', // Default, update if available in event
        status: 'generated',
        priceCents: price ? Math.round(price * 100) : 0,
      }
    });
  }

      console.log(`✅ Label created for order ${order.id}`);
      
      // Notify seller that shipping label is ready (if created via webhook)
      try {
        const { NotificationService } = await import('@/lib/notifications/notification-service');
        const sellerId = order.items[0]?.Product?.seller?.userId;
        if (sellerId) {
          await NotificationService.sendShippingLabelReadyNotification(
            sellerId,
            order.id,
            order.orderNumber || order.id,
            tracking_number || ''
          );
          console.log(`📧 Shipping label ready notification sent to seller ${sellerId}`);
        }
      } catch (notifError) {
        console.error(`❌ Error sending shipping label notification:`, notifError);
        // Don't fail the whole process if notification fails
      }
    }

/**
 * Trigger payout after delivery (if escrow exists and trigger is DELIVERED)
 */
async function triggerPayoutAfterDelivery(order: any) {
  // Find escrow for this order
  const escrow = order.paymentEscrow?.[0];
  
  if (!escrow || escrow.currentStatus !== 'held') {
    return; // No escrow or already processed
  }

  // Check if payout trigger is DELIVERED
  if (escrow.payoutTrigger !== 'DELIVERED') {
    return; // Payout trigger is SHIPPED, not DELIVERED
  }

  // Get seller
  const seller = order.items[0]?.Product?.seller?.User;
  if (!seller || !seller.stripeConnectAccountId) {
    console.warn('Seller not found or no Stripe Connect account for order:', order.id);
    return;
  }

  // Use escrow amount (already calculated correctly with platform fee and SMS costs deducted)
  // The escrow was created in stripe webhook with the correct sellerPayoutCents
  const sellerPayoutCents = escrow.amountCents;

  // Create Stripe transfer
  try {
    if (stripe && sellerPayoutCents > 0) {
      const transfer = await stripe.transfers.create({
        amount: sellerPayoutCents,
        currency: 'eur',
        destination: seller.stripeConnectAccountId,
        transfer_group: `order_${order.id}`,
        metadata: {
          orderId: order.id,
          type: 'product_sale',
          escrowId: escrow.id,
        }
      });

      // Update escrow status
      await prisma.paymentEscrow.update({
        where: { id: escrow.id },
        data: {
          currentStatus: 'paid_out',
          paidOutAt: new Date(),
        }
      });

      // Create payout record
      await prisma.payout.create({
        data: {
          id: `payout_${Date.now()}`,
          transactionId: order.id,
          amountCents: sellerPayoutCents,
          toUserId: seller.id,
          providerRef: transfer.id,
        }
      });

      console.log(`✅ Payout triggered for order ${order.id}: €${(sellerPayoutCents / 100).toFixed(2)}`);
    }
  } catch (error: any) {
    console.error('Failed to trigger payout:', error);
    // Update escrow as failed but keep it for manual processing
    await prisma.paymentEscrow.update({
      where: { id: escrow.id },
      data: {
        currentStatus: 'payout_scheduled', // Will be retried
      }
    });
  }
}


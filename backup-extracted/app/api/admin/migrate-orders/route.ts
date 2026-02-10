import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Migration endpoint to create transactions and payouts for existing orders
 * This ensures all historical orders have proper financial tracking
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'SuperAdmin access required' }, { status: 403 });
    }

    const { dryRun = false, limit = 100 } = await req.json().catch(() => ({ dryRun: false, limit: 100 }));

    // Get orders without transactions
    const ordersWithoutTransactions = await prisma.order.findMany({
      where: {
        stripeSessionId: { not: null },
        NOT: {
          orderNumber: {
            startsWith: 'SUB-'
          }
        }
      },
      include: {
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
        },
        User: {
          select: {
            id: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[],
      skipped: 0
    };

    for (const order of ordersWithoutTransactions) {
      try {
        // Check if transaction already exists
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            providerRef: order.stripeSessionId || undefined
          }
        });

        if (existingTransaction) {
          results.skipped++;
          continue;
        }

        // Group items by seller
        const itemsBySeller = new Map<string, typeof order.items>();
        for (const item of order.items) {
          const sellerId = item.Product.seller?.User?.id;
          if (!sellerId) continue;

          if (!itemsBySeller.has(sellerId)) {
            itemsBySeller.set(sellerId, []);
          }
          itemsBySeller.get(sellerId)!.push(item);
        }

        if (dryRun) {
          results.processed++;
          continue;
        }

        // Create transactions for each seller
        for (const [sellerId, items] of itemsBySeller.entries()) {
          const sellerAmount = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
          const platformFeeBps = 1200; // 12%
          const platformFee = Math.round((sellerAmount * platformFeeBps) / 10000);
          const netAmount = sellerAmount - platformFee;

          // Create a reservation ID for this transaction (using order ID + seller ID)
          const reservationId = `order_${order.id}_seller_${sellerId}`;

          // Check if reservation exists, if not create one
          let reservation = await prisma.reservation.findUnique({
            where: { id: reservationId }
          });

          if (!reservation) {
            // Get the listing for the first product to get sellerId
            const firstProduct = await prisma.product.findUnique({
              where: { id: items[0].productId },
              include: {
                seller: {
                  include: {
                    User: {
                      select: { id: true }
                    }
                  }
                }
              }
            });

            if (!firstProduct?.seller?.User?.id) {
              results.errors.push(`Order ${order.id}: Could not find seller for product ${items[0].productId}`);
              continue;
            }

            // Create a minimal reservation for the transaction
            reservation = await prisma.reservation.create({
              data: {
                id: reservationId,
                buyerId: order.userId,
                sellerId: firstProduct.seller.User.id,
                listingId: items[0].productId, // Use first product's listing
                quantity: items.reduce((sum, item) => sum + item.quantity, 0),
                status: 'COMPLETED',
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
              }
            });
          }

          // Create transaction
          const transaction = await prisma.transaction.create({
            data: {
              id: `tx_${order.id}_${sellerId}_${Date.now()}`,
              reservationId: reservation.id,
              buyerId: order.userId,
              sellerId: sellerId,
              amountCents: sellerAmount,
              platformFeeBps: platformFeeBps,
              status: order.status === 'DELIVERED' || order.status === 'CONFIRMED' ? 'CAPTURED' : 'CREATED',
              provider: 'stripe',
              providerRef: order.stripeSessionId || undefined,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            }
          });

          // Create payout if order is completed
          if (order.status === 'DELIVERED' || order.status === 'CONFIRMED') {
            await prisma.payout.create({
              data: {
                id: `payout_${order.id}_${sellerId}_${Date.now()}`,
                toUserId: sellerId,
                transactionId: transaction.id,
                amountCents: netAmount,
                providerRef: null, // Will be set when actual Stripe transfer happens
                createdAt: order.updatedAt || order.createdAt
              }
            });
          }

          results.created++;
        }

        results.processed++;
      } catch (error: any) {
        results.errors.push(`Order ${order.id}: ${error.message}`);
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      results,
      message: dryRun 
        ? `Would process ${results.processed} orders and create ${results.created} transactions`
        : `Processed ${results.processed} orders and created ${results.created} transactions`
    });
  } catch (error) {
    console.error('Error migrating orders:', error);
    return NextResponse.json(
      { error: 'Failed to migrate orders', details: (error as Error).message },
      { status: 500 }
    );
  }
}


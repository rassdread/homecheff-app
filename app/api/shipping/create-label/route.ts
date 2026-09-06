import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ensurePaidOrderShipment } from '@/lib/shipping/ensure-order-shipment';

export const dynamic = 'force-dynamic';

/**
 * Seller/admin recovery: create label only via post-payment idempotent path.
 * Uses checkout address/quote snapshots — never live profile or hardcoded dims.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSeller = order.items.some(
      (item) => item.Product?.seller?.User?.id === user.id,
    );
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - only seller or admin can create labels' },
        { status: 403 },
      );
    }

    if (String(order.deliveryMode) !== 'SHIPPING') {
      return NextResponse.json(
        { error: 'Order is not a shipping order', code: 'NOT_SHIPPING' },
        { status: 422 },
      );
    }

    if (!(order.shippingCostCents && order.shippingCostCents > 0)) {
      return NextResponse.json(
        {
          error: 'Cannot create label: shipping was not collected on this order',
          code: 'SHIPMENT_BLOCKED_NO_CHARGE',
        },
        { status: 422 },
      );
    }

    const result = await ensurePaidOrderShipment(orderId);

    if (result.status === 'created' || result.status === 'already_created') {
      const label = await prisma.shippingLabel.findFirst({
        where: { orderId },
      });
      return NextResponse.json({
        status: result.status,
        labelId: label?.id,
        ectaroShipLabelId: result.labelId,
        pdfUrl: label?.pdfUrl,
        trackingNumber: label?.trackingNumber,
        carrier: label?.carrier,
        priceCents: label?.priceCents,
      });
    }

    const status =
      result.status === 'pending_provider_config'
        ? 503
        : result.status === 'failed_retryable' || result.status === 'address_incomplete'
          ? 502
          : 422;

    return NextResponse.json({ result }, { status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('Error creating shipping label:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping label', details: message },
      { status: 500 },
    );
  }
}

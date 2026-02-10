import { NextRequest, NextResponse } from 'next/server';
import { createShippingLabel, EctaroShipLabelRequest } from '@/lib/ectaroship';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Create shipping label using EctaroShip API
 * Called after order is confirmed
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      orderId,
      recipient,      // Optional - will get from order if not provided
      sender,         // Optional - will get from seller if not provided
      weight,         // Optional - will use default if not provided
      dimensions,     // Optional - will use default if not provided
      carrier,
      description
    } = await req.json();

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Get order to verify ownership and get seller/buyer addresses
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        address: true,
                        postalCode: true,
                        city: true,
                        country: true,
                        phoneNumber: true
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
            email: true,
            address: true,
            postalCode: true,
            city: true,
            country: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user is seller or admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSeller = order.items.some(item => 
      item.Product.seller.User.id === user.id
    );
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - only seller or admin can create labels' },
        { status: 403 }
      );
    }

    // Get seller info from first product (if sender not provided)
    const firstProduct = order.items[0]?.Product;
    const sellerUser = firstProduct?.seller?.User;
    
    // Use provided sender or get from seller
    const senderInfo = sender || (sellerUser ? {
      name: sellerUser.name || 'Seller',
      address: sellerUser.address || '',
      postalCode: sellerUser.postalCode || '1012AB',
      city: sellerUser.city || '',
      country: sellerUser.country || 'NL',
      email: sellerUser.email || '',
      phone: sellerUser.phoneNumber || undefined,
    } : null);

    if (!senderInfo || !senderInfo.postalCode || !senderInfo.country) {
      return NextResponse.json(
        { error: 'Sender information incomplete. Please provide sender address or ensure seller has complete address in profile.' },
        { status: 400 }
      );
    }

    // Get recipient from order if not provided
    const buyerUser = order.User;
    const recipientInfo = recipient || (buyerUser ? {
      name: buyerUser.name || 'Buyer',
      address: buyerUser.address || order.deliveryAddress || '',
      postalCode: buyerUser.postalCode || '',
      city: buyerUser.city || '',
      country: buyerUser.country || 'NL',
      email: buyerUser.email || '',
      phone: buyerUser.phoneNumber || undefined,
    } : null);

    if (!recipientInfo || !recipientInfo.postalCode || !recipientInfo.country) {
      return NextResponse.json(
        { error: 'Recipient information incomplete. Please provide recipient address or ensure buyer has complete address in profile.' },
        { status: 400 }
      );
    }

    // Calculate weight and dimensions from products if not provided
    let calculatedWeight = weight;
    let calculatedDimensions = dimensions;

    if (!calculatedWeight || !calculatedDimensions) {
      // Default: 1kg per product, 30x20x10cm per product
      // TODO: Add weight/dimensions to Product model
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      calculatedWeight = totalItems * 1.0; // 1kg per item
      calculatedDimensions = {
        length: Math.max(30, Math.ceil(Math.sqrt(totalItems)) * 10), // Scale up for multiple items
        width: 20,
        height: Math.max(10, totalItems * 5), // Stack items
      };
    }

    // Create label request
    const labelRequest: EctaroShipLabelRequest = {
      orderId,
      recipient: {
        name: recipientInfo.name,
        address: recipientInfo.address,
        postalCode: recipientInfo.postalCode,
        city: recipientInfo.city,
        country: recipientInfo.country,
        email: recipientInfo.email,
        phone: recipientInfo.phone,
      },
      sender: {
        name: senderInfo.name,
        address: senderInfo.address,
        postalCode: senderInfo.postalCode,
        city: senderInfo.city,
        country: senderInfo.country,
        email: senderInfo.email,
        phone: senderInfo.phone,
      },
      weight: calculatedWeight,
      dimensions: {
        length: calculatedDimensions.length,
        width: calculatedDimensions.width,
        height: calculatedDimensions.height,
      },
      carrier: carrier || undefined,
      description: description || `Order ${order.orderNumber || orderId}`,
    };

    // Create label via EctaroShip
    const result = await createShippingLabel(labelRequest);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Save label to database
    const shippingLabel = await prisma.shippingLabel.create({
      data: {
        orderId: order.id,
        ectaroShipLabelId: result.labelId,
        pdfUrl: result.pdfUrl,
        trackingNumber: result.trackingNumber,
        carrier: result.carrier,
        status: 'generated',
        priceCents: Math.round(result.price * 100),
      }
    });

    // Update order with shipping info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingLabelId: result.labelId, // EctaroShip label ID (stored in Order.shippingLabelId)
        shippingTrackingNumber: result.trackingNumber,
        shippingCarrier: result.carrier,
        shippingStatus: 'label_created',
        shippingLabelCostCents: Math.round(result.price * 100),
      }
    });

    return NextResponse.json({
      labelId: shippingLabel.id,
      ectaroShipLabelId: result.labelId,
      pdfUrl: result.pdfUrl,
      trackingNumber: result.trackingNumber,
      carrier: result.carrier,
      price: result.price,
      priceCents: Math.round(result.price * 100),
    });

  } catch (error: any) {
    console.error('Error creating shipping label:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping label', details: error.message },
      { status: 500 }
    );
  }
}

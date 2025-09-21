import { NextRequest, NextResponse } from 'next/server';
import { stripe, createConnectPaymentIntent, calculatePayout } from '@/lib/stripe';
import { formatAmountForStripe } from '@/lib/stripe';
// Removed pricing import - fees are now calculated differently
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { findDeliveryProfilesInRadius, isProfileAvailable } from '@/lib/geolocation';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { 
      items,
      deliveryMode, 
      address, 
      notes,
      pickupDate,
      deliveryDate,
      deliveryTime,
      coordinates // { lat, lng } for delivery location
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Get session for buyer info
    const session = await auth();
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = (session.user as any).id;

    // Get all products from cart
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { 
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                stripeConnectAccountId: true,
                stripeConnectOnboardingCompleted: true
              }
            }
          }
        }
      }
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'Some products not found' },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.priceCents * item.quantity);
    }, 0);

    // Calculate fees - buyers only pay Stripe fee, sellers pay platform fee at payout
    const stripeFeeCents = Math.round((totalAmount * 0.014) + 25); // 1.4% + €0.25
    const totalWithStripeFee = totalAmount + stripeFeeCents;

    // Check if all sellers have Stripe Connect accounts
    const sellersWithoutConnect = products.filter(product => 
      !product.seller.User.stripeConnectAccountId
    );

    if (sellersWithoutConnect.length > 0) {
      return NextResponse.json(
        { error: 'Some sellers need to set up Stripe Connect first' },
        { status: 400 }
      );
    }

    const formattedAmount = formatAmountForStripe(totalWithStripeFee / 100); // Convert to euros first

    // Create Stripe checkout session
    if (!stripe) {
      // Return mock session for development
      return NextResponse.json({
        sessionId: `cs_test_${Date.now()}`,
        url: `/payment/success?session_id=cs_test_${Date.now()}`
      });
    }
    
    // Create line items for each product
    const lineItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            description: `Quantity: ${item.quantity}${deliveryMode === 'PICKUP' ? ' (Pickup)' : ' (Delivery)'} - Sold by ${item.sellerName}`,
          },
          unit_amount: Math.round(item.priceCents / item.quantity), // Price per unit
        },
        quantity: item.quantity,
      };
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/checkout`,
      metadata: {
        buyerId,
        items: JSON.stringify(items),
        deliveryMode,
        address: address || '',
        notes: notes || '',
        pickupDate: pickupDate || '',
        deliveryDate: deliveryDate || '',
        deliveryTime: deliveryTime || '',
        totalAmount: totalAmount.toString(),
        stripeFeeCents: stripeFeeCents.toString(),
        totalWithStripeFee: totalWithStripeFee.toString(),
      },
    });

    // If teen delivery is selected, create delivery order after payment
    if (deliveryMode === 'TEEN_DELIVERY') {
      try {
        // Create order first to get orderId
        const order = await prisma.order.create({
          data: {
            userId: buyerId,
            totalAmount: totalWithStripeFee,
            deliveryAddress: address,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            deliveryMode: 'DELIVERY',
            notes: notes,
            status: 'PENDING'
          }
        });

        // Create order items
        await Promise.all(items.map((item: any) => 
          prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents
            }
          })
        ));

        // Create delivery order with geolocation
        if (deliveryMode === 'DELIVERY' && coordinates) {
          try {
            // Find available delivery profiles within radius
            const deliveryProfiles = await prisma.deliveryProfile.findMany({
              where: { isActive: true },
              select: {
                id: true,
                homeLat: true,
                homeLng: true,
                currentLat: true,
                currentLng: true,
                maxDistance: true,
                deliveryMode: true,
                deliveryRegions: true,
                availableDays: true,
                availableTimeSlots: true
              }
            });

            const availableProfiles = findDeliveryProfilesInRadius(
              { lat: coordinates.lat, lng: coordinates.lng, address },
              deliveryProfiles
            );

            if (availableProfiles.length > 0) {
              // Assign to closest available profile
              const assignedProfile = availableProfiles[0];
              
              await prisma.deliveryOrder.create({
                data: {
                  orderId: order.id,
                  deliveryProfileId: assignedProfile.id,
                  deliveryFee: 200, // €2.00 in cents
                  status: 'PENDING',
                  notes: notes || null
                }
              });
            }
          } catch (error) {
            console.error('Error creating delivery order:', error);
            // Continue with checkout even if delivery order creation fails
          }
        }
      } catch (error) {
        console.error('Error creating delivery order:', error);
        // Continue with checkout even if delivery order creation fails
      }
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
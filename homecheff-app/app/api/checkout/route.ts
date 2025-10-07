import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { stripe, createConnectPaymentIntent, calculatePayout } from '@/lib/stripe';
import { formatAmountForStripe } from '@/lib/stripe';
// Removed pricing import - fees are now calculated differently
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
// import { findDeliveryProfilesInRadius, isProfileAvailable } from '@/lib/geolocation';

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
      coordinates, // { lat, lng } for delivery location
      selectedDeliverers // { productId: deliverer } mapping
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

    // Calculate delivery fee if delivery is selected
    let deliveryFeeCents = 0;
    let deliveryFeeBreakdown: any = null;
    
    if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') {
      deliveryFeeCents = 200; // €2.00 base delivery fee
      
      // Calculate distance-based fee (mock for now)
      if (coordinates) {
        // In real app, calculate actual distance
        const distance = 5; // Mock distance in km
        if (distance > 3) {
          deliveryFeeCents += Math.round((distance - 3) * 50); // €0.50 per km after 3km
        }
      }
      
      deliveryFeeBreakdown = {
        baseFee: 200,
        distanceFee: deliveryFeeCents - 200,
        totalDeliveryFee: deliveryFeeCents,
        deliveryPersonCut: Math.round(deliveryFeeCents * 0.88), // 88% to delivery person
        homecheffCut: Math.round(deliveryFeeCents * 0.12) // 12% to HomeCheff (same as platform fee)
      };
    }

    const subtotal = totalAmount + deliveryFeeCents;

    // Calculate fees - buyers pay Stripe fee + HomeCheff platform fee (12%)
    const platformFeeCents = Math.round(totalAmount * 0.12); // 12% platform fee on product sales
    const finalTotal = subtotal + platformFeeCents; // Add platform fee to subtotal
    const stripeFeeCents = Math.round((finalTotal * 0.014) + 25); // 1.4% + €0.25 Stripe fee on final total
    const totalWithStripeFee = finalTotal + stripeFeeCents;

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
            description: `Quantity: ${item.quantity} - Sold by ${item.sellerName}`,
          },
          unit_amount: Math.round(item.priceCents / item.quantity), // Price per unit
        },
        quantity: item.quantity,
      };
    });

    // Add platform fee as separate line item
    if (platformFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'HomeCheff Platform Fee',
            description: 'Platform service fee (12%)',
          },
          unit_amount: platformFeeCents,
        },
        quantity: 1,
      });
    }

    // Add delivery fee as separate line item
    if (deliveryFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Bezorgkosten',
            description: `Bezorging naar ${address || 'jouw adres'}${deliveryFeeBreakdown ? ` (Basis: €${(deliveryFeeBreakdown.baseFee/100).toFixed(2)}, Afstand: €${(deliveryFeeBreakdown.distanceFee/100).toFixed(2)})` : ''}`,
          },
          unit_amount: deliveryFeeCents,
        },
        quantity: 1,
      });
    }

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
        platformFeeCents: platformFeeCents.toString(),
        deliveryFeeCents: deliveryFeeCents.toString(),
        deliveryFeeBreakdown: deliveryFeeBreakdown ? JSON.stringify(deliveryFeeBreakdown) : '',
        subtotal: subtotal.toString(),
        finalTotal: finalTotal.toString(),
        stripeFeeCents: stripeFeeCents.toString(),
        totalWithStripeFee: totalWithStripeFee.toString(),
      },
    });

    // Check delivery availability if delivery is requested
    if (deliveryMode === 'DELIVERY' && coordinates) {
      try {
        // Check if delivery is available in the area
        const availabilityResponse = await fetch(`${req.nextUrl.origin}/api/delivery/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            deliveryDate,
            deliveryTime,
            maxRadius: 10
          })
        });

        const availabilityData = await availabilityResponse.json();
        
        if (!availabilityData.isAvailable) {
          return NextResponse.json({
            error: 'Bezorging is momenteel niet beschikbaar in jouw regio. Probeer het later opnieuw of kies voor afhalen.',
            deliveryUnavailable: true
          }, { status: 400 });
        }

        // Store availability info in metadata for later use       
        if (checkoutSession.metadata) {
          checkoutSession.metadata.deliveryAvailable = 'true';       
          checkoutSession.metadata.availableDeliverers = availabilityData.availableCount?.toString() || '0';                                            
          checkoutSession.metadata.estimatedDeliveryTime = availabilityData.estimatedDeliveryTime?.toString() || '';
        }

      } catch (error) {
        console.error('Delivery availability check failed:', error);
        // Continue with checkout but mark delivery as potentially unavailable
        if (checkoutSession.metadata) {
          checkoutSession.metadata.deliveryCheckFailed = 'true';
        }
      }
    }

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

        // Create delivery orders for each product with selected deliverers
        if (deliveryMode === 'TEEN_DELIVERY' && selectedDeliverers && Object.keys(selectedDeliverers).length > 0) {
          try {
            // Create delivery orders for each product with selected deliverer
            for (const [productId, deliverer] of Object.entries(selectedDeliverers)) {
              if (deliverer && typeof deliverer === 'object' && 'id' in deliverer) {
                const delivererData = deliverer as any;
                await prisma.deliveryOrder.create({
                  data: {
                    orderId: order.id,
                    deliveryProfileId: delivererData.id,
                    productId: productId, // Link to specific product
                    deliveryFee: Math.round(delivererData.totalDeliveryDistance * 50), // €0.50 per km
                    status: 'PENDING',
                    notes: notes || null,
                    deliveryAddress: address,
                    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                    deliveryTime: deliveryTime || null
                  }
                });
                
                console.log(`Created delivery order for product ${productId} with deliverer ${delivererData.name}`);
              }
            }
          } catch (error) {
            console.error('Error creating delivery orders:', error);
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
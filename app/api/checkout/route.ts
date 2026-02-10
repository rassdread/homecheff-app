import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { stripe } from '@/lib/stripe';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { calculateDeliveryFee, calculateLongDistanceDeliveryFee } from '@/lib/deliveryPricing';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { calculateDistance } from '@/lib/geocoding';

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
      country, // Buyer's country code
      enableSmsNotification // SMS notification option for sellers
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Get session for buyer info
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to ensure we have the correct ID
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const buyerId = buyer.id;

    // Get all products from cart with ATOMIC stock check to prevent race conditions
    const productIds = items.map((item: any) => item.productId);
    
    // Use transaction to atomically check stock for all products
    const stockCheckResult = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
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
                  stripeConnectOnboardingCompleted: true,
                  lat: true,
                  lng: true,
                  place: true,
                  country: true,
                  postalCode: true,
                  address: true,
                  city: true
                }
              }
            }
          }
        }
      });

      if (products.length !== items.length) {
        return { error: 'Some products not found', products: null };
      }

      // Validate delivery mode compatibility with products
      if (deliveryMode) {
        const deliveryModeUpper = deliveryMode.toUpperCase();
        const isPickup = deliveryModeUpper === 'PICKUP';
        const isDelivery = deliveryModeUpper === 'DELIVERY' || deliveryModeUpper === 'LOCAL_DELIVERY' || deliveryModeUpper === 'TEEN_DELIVERY';
        const isShipping = deliveryModeUpper === 'SHIPPING';
        
        // Check if all products support the selected delivery mode
        const incompatibleProducts: string[] = [];
        for (const product of products) {
          const productDelivery = product.delivery;
          if (isPickup && productDelivery !== 'PICKUP' && productDelivery !== 'BOTH') {
            incompatibleProducts.push(product.title);
          } else if (isDelivery && productDelivery !== 'DELIVERY' && productDelivery !== 'BOTH') {
            incompatibleProducts.push(product.title);
          } else if (isShipping) {
            // TypeScript workaround: check if productDelivery is not SHIPPING or BOTH
            if (productDelivery !== 'BOTH' && productDelivery !== ('SHIPPING' as typeof productDelivery)) {
              incompatibleProducts.push(product.title);
            }
          }
        }
        
        if (incompatibleProducts.length > 0) {
          return { 
            error: `De geselecteerde bezorgoptie is niet beschikbaar voor: ${incompatibleProducts.join(', ')}`, 
            products: null 
          };
        }
      }

      // Check stock atomically for all items
      const insufficientStock: Array<{
        productId: string;
        requested: number;
        available: number;
        title: string;
      }> = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          insufficientStock.push({
            productId: item.productId,
            requested: item.quantity,
            available: 0,
            title: 'Onbekend product'
          });
          continue;
        }

        // Get current stock (atomically locked in transaction)
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, maxStock: true, title: true }
        });

        if (!currentProduct) {
          insufficientStock.push({
            productId: item.productId,
            requested: item.quantity,
            available: 0,
            title: product.title
          });
          continue;
        }

        // Get reserved quantity (pending reservations that haven't expired)
        const reservedQuantity = await tx.stockReservation.aggregate({
          where: {
            productId: item.productId,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          },
          _sum: { quantity: true }
        });

        const reservedQty = reservedQuantity._sum.quantity || 0;

        const availableStock =
          typeof currentProduct.stock === 'number'
            ? currentProduct.stock
            : typeof currentProduct.maxStock === 'number'
              ? currentProduct.maxStock
              : null;

        if (availableStock !== null) {
          // Available stock = total stock - reserved stock
          const actuallyAvailable = availableStock - reservedQty;
          const isOutOfStock = actuallyAvailable <= 0;
          const exceedsAvailable = item.quantity > actuallyAvailable;
          if (isOutOfStock || exceedsAvailable) {
            insufficientStock.push({
              productId: item.productId,
              requested: item.quantity,
              available: Math.max(0, actuallyAvailable),
              title: currentProduct.title,
            });
          }
        }
      }

      return { error: null, products, insufficientStock };
    });

    if (stockCheckResult.error) {
      return NextResponse.json(
        { error: stockCheckResult.error },
        { status: 404 }
      );
    }

    if (stockCheckResult.insufficientStock && stockCheckResult.insufficientStock.length > 0) {
      return NextResponse.json({
        error: 'Onvoldoende voorraad om deze bestelling te plaatsen.',
        insufficientStock: stockCheckResult.insufficientStock,
      }, { status: 409 });
    }

    const products = stockCheckResult.products!;
    
    // If delivery mode is TEEN_DELIVERY or DELIVERY, validate coordinates
    if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') {
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        return NextResponse.json(
          { error: 'Bezorgadres coördinaten zijn vereist voor bezorging' },
          { status: 400 }
        );
      }
    }

    // Calculate product subtotal
    const productsTotalCents = items.reduce((sum: number, item: any) => {
      return sum + (item.priceCents * item.quantity);
    }, 0);

    // Calculate delivery fee if delivery is selected
    let deliveryFeeCents = 0;
    let deliveryFeeBreakdown: any = null;
    
    if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY' || deliveryMode === 'LOCAL_DELIVERY') {
      if (coordinates) {
        // Get buyer country from request (default to NL if not provided)
        const buyerCountryCode = country || 'NL';
        
        // Calculate actual distance from seller to buyer using Google Maps
        let totalDistance = 0;
        let isInternationalDelivery = false;
        let sellerCountry = 'NL';
        
        // For each product, calculate route distance from seller to buyer using Google Maps
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          if (product?.seller?.User?.lat && product?.seller?.User?.lng) {
            // Get seller's country from already loaded User data
            sellerCountry = product.seller.User.country || 'NL';
            
            // Check if this is international delivery (different countries)
            if (sellerCountry !== buyerCountryCode) {
              isInternationalDelivery = true;
            }
            
            // Use Google Maps Distance Matrix for accurate route distance (works internationally)
            // This calculates the actual driving distance, even across borders
            const routeResult = await getRouteDistance(
              { lat: product.seller.User.lat, lng: product.seller.User.lng },
              { lat: coordinates.lat, lng: coordinates.lng },
              'driving'
            );
            
            // Check if result is error or success
            if ('distance' in routeResult) {
              totalDistance = Math.max(totalDistance, routeResult.distance);
            } else {
              // Fallback: if Google Maps fails, use Haversine (already in getRouteDistance fallback)
              console.warn('Route distance calculation failed, using fallback');
            }
          }
        }
        
        // Round to 1 decimal
        totalDistance = Math.round(totalDistance * 10) / 10;
        
        // Determine delivery type based on mode
        const deliveryType = deliveryMode === 'LOCAL_DELIVERY' ? 'SELLER_DELIVERY' : 'PLATFORM_DELIVERERS';
        
        // Calculate fee using pricing module
        // For international deliveries, always use long distance pricing (more expensive)
        let pricing;
        if (isInternationalDelivery || totalDistance > 30) {
          // Use long distance pricing for international deliveries or distances over 30km
          pricing = calculateLongDistanceDeliveryFee(totalDistance);
          if (isInternationalDelivery) {
            // Add international surcharge for cross-country deliveries
            const internationalSurcharge = 500; // €5.00 surcharge for international delivery
            pricing.totalDeliveryFee += internationalSurcharge;
            pricing.distanceFee += internationalSurcharge;
            pricing.delivererCut = Math.round(pricing.totalDeliveryFee * 0.88);
            pricing.platformCut = Math.round(pricing.totalDeliveryFee * 0.12);
          }
        } else {
          pricing = calculateDeliveryFee(totalDistance, deliveryType);
        }
        
        deliveryFeeCents = pricing.totalDeliveryFee;
        deliveryFeeBreakdown = {
          baseFee: pricing.baseFee,
          distanceFee: pricing.distanceFee,
          totalDeliveryFee: pricing.totalDeliveryFee,
          deliveryPersonCut: pricing.delivererCut,
          homecheffCut: pricing.platformCut,
          distance: totalDistance,
          isInternational: isInternationalDelivery,
          sellerCountry: sellerCountry,
          buyerCountry: buyerCountryCode,
          breakdown: pricing.breakdown
        };
      } else {
        // Fallback if no coordinates
        deliveryFeeCents = 250; // €2.50 default
        deliveryFeeBreakdown = {
          baseFee: 250,
          distanceFee: 0,
          totalDeliveryFee: 250,
          deliveryPersonCut: Math.round(250 * 0.88),
          homecheffCut: Math.round(250 * 0.12),
          isInternational: false
        };
      }
    }

    // Calculate SMS notification cost
    const smsCostPerSellerCents = 6;
    const uniqueSellerIds = new Set(items.map((item: any) => item.sellerId).filter(Boolean));
    const smsNotificationCostCents = enableSmsNotification ? smsCostPerSellerCents * uniqueSellerIds.size : 0;
    
    const subtotalCents = productsTotalCents + deliveryFeeCents + smsNotificationCostCents;
    const { buyerTotalCents, stripeFeeCents } = calculateStripeFeeForBuyer(subtotalCents);

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
          unit_amount: item.priceCents,
        },
        quantity: item.quantity,
      };
    });

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

    // Add SMS notification cost if enabled
    if (smsNotificationCostCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'SMS Notificatie voor verkopers',
            description: `SMS notificatie voor ${uniqueSellerIds.size} verkoper${uniqueSellerIds.size > 1 ? 's' : ''} bij nieuwe bestelling`,
          },
          unit_amount: smsNotificationCostCents,
        },
        quantity: 1,
      });
    }

    if (stripeFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Transactiekosten (Stripe)',
            description: 'Kosten voor betaalprovider Stripe',
          },
          unit_amount: stripeFeeCents,
        },
        quantity: 1,
      });
    }

    // Check if all sellers have Stripe Connect accounts (only sellers need this, not buyers)
    // A buyer can be anyone (no Stripe Connect required)
    // Only the sellers need Stripe Connect to receive payouts
    const sellersWithoutConnect = products.filter(product => {
      // Only check if seller has a seller profile (they're actually selling)
      const hasSellerProfile = product.seller && product.seller.User;
      if (!hasSellerProfile) return false;
      
      // Check if seller has Stripe Connect (required for receiving payouts)
      return !product.seller?.User?.stripeConnectAccountId || 
             !product.seller?.User?.stripeConnectOnboardingCompleted;
    });

    if (sellersWithoutConnect.length > 0) {
      const sellerNames = sellersWithoutConnect.map(p => p.seller?.User?.name || 'Onbekend').join(', ');
      return NextResponse.json({
        error: `De volgende verkopers hebben nog geen betalingsgegevens ingesteld: ${sellerNames}. Zij moeten eerst hun betalingsgegevens configureren via hun profiel voordat je kunt kopen.`,
        sellersNeedConnect: true,
        sellers: sellersWithoutConnect.map(p => ({
          id: p.seller?.User?.id,
          name: p.seller?.User?.name,
          email: p.seller?.User?.email
        }))
      }, { status: 400 });
    }

    // For now, use regular checkout (not Connect) since we handle payouts in webhook
    // Note: Connect checkout with application_fee is handled via webhook for better control
    const compactItemStrings = items.map((item: any) => {
      const sellerId = item.sellerId || '';
      return `${item.productId}|${item.quantity}|${item.priceCents}|${sellerId}`;
    });

    const metadataItemChunks: Record<string, string> = {};
    if (compactItemStrings.length > 0) {
      let chunk = '';
      let chunkIndex = 1;

      const flushChunk = () => {
        if (chunk) {
          metadataItemChunks[`items_compact_${chunkIndex}`] = chunk;
          chunk = '';
          chunkIndex += 1;
        }
      };

      compactItemStrings.forEach((encoded) => {
        const candidate = chunk ? `${chunk};${encoded}` : encoded;
        if (candidate.length > 450) {
          flushChunk();
          chunk = encoded;
        } else {
          chunk = candidate;
        }
      });
      flushChunk();
    }

    const metadataBase: Record<string, string> = {
      buyerId,
      deliveryMode,
      address: address || '',
      notes: notes || '',
      pickupDate: pickupDate || '',
      deliveryDate: deliveryDate || '',
      deliveryTime: deliveryTime || '',
      productsTotalCents: productsTotalCents.toString(),
      deliveryFeeCents: deliveryFeeCents.toString(),
      stripeFeeCents: stripeFeeCents.toString(),
      amountPaidCents: buyerTotalCents.toString(),
      subtotalCents: subtotalCents.toString(),
      enableSmsNotification: enableSmsNotification ? 'true' : 'false',
      smsNotificationCostCents: smsNotificationCostCents.toString(),
    };

    if (deliveryFeeBreakdown) {
      metadataBase.deliveryFeeBreakdown = JSON.stringify(deliveryFeeBreakdown);
    }
    if (coordinates) {
      metadataBase.coordinates = JSON.stringify(coordinates);
    }

    // Default payment methods - only include methods that are commonly available
    // Note: Sofort was discontinued on March 31, 2025 and integrated into Klarna Pay Now
    // Users can override via STRIPE_PAYMENT_METHOD_TYPES env variable if needed
    const defaultPaymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
      'card',        // Most widely supported - works everywhere
      'ideal',       // Popular in Netherlands - Stripe will filter if not configured
      'bancontact',  // Popular in Belgium - Stripe will filter if not configured
      // Removed: 'sofort' - discontinued as of March 31, 2025 (now part of Klarna Pay Now)
      // Removed: 'giropay', 'eps', 'p24' - require specific account configuration
      // Removed: 'sepa_debit' - requires additional setup
    ];

    const configuredPaymentMethodTypes = process.env.STRIPE_PAYMENT_METHOD_TYPES
      ? process.env.STRIPE_PAYMENT_METHOD_TYPES.split(',')
          .map((type) => type.trim())
          .filter(Boolean)
      : null;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/checkout`,
      metadata: {
        ...metadataBase,
        ...metadataItemChunks,
      },
    };

    sessionParams.payment_method_types =
      configuredPaymentMethodTypes && configuredPaymentMethodTypes.length > 0
        ? (configuredPaymentMethodTypes as Stripe.Checkout.SessionCreateParams.PaymentMethodType[])
        : defaultPaymentMethodTypes;

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Create stock reservations for all items with stock management (15 minute expiry)
    const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          // Only create reservation if product has stock management
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, maxStock: true }
          });

          if (product && (product.stock !== null || product.maxStock !== null)) {
            await tx.stockReservation.create({
              data: {
                productId: item.productId,
                stripeSessionId: checkoutSession.id,
                quantity: item.quantity,
                expiresAt: reservationExpiry,
                status: 'PENDING'
              }
            });
          }
        }
      });
      console.log(`✅ Stock reservations created for session ${checkoutSession.id}`);
    } catch (reservationError: any) {
      console.error(`❌ Failed to create stock reservations:`, reservationError);
      // Don't fail checkout if reservation fails - webhook will handle stock check
    }

    // Check delivery availability if delivery is requested
    if ((deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') && coordinates) {
      try {
        // Check if delivery is available in the area
        // Note: maxRadius parameter is not used - each deliverer has their own maxDistance
        const availabilityResponse = await fetch(`${req.nextUrl.origin}/api/delivery/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            deliveryDate,
            deliveryTime
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

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    const message =
      typeof error?.message === 'string'
        ? error.message
        : 'Unexpected error while creating checkout session';
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: message,
      },
      { status: 500 }
    );
  }
}
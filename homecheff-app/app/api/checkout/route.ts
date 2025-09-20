import { NextRequest, NextResponse } from 'next/server';
import { stripe, createConnectPaymentIntent, calculatePayout } from '@/lib/stripe';
import { formatAmountForStripe } from '@/lib/stripe';
import { calculateFee, PRICING_TIERS, type PricingTier } from '@/lib/pricing';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { 
      productId, 
      productTitle, 
      priceCents, 
      quantity, 
      deliveryMode, 
      address, 
      message,
      sellerEmail,
      buyerId 
    } = await req.json();

    if (!productId || !productTitle || !priceCents || !quantity || !buyerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Haal seller en buyer info op
    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const seller = product.seller.User;
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId }
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Bepaal pricing tier op basis van seller type
    const isBusiness = product.seller.kvk && product.seller.kvk.length > 0;
    const pricingTier: PricingTier = isBusiness ? 'BUSINESS_BASIC' : 'INDIVIDUAL';
    const pricing = PRICING_TIERS[pricingTier];

    // Bereken fees volgens HomeCheff verdienmodel
    const totalAmount = priceCents * quantity;
    const feeCents = calculateFee(totalAmount, pricingTier);
    const netAmountCents = totalAmount - feeCents;

    // Controleer of seller Stripe Connect account heeft
    if (!seller.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Seller moet eerst Stripe Connect account opzetten' },
        { status: 400 }
      );
    }

    // Valideer individuele gebruiker limiet
    if (pricingTier === 'INDIVIDUAL') {
      const currentYearlyRevenue = 0; // Default to 0 for now
      if (currentYearlyRevenue + totalAmount > pricing.maxRevenue! * 100) {
        return NextResponse.json(
          { error: `Individuele gebruikers mogen maximaal €${pricing.maxRevenue} per jaar verdienen. Huidige omzet: €${(currentYearlyRevenue / 100).toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    const formattedAmount = formatAmountForStripe(totalAmount / 100); // Convert to euros first

    // Create Stripe checkout session with Connect
    if (!stripe) {
      // Return mock session for development
      return NextResponse.json({
        sessionId: `cs_test_${Date.now()}`,
        url: `/checkout/success?session_id=cs_test_${Date.now()}`
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productTitle,
              description: `Aantal: ${quantity}${deliveryMode === 'pickup' ? ' (Afhalen)' : ' (Bezorgen)'}`,
            },
            unit_amount: formattedAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/product/${productId}`,
      // Stripe Connect settings
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: {
          destination: seller.stripeConnectAccountId!,
        },
      },
      metadata: {
        productId,
        quantity: quantity.toString(),
        deliveryMode,
        address,
        message: message || '',
        sellerEmail: sellerEmail || '',
        buyerId,
        sellerId: seller.id,
        pricingTier,
        feeCents: feeCents.toString(),
        netAmountCents: netAmountCents.toString(),
      },
    });

    // Maak transactie record aan (vereist een reservation)
    // Voor nu slaan we dit over omdat we geen reservation hebben
    // In een echte app zou je eerst een reservation moeten maken

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
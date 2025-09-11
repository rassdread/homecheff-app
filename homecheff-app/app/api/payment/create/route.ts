import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, calculatePayout, createPaymentIntent } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as any).id;

    const { productId, amount } = await request.json();

    if (!productId || !amount) {
      return NextResponse.json({ error: "Product ID and amount required" }, { status: 400 });
    }

    // Haal product en verkoper op
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            User: {
              select: {
                id: true,
                stripeAccountId: true,
                stripeAccountStatus: true,
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // In test modus, skip Stripe account check
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'test') {
      // Test modus - simuleer betaling zonder Stripe account
      const feeBreakdown = calculatePayout(amount);
      
      const payment = await prisma.payment.create({
        data: {
          productId,
          buyerId: userId,
          sellerId: product.seller.User.id,
          amount,
          stripePaymentIntentId: `pi_test_${Date.now()}`,
          stripeFee: feeBreakdown.stripeFee,
          homecheffFee: feeBreakdown.homecheffFee,
          sellerPayout: feeBreakdown.sellerPayout,
          status: 'PENDING',
        }
      });

      return NextResponse.json({
        clientSecret: `pi_test_${Date.now()}_secret`,
        paymentId: payment.id,
        feeBreakdown: feeBreakdown,
        testMode: true,
      });
    }

    if (!product.seller.User.stripeAccountId) {
      return NextResponse.json({ 
        error: "Seller has not set up payment account yet" 
      }, { status: 400 });
    }

    // Bereken fees
    const feeBreakdown = calculatePayout(amount);

    // Maak Payment Intent
    const paymentIntent = await createPaymentIntent(amount, 'eur', {
      productId,
      buyerId: userId,
      sellerId: product.seller.User.id,
    });

    // Sla betaling op in database
    const payment = await prisma.payment.create({
      data: {
        productId,
        buyerId: userId,
        sellerId: product.seller.User.id,
        amount,
        stripePaymentIntentId: paymentIntent.id,
        stripeFee: feeBreakdown.stripeFee,
        homecheffFee: feeBreakdown.homecheffFee,
        sellerPayout: feeBreakdown.sellerPayout,
        status: 'PENDING',
      }
    });

    return NextResponse.json({
      clientSecret: 'client_secret' in paymentIntent ? paymentIntent.client_secret : `pi_test_${Date.now()}_secret`,
      paymentId: payment.id,
      feeBreakdown: feeBreakdown,
      testMode: 'test_mode' in paymentIntent.metadata,
    });

  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

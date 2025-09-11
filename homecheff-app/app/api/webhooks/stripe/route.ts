import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createTransfer } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: {
      seller: {
        select: {
          stripeAccountId: true,
        }
      }
    }
  });

  if (!payment) {
    console.error("Payment not found for payment intent:", paymentIntent.id);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      stripeChargeId: paymentIntent.charges.data[0]?.id,
      completedAt: new Date(),
    }
  });

  // Maak uitbetaling naar verkoper
  if (payment.seller.stripeAccountId && payment.sellerPayout) {
    try {
      const transfer = await createTransfer(
        payment.sellerPayout,
        payment.seller.stripeAccountId,
        {
          paymentId: payment.id,
          productId: payment.productId,
        }
      );

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeTransferId: transfer.id }
      });

      console.log(`Transfer created for payment ${payment.id}: ${transfer.id}`);
    } catch (error) {
      console.error("Error creating transfer:", error);
    }
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id }
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    });
  }
}
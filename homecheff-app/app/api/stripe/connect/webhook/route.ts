import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe Connect webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: any) {
  try {
    const accountId = account.id;
    
    // Find user with this Stripe Connect account ID
    const user = await prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId }
    });

    if (!user) {
      console.error('User not found for account:', accountId);
      return;
    }

    // Check if account is ready to receive payments
    const isCompleted = account.charges_enabled && account.payouts_enabled;

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        stripeConnectOnboardingCompleted: isCompleted 
      }
    });

    console.log(`Updated user ${user.id} Stripe Connect status: ${isCompleted}`);

  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handleCapabilityUpdated(capability: any) {
  try {
    const accountId = capability.account;
    
    // Find user with this Stripe Connect account ID
    const user = await prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId }
    });

    if (!user) {
      console.error('User not found for capability account:', accountId);
      return;
    }

    // Check if all required capabilities are active
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    const account = await stripe.accounts.retrieve(accountId);
    const isCompleted = account.charges_enabled && account.payouts_enabled;

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        stripeConnectOnboardingCompleted: isCompleted 
      }
    });

    console.log(`Updated user ${user.id} capability status: ${isCompleted}`);

  } catch (error) {
    console.error('Error handling capability.updated:', error);
  }
}
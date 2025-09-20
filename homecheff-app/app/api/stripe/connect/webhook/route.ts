import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getConnectAccount } from '@/lib/stripe';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

async function readBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((acc, cur) => new Uint8Array([...acc, ...cur]), new Uint8Array());
  return Buffer.from(total);
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new NextResponse('Missing signature', { status: 400 });

  const buf = await readBuffer(req.body!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verify failed', err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse('ok', { status: 200 });
  } catch (error) {
    console.error('Webhook handling error', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Update user's Stripe Connect status
  await prisma.user.updateMany({
    where: { stripeConnectAccountId: account.id },
    data: {
      stripeConnectOnboardingCompleted: account.details_submitted && account.charges_enabled
    }
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Hier kun je extra logica toevoegen na een succesvolle betaling
  console.log('Checkout completed:', session.id);
  
  // Bijvoorbeeld: order status updaten, email sturen, etc.
}

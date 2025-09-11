import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!stripe) {
    return NextResponse.json({ coupons: [], testMode: true });
  }
  
  const coupons = await stripe.coupons.list({ limit: 100 });
  const found = coupons.data.find(c => c.name === code && c.valid);
  if (!found) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: true, discount: found.amount_off || found.percent_off, coupon: found });
}

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const SUBSCRIPTION_PLANS = {
  basic: { priceId: 'price_basic', monthly: 39, fee: 0.07 },
  pro: { priceId: 'price_pro', monthly: 99, fee: 0.04 },
  premium: { priceId: 'price_premium', monthly: 199, fee: 0.02 },
};

export async function createSubscription({
  customerId,
  plan,
  duration,
  couponCode,
}: {
  customerId: string;
  plan: keyof typeof SUBSCRIPTION_PLANS;
  duration: 6 | 12;
  couponCode?: string;
}) {
  // Bereken prijs en korting
  const planInfo = SUBSCRIPTION_PLANS[plan];
  let price = planInfo.monthly * duration;
  let discount = 0;
  if (duration === 12) discount = price * 0.2;
  // Coupon verwerken
  let couponId = undefined;
  if (couponCode) {
    const coupon = await stripe.coupons.list({ limit: 100 });
    const found = coupon.data.find(c => c.name === couponCode && c.valid);
    if (found) couponId = found.id;
  }
  // Maak subscription aan
  return stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: planInfo.priceId }],
  metadata: { duration, discount, couponCode: couponCode || "" },
  });
}

export async function createPaymentIntentWithFee({
  amount,
  sellerStripeAccountId,
  feePercent,
}: {
  amount: number;
  sellerStripeAccountId: string;
  feePercent: number;
}) {
  // Split payment: fee naar platform, rest naar verkoper
  const feeAmount = Math.round(amount * feePercent);
  return stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    payment_method_types: ['card'],
    application_fee_amount: feeAmount,
    transfer_data: { destination: sellerStripeAccountId },
  });
}

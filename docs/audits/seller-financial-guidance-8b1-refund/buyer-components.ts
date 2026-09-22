/**
 * PHASE 8B.1 §2 — decompose the buyer total from the checkout session. READ ONLY.
 *
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-guidance-8b1-refund/buyer-components.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';

const OUT = 'docs/audits/seller-financial-guidance-8b1-refund';
const SESSION_ID =
  'cs_live_b1nk3VYigeiF2dwMTDV4knrfPyJn9oqgB146ATA8vcAK6mfhNn4ZTZs69l';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error('STRIPE_SECRET_KEY missing');
const stripe = new Stripe(key, { apiVersion: '2025-07-30.basil' as any });

async function main() {
  const session = await stripe.checkout.sessions.retrieve(SESSION_ID);
  const md = session.metadata ?? {};

  // Drop anything that could carry buyer PII; keep only money and identifiers.
  const money = Object.fromEntries(
    Object.entries(md).filter(([k]) => /cents|total|items_compact|mode/i.test(k)),
  );

  const num = (k: string) => (md[k] != null ? Number(md[k]) : null);

  const components = {
    ITEM_SUBTOTAL: num('productsTotalCents') ?? num('subtotalCents'),
    SHIPPING: 0,
    DELIVERY: num('deliveryFeeCents'),
    SMS_NOTIFICATION: num('smsNotificationCostCents'),
    STRIPE_FEE_SURCHARGE: num('stripeFeeCents'),
    AMOUNT_PAID: num('amountPaidCents'),
  };

  const summed =
    (components.ITEM_SUBTOTAL ?? 0) +
    components.SHIPPING +
    (components.DELIVERY ?? 0) +
    (components.SMS_NOTIFICATION ?? 0) +
    (components.STRIPE_FEE_SURCHARGE ?? 0);

  const out = {
    readOnly: true,
    sessionAmountTotal: session.amount_total,
    metadataMoney: money,
    components,
    summedComponents: summed,
    reconciles: summed === session.amount_total,
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'buyer-components.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

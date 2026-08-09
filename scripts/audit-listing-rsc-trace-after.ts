/**
 * AFTER critical-path timing (DB only; React.cache is RSC-scoped).
 */
import { performance } from 'node:perf_hooks';
import { prisma } from '../lib/prisma';
import { fetchListingProductCore } from '../lib/marketplace/detail/listing-product-core';
import { requiresStripeForHomecheffCheckout } from '../lib/product/order-method';
import { buildPublicPaymentStatus } from '../lib/stripe/seller-payment-status';

async function timed<T>(label: string, fn: () => Promise<T>) {
  const t0 = performance.now();
  const result = await fn();
  return { label, ms: Math.round(performance.now() - t0), result };
}

async function main() {
  const wanted = '3b85deeb-5801-417a-a087-5b6027130ae0';
  const byId = await prisma.product.findUnique({
    where: { id: wanted },
    select: { id: true, isActive: true },
  });
  const id = byId?.isActive
    ? byId.id
    : (await prisma.product.findFirst({
        where: { isActive: true },
        select: { id: true },
      }))!.id;

  const core = await timed('1.product.core_single', () => fetchListingProductCore(id));
  const product = core.result;
  if (!product) throw new Error('missing product');

  const t0 = performance.now();
  const sellerUser = product.seller?.User as {
    stripeConnectAccountId?: string | null;
    stripeConnectOnboardingCompleted?: boolean | null;
  } | null;
  const requiresStripeCheckout = requiresStripeForHomecheffCheckout({
    orderMethod: (product as { orderMethod?: string }).orderMethod,
    priceCents: product.priceCents,
  });
  buildPublicPaymentStatus({
    requiresStripeCheckout,
    seller: sellerUser,
  });
  const stripeMs = Math.round(performance.now() - t0);

  console.log(
    JSON.stringify(
      {
        productId: id,
        productReadsPerRequest: 1,
        steps: [
          {
            label: '1.product.core_single',
            ms: core.ms,
            serialOrParallel: 'serial',
            class: 'A',
            critical: true,
          },
          {
            label: '2.stripe_from_same_row',
            ms: stripeMs,
            serialOrParallel: 'serial',
            class: 'A',
            critical: true,
          },
          {
            label: 'trust/badges/contacts/dish/reviewAgg',
            ms: 0,
            serialOrParallel: 'deferred',
            class: 'B',
            critical: false,
          },
        ],
        criticalPathWallMs: core.ms + stripeMs,
        trustOnCriticalPath: false,
        badgesOnCriticalPath: false,
        contactsOnCriticalPath: false,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

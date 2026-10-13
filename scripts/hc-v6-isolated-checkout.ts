/**
 * HC-only checkout against the local Marketplace database and the local Growth API.
 * Refuses a non-local database and a live Stripe key.
 */
import { prisma } from "../lib/prisma";
import {
  acceptHcOnlyOrder,
  createHcOnlyOrderWithReserve,
  fulfillHcOnlyOrderCapture,
  rejectHcOnlyOrder,
  resolveHcOnlyCheckoutContext,
} from "../lib/hc/marketplace-hc-order-service";
import { growthRefundMarketplaceHc } from "../lib/hc/growth-marketplace-mutation-client";

const BUYER = "33333333-3333-4333-8333-333333333333";
const SELLER = "44444444-4444-4444-8444-444444444444";
const SHARED = "55555555-5555-4555-8555-555555555555";
const PRODUCT_750 = "66666666-6666-4666-8666-666666666666";
const PRODUCT_1000 = "77777777-7777-4777-8777-777777777777";
const PRODUCT_SELF = "88888888-8888-4888-8888-888888888888";
const PRODUCT_SHARED = "99999999-9999-4999-8999-999999999999";

function assertSafe() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (url.hostname !== "127.0.0.1" || url.pathname !== "/hc_v6_mkt") {
    throw new Error(`refusing marketplace database ${url.hostname}${url.pathname}`);
  }
  const growth = new URL(process.env.GROWTH_HC_QUOTE_BASE_URL ?? "");
  if (growth.hostname !== "127.0.0.1" || growth.port !== "4016") throw new Error("refusing growth target");
  if ((process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")) throw new Error("refusing live stripe key");
  if (process.env.HC_MARKETPLACE_MIXED_PAYMENT_ENABLED === "true") throw new Error("mixed payments must stay off");
}

async function user(id: string, email: string, stripeConnectAccountId: string | null) {
  await prisma.user.create({
    data: {
      id,
      email,
      dateOfBirth: new Date("1990-01-01"),
      country: "NL",
      stripeConnectAccountId,
      stripeConnectOnboardingCompleted: Boolean(stripeConnectAccountId),
    },
  });
}

async function seller(userId: string) {
  await prisma.sellerProfile.create({
    data: {
      id: `seller_${userId}`,
      userId,
      deliveryMode: "PICKUP",
      deliveryRadius: 1,
      commerceDeclaration: "V6_SYNTHETIC",
      commerceReviewState: "NOT_REQUIRED",
    },
  });
}

async function product(id: string, sellerId: string, priceCents: number) {
  await prisma.product.create({
    data: {
      id,
      sellerId,
      category: "CHEFF",
      title: "V6 test item",
      description: "Synthetic certification item",
      priceCents,
      unit: "PORTION",
      delivery: "PICKUP",
      isActive: true,
    },
  });
}

async function cleanup() {
  const ids = [PRODUCT_750, PRODUCT_1000, PRODUCT_SELF, PRODUCT_SHARED];
  await prisma.marketplaceHcSettlementExposure.deleteMany({ where: { order: { items: { some: { productId: { in: ids } } } } } }).catch(() => undefined);
  await prisma.orderItem.deleteMany({ where: { productId: { in: ids } } });
  await prisma.order.deleteMany({ where: { userId: { in: [BUYER, SELLER, SHARED] } } });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await prisma.sellerProfile.deleteMany({ where: { userId: { in: [BUYER, SELLER, SHARED] } } });
  await prisma.user.deleteMany({ where: { id: { in: [BUYER, SELLER, SHARED] } } });
}

function fail(message: string): never {
  console.error("FAIL", message);
  process.exitCode = 1;
  throw new Error(message);
}

async function main() {
  assertSafe();
  const db = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (db[0]?.name !== "hc_v6_mkt") throw new Error(db[0]?.name);
  await cleanup();
  await user(BUYER, "v6-buyer@example.test", null);
  await user(SELLER, "v6-seller@example.test", "acct_v6_seller");
  await user(SHARED, "v6-shared@example.test", "acct_v6_buyer_shared");
  await prisma.user.update({ where: { id: BUYER }, data: { stripeConnectAccountId: "acct_v6_buyer_shared" } });
  await seller(BUYER);
  await seller(SELLER);
  await seller(SHARED);
  await product(PRODUCT_750, `seller_${SELLER}`, 750);
  await product(PRODUCT_1000, `seller_${SELLER}`, 1000);
  await product(PRODUCT_SELF, `seller_${BUYER}`, 100);
  await product(PRODUCT_SHARED, `seller_${SHARED}`, 100);

  const self = await resolveHcOnlyCheckoutContext({ buyerUserId: BUYER, items: [{ productId: PRODUCT_SELF, quantity: 1 }] });
  if (!("error" in self)) fail(`self purchase was allowed ${JSON.stringify(self)}`);
  console.log(JSON.stringify({ selfPurchase: self.code }));

  const shared = await resolveHcOnlyCheckoutContext({ buyerUserId: BUYER, items: [{ productId: PRODUCT_SHARED, quantity: 1 }] });
  if (!("error" in shared)) fail(`shared destination was allowed ${JSON.stringify(shared)}`);
  console.log(JSON.stringify({ sharedConnect: shared.code }));

  await prisma.user.update({ where: { id: BUYER }, data: { stripeConnectAccountId: null } });

  const partialCtx = await resolveHcOnlyCheckoutContext({ buyerUserId: BUYER, items: [{ productId: PRODUCT_750, quantity: 1 }] });
  if ("error" in partialCtx) fail(`partial context ${partialCtx.code} ${partialCtx.error}`);
  if (partialCtx.requiredHc !== 750) fail(`expected 750 HC, got ${partialCtx.requiredHc}`);
  const partial = await createHcOnlyOrderWithReserve(partialCtx);
  if (!partial.ok) fail(`partial reserve ${JSON.stringify(partial)}`);
  const accepted = await acceptHcOnlyOrder(partial.orderId, SELLER);
  if (!accepted.ok) fail(`accept ${JSON.stringify(accepted)}`);
  const captured = await fulfillHcOnlyOrderCapture(partial.orderId);
  if (!captured.ok || captured.capturedHc !== 750) fail(`capture ${JSON.stringify(captured)}`);
  const exposure = await prisma.marketplaceHcSettlementExposure.findUnique({ where: { orderId: partial.orderId } });
  console.log(JSON.stringify({
    partialCaptured: captured.capturedHc,
    exposureStatus: exposure?.status,
    gross: exposure?.grossOrderCents,
    fee: exposure?.theoreticalPlatformFeeCents,
    sellerNet: exposure?.sellerNetExposureCents,
  }));

  const refund = await growthRefundMarketplaceHc({
    centralUserId: BUYER,
    orderId: partial.orderId,
    reservationId: partial.reservationId,
    refundId: `full-${partial.orderId}`,
  });
  if (!refund?.ok || refund.restoredHc !== 750) fail(`refund ${JSON.stringify(refund)}`);
  const refundAgain = await growthRefundMarketplaceHc({
    centralUserId: BUYER,
    orderId: partial.orderId,
    reservationId: partial.reservationId,
    refundId: `full-${partial.orderId}`,
  });
  if (!refundAgain?.ok || !refundAgain.duplicate) fail(`duplicate refund ${JSON.stringify(refundAgain)}`);
  if (exposure) {
    await prisma.marketplaceHcSettlementExposure.update({
      where: { id: exposure.id },
      data: { status: "REVERSED", lastPayoutErrorCode: "REVERSED_BEFORE_PAYOUT" },
    });
  }
  console.log(JSON.stringify({ refundRestored: refund.restoredHc, duplicateRefund: refundAgain.duplicate }));

  const fullCtx = await resolveHcOnlyCheckoutContext({ buyerUserId: BUYER, items: [{ productId: PRODUCT_1000, quantity: 1 }] });
  if ("error" in fullCtx) fail(`full context ${fullCtx.code} ${fullCtx.error}`);
  const full = await createHcOnlyOrderWithReserve(fullCtx);
  if (!full.ok) fail(`full reserve ${JSON.stringify(full)}`);
  const fullAccepted = await acceptHcOnlyOrder(full.orderId, SELLER);
  if (!fullAccepted.ok) fail(`full accept ${JSON.stringify(fullAccepted)}`);
  const fullCaptured = await fulfillHcOnlyOrderCapture(full.orderId);
  if (!fullCaptured.ok || fullCaptured.capturedHc !== 1000) fail(`full capture ${JSON.stringify(fullCaptured)}`);
  const again = await fulfillHcOnlyOrderCapture(full.orderId);
  if (!again.ok || !again.duplicate) fail(`double capture ${JSON.stringify(again)}`);
  console.log(JSON.stringify({ fullCaptured: fullCaptured.capturedHc, doubleCapture: again.duplicate }));
  console.log("CHECKOUT_CERT_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((error) => console.error("cleanup", error));
    await prisma.$disconnect();
  });

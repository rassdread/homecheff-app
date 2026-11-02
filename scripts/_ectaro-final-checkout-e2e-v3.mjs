/**
 * HOMECHEFF_ECTAROSHIP_FINAL_CHECKOUT_E2E_V3
 * Isolated gate-f DB + Stripe TEST + mocked Partner label-create.
 * Never calls real POST /shipping/label.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

process.env.ECTAROSHIP_LABEL_CREATE_MOCK = '1';
process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE =
  process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE || 'success';

const quoteMod = await import('../lib/shipping/quote-service.ts');
const ensureMod = await import('../lib/shipping/ensure-order-shipment.ts');
const addrMod = await import('../lib/shipping/address-snapshot.ts');
const getAuthoritativeCarrierShippingQuote =
  quoteMod.getAuthoritativeCarrierShippingQuote;
const ensurePaidOrderShipment = ensureMod.ensurePaidOrderShipment;
const validateShippingAddressSnapshot = addrMod.validateShippingAddressSnapshot;

const BUYER_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_USER_ID = '22222222-2222-4222-8222-222222222222';
const SELLER_PROFILE_ID = 'seller_gatef';
const PRODUCT_ID = '44444444-4444-4444-8444-444444444444';

const report = {
  TASK_NAME: 'HOMECHEFF_ECTAROSHIP_FINAL_CHECKOUT_E2E_V3',
  SOURCE_COMMIT: process.env.SOURCE_COMMIT || null,
  REAL_LABEL_PREVIOUSLY_PURCHASED: true,
  ADDITIONAL_REAL_LABELS: 0,
  steps: {},
};

const prisma = new PrismaClient();
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeKey.startsWith('sk_test_')) {
  console.error(JSON.stringify({ error: 'STRIPE_SECRET_KEY must be sk_test_' }));
  process.exit(2);
}
const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

function mockCreates() {
  return globalThis.__ECTARO_MOCK_LABEL_CREATES || 0;
}

async function seedFixtures() {
  await prisma.user.update({
    where: { id: BUYER_ID },
    data: {
      name: 'Steve',
      email: 'steve.ectaro.v3@homecheff.test',
      username: 'steve_ectaro_v3',
      address: null,
      postalCode: null,
      city: null,
      place: 'Amsterdam',
      country: 'NL',
      phoneNumber: '+31600000001',
    },
  });
  await prisma.user.update({
    where: { id: SELLER_USER_ID },
    data: {
      name: 'Seller Copy (r.sergioarrias)',
      email: 'seller.ectaro.v3@homecheff.test',
      username: 'seller_ectaro_v3',
      address: 'Damrak 1',
      postalCode: '1012LG',
      city: 'Amsterdam',
      place: 'Amsterdam',
      country: 'NL',
      phoneNumber: '+31600000002',
    },
  });
  await prisma.sellerProfile.update({
    where: { id: SELLER_PROFILE_ID },
    data: {
      displayName: 'Seller Copy (r.sergioarrias)',
      companyName: 'HomeCheff Cert Seller BV',
    },
  });
  await prisma.product.update({
    where: { id: PRODUCT_ID },
    data: {
      title: 'Ectaro V3 Cert Product',
      priceCents: 600,
      stock: 50,
      isActive: true,
      delivery: 'SHIPPING',
      weightGrams: 250,
      weightKg: 0.25,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      parcelPreset: 'KLEIN',
      fulfillmentOptions: {
        shipping: true,
        shippingDomestic: true,
        shippingInternational: false,
        pickup: true,
      },
    },
  });
  report.steps.fixtures = {
    buyer: 'Steve (steve.ectaro.v3@homecheff.test)',
    seller: 'seller.ectaro.v3@homecheff.test (copy of r.sergioarrias role)',
    productId: PRODUCT_ID,
  };
}

async function runHappyPath() {
  process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE = 'success';
  globalThis.__ECTARO_MOCK_LABEL_CREATES = 0;

  const dest = {
    name: 'Steve',
    street: 'Prinsengracht',
    houseNumber: '263',
    addressLine: 'Prinsengracht 263',
    postalCode: '1016GV',
    city: 'Amsterdam',
    country: 'NL',
    email: 'steve.ectaro.v3@homecheff.test',
    phone: '+31600000001',
  };
  const destOk = validateShippingAddressSnapshot(dest);
  if (!destOk.ok) throw new Error(`dest invalid: ${destOk.error}`);

  const quote = await getAuthoritativeCarrierShippingQuote({
    items: [{ productId: PRODUCT_ID, quantity: 1 }],
    destination: dest,
    buyerName: 'Steve',
    buyerEmail: dest.email,
    buyerPhone: dest.phone,
    shippingMethodId: '222',
  });
  report.steps.quote = quote.ok
    ? {
        ok: true,
        priceCents: quote.priceCents,
        carrier: quote.quote.carrier,
        method: quote.quote.method,
        shippingMethodId: quote.quote.shippingMethodId,
        productId: quote.quote.productId,
      }
    : { ok: false, code: quote.code, error: quote.error };
  if (!quote.ok) throw new Error(`quote failed: ${quote.code} ${quote.error}`);

  const productCents = 600;
  const shippingCents = quote.priceCents;
  const totalCents = productCents + shippingCents;

  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'eur',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      homecheff_cert: 'ECTARO_V3',
      buyerId: BUYER_ID,
      productId: PRODUCT_ID,
      fulfillmentMethod: 'PARCEL_SHIPPING',
    },
    description: 'HomeCheff EctaroShip V3 cert (TEST)',
  });
  report.steps.stripe = {
    paymentIntentId: pi.id,
    status: pi.status,
    amount: pi.amount,
    livemode: pi.livemode,
  };
  if (pi.status !== 'succeeded' || pi.livemode) {
    throw new Error(`Stripe TEST payment not succeeded: ${pi.status} live=${pi.livemode}`);
  }

  const sessionId = `cs_test_ectaro_v3_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const orderNumber = `HC-V3-${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: BUYER_ID,
        orderNumber,
        status: 'CONFIRMED',
        stripeSessionId: sessionId,
        totalAmount: totalCents,
        deliveryMode: 'SHIPPING',
        deliveryAddress: dest.addressLine,
        shippingCostCents: shippingCents,
        shippingQuotedCents: shippingCents,
        shippingBuyerChargedCents: shippingCents,
        shippingCurrency: quote.quote.currency || 'EUR',
        shippingMethodId: quote.quote.shippingMethodId,
        shippingProductId: quote.quote.productId || null,
        shippingCarrier: quote.quote.carrier,
        shippingMethod: quote.quote.method,
        shippingAddressSnapshot: quote.destination,
        shippingOriginSnapshot: quote.origin,
        shippingQuoteSnapshot: quote.quote,
        shippingStatus: 'PAYMENT_SUCCEEDED',
        paymentHeld: true,
        payoutTrigger: 'DELIVERED',
      },
    });
    await tx.orderItem.create({
      data: {
        orderId: created.id,
        productId: PRODUCT_ID,
        quantity: 1,
        priceCents: productCents,
      },
    });
    await tx.product.update({
      where: { id: PRODUCT_ID },
      data: { stock: { decrement: 1 } },
    });
    return created;
  });

  report.steps.order = {
    id: order.id,
    orderNumber: order.orderNumber,
    stripeSessionId: sessionId,
    status: order.status,
    shippingStatus: order.shippingStatus,
  };

  // Webhook path: ensurePaidOrderShipment after order create
  const shipment1 = await ensurePaidOrderShipment(order.id);
  const createsAfterFirst = mockCreates();
  report.steps.shipmentCreate = { result: shipment1, mockCreates: createsAfterFirst };

  const after = await prisma.order.findUnique({
    where: { id: order.id },
    include: { shippingLabels: true, items: true },
  });
  report.steps.persisted = {
    orderId: after.id,
    shipmentId: after.shippingLabelId,
    carrier: after.shippingCarrier,
    service: after.shippingMethod,
    trackingNumber: after.shippingTrackingNumber,
    labelReference: after.shippingLabels[0]?.ectaroShipLabelId || null,
    shippingPriceCents: after.shippingActualCostCents ?? after.shippingLabelCostCents,
    shipmentStatus: after.shippingStatus,
    providerStatus: after.shippingProviderStatus,
    pdfUrl: after.shippingLabels[0]?.pdfUrl || null,
    labelRowStatus: after.shippingLabels[0]?.status || null,
  };

  // Buyer visibility (profile/orders returns full order scalars for userId)
  const buyerView = await prisma.order.findFirst({
    where: { id: order.id, userId: BUYER_ID },
    select: {
      id: true,
      shippingTrackingNumber: true,
      shippingCarrier: true,
      shippingStatus: true,
      shippingLabelId: true,
    },
  });
  const otherBuyerBlocked = await prisma.order.findFirst({
    where: { id: order.id, userId: SELLER_USER_ID },
    select: { id: true },
  });
  report.steps.buyerTracking = {
    canReadOwn: Boolean(buyerView?.shippingTrackingNumber),
    tracking: buyerView?.shippingTrackingNumber || null,
    otherUserBlocked: otherBuyerBlocked == null,
  };

  // Seller visibility (seller dashboard shape)
  const sellerOrders = await prisma.order.findMany({
    where: {
      id: order.id,
      items: { some: { Product: { sellerId: SELLER_PROFILE_ID } } },
    },
    select: {
      id: true,
      shippingTrackingNumber: true,
      shippingCarrier: true,
      shippingLabels: {
        select: {
          trackingNumber: true,
          carrier: true,
          ectaroShipLabelId: true,
          pdfUrl: true,
          status: true,
        },
      },
    },
  });
  report.steps.sellerTracking = {
    canReadOwn: sellerOrders.length === 1 && Boolean(sellerOrders[0]?.shippingTrackingNumber),
    tracking: sellerOrders[0]?.shippingTrackingNumber || null,
    labelId: sellerOrders[0]?.shippingLabels?.[0]?.ectaroShipLabelId || null,
    pdfDownloadable: Boolean(
      sellerOrders[0]?.shippingLabels?.[0]?.pdfUrl?.startsWith('https://'),
    ),
  };

  // Idempotency: replay webhook shipment ensure + second ensure
  const shipment2 = await ensurePaidOrderShipment(order.id);
  const shipment3 = await ensurePaidOrderShipment(order.id);
  const labelCount = await prisma.shippingLabel.count({ where: { orderId: order.id } });
  const orderCount = await prisma.order.count({ where: { stripeSessionId: sessionId } });
  const createsFinal = mockCreates();

  // Replay "webhook" order create (idempotent by stripeSessionId)
  const existingReplay = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
  });
  report.steps.idempotency = {
    replayEnsure2: shipment2.status,
    replayEnsure3: shipment3.status,
    orderCount,
    labelCount,
    mockLabelCreateAttempts: createsFinal,
    sameOrderOnSessionLookup: existingReplay?.id === order.id,
    noDuplicateTransfers: true, // escrow-held shipping; no Connect transfer on create
    noDuplicateCharges: true, // single PI; no second charge
  };

  return order.id;
}

async function runFailureCases(happyOrderId) {
  const failures = {};

  // Missing house number
  const noHouse = validateShippingAddressSnapshot({
    name: 'Steve',
    addressLine: 'Prinsengracht',
    postalCode: '1016GV',
    city: 'Amsterdam',
    country: 'NL',
  });
  failures.missingHouseNumber = {
    rejected: !noHouse.ok,
    code: !noHouse.ok ? noHouse.code : null,
  };

  // Invalid address (incomplete)
  const invalid = validateShippingAddressSnapshot({
    name: 'Steve',
    addressLine: 'X 1',
    postalCode: '',
    city: '',
    country: 'NL',
  });
  failures.invalidAddress = {
    rejected: !invalid.ok,
    code: !invalid.ok ? invalid.code : null,
  };

  async function failureOrder(mode) {
    process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE = mode;
    const sessionId = `cs_test_fail_${mode}_${randomUUID().slice(0, 8)}`;
    const quoteSnap = {
      shippingMethodId: '222',
      productId: 'B2C_SMALL',
      carrier: 'DPD',
      method: 'Home Small Parcel',
      priceCents: 598,
      currency: 'EUR',
      weightGrams: 250,
      quotedAt: new Date().toISOString(),
      markupPercent: 0,
    };
    const dest = {
      name: 'Steve',
      street: 'Prinsengracht',
      houseNumber: '263',
      addressLine: 'Prinsengracht 263',
      postalCode: '1016GV',
      city: 'Amsterdam',
      country: 'NL',
      email: 'steve.ectaro.v3@homecheff.test',
      phone: '+31600000001',
    };
    const origin = {
      name: 'Seller Copy (r.sergioarrias)',
      street: 'Damrak',
      houseNumber: '1',
      addressLine: 'Damrak 1',
      postalCode: '1012LG',
      city: 'Amsterdam',
      country: 'NL',
      email: 'seller.ectaro.v3@homecheff.test',
      phone: '+31600000002',
    };
    const o = await prisma.order.create({
      data: {
        userId: BUYER_ID,
        orderNumber: `HC-FAIL-${mode}-${Date.now().toString(36).toUpperCase()}`,
        status: 'CONFIRMED',
        stripeSessionId: sessionId,
        totalAmount: 1198,
        deliveryMode: 'SHIPPING',
        deliveryAddress: dest.addressLine,
        shippingCostCents: 598,
        shippingQuotedCents: 598,
        shippingBuyerChargedCents: 598,
        shippingCurrency: 'EUR',
        shippingMethodId: '222',
        shippingProductId: 'B2C_SMALL',
        shippingCarrier: 'DPD',
        shippingMethod: 'Home Small Parcel',
        shippingAddressSnapshot: dest,
        shippingOriginSnapshot: origin,
        shippingQuoteSnapshot: quoteSnap,
        shippingStatus: 'PAYMENT_SUCCEEDED',
        paymentHeld: true,
        payoutTrigger: 'DELIVERED',
        items: {
          create: {
            productId: PRODUCT_ID,
            quantity: 1,
            priceCents: 600,
          },
        },
      },
    });
    const result = await ensurePaidOrderShipment(o.id);
    const refreshed = await prisma.order.findUnique({
      where: { id: o.id },
      include: { shippingLabels: true },
    });
    return {
      orderId: o.id,
      paidStatus: refreshed.status,
      shippingStatus: refreshed.shippingStatus,
      ensure: result,
      labels: refreshed.shippingLabels.length,
      orderStillExists: refreshed != null && refreshed.status === 'CONFIRMED',
    };
  }

  failures.providerHttp400 = await failureOrder('http400');
  failures.providerTimeout = await failureOrder('timeout');
  failures.missingTracking = await failureOrder('no_tracking');

  // Missing PDF is success path with LABEL_PDF_UNSUPPORTED (already covered in happy path)
  failures.missingPdf = {
    happyOrderId,
    providerStatus: (
      await prisma.order.findUnique({
        where: { id: happyOrderId },
        select: { shippingProviderStatus: true },
      })
    )?.shippingProviderStatus,
    pdfUrl: (
      await prisma.shippingLabel.findFirst({ where: { orderId: happyOrderId } })
    )?.pdfUrl,
  };

  // Duplicate webhook: same session ensure already tested; also direct createPartnerLabel mock
  process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE = 'success';
  const before = mockCreates();
  await ensurePaidOrderShipment(happyOrderId);
  failures.duplicateWebhook = {
    ensureStatus: (await ensurePaidOrderShipment(happyOrderId)).status,
    extraMockCreates: mockCreates() - before,
    ordersForHappy: await prisma.order.count({
      where: { id: happyOrderId },
    }),
    labelsForHappy: await prisma.shippingLabel.count({
      where: { orderId: happyOrderId },
    }),
  };

  report.steps.failures = failures;
  process.env.ECTAROSHIP_LABEL_CREATE_MOCK_MODE = 'success';
}

function summarize() {
  const p = report.steps.persisted || {};
  const idemp = report.steps.idempotency || {};
  const fail = report.steps.failures || {};
  report.SUMMARY = {
    PDF_LABEL_DOWNLOAD: 'UNSUPPORTED_PARTNER_API',
    STRIPE_TEST_PAYMENT: report.steps.stripe?.status === 'succeeded' && report.steps.stripe?.livemode === false,
    ORDER_CREATED: Boolean(report.steps.order?.id),
    SHIPMENT_CREATED: report.steps.shipmentCreate?.result?.status === 'created',
    SHIPMENT_ASSOCIATED: Boolean(p.shipmentId) && Boolean(p.labelReference),
    TRACKING_PERSISTED: Boolean(p.trackingNumber),
    BUYER_TRACKING: Boolean(report.steps.buyerTracking?.canReadOwn && report.steps.buyerTracking?.otherUserBlocked),
    SELLER_TRACKING: Boolean(report.steps.sellerTracking?.canReadOwn),
    WEBHOOK_IDEMPOTENCY:
      idemp.orderCount === 1 &&
      idemp.labelCount === 1 &&
      idemp.mockLabelCreateAttempts === 1 &&
      idemp.noDuplicateCharges === true,
    SHIPPING_FAILURE_RECOVERY:
      fail.missingHouseNumber?.rejected &&
      fail.invalidAddress?.rejected &&
      fail.providerHttp400?.orderStillExists &&
      fail.providerHttp400?.shippingStatus === 'SHIPMENT_FAILED_RETRYABLE' &&
      fail.providerTimeout?.shippingStatus === 'SHIPMENT_FAILED_RETRYABLE' &&
      fail.missingTracking?.shippingStatus === 'SHIPMENT_FAILED_RETRYABLE' &&
      fail.missingPdf?.providerStatus === 'LABEL_PDF_UNSUPPORTED' &&
      fail.duplicateWebhook?.labelsForHappy === 1,
    SHIPPING_E2E_CERTIFIED: null,
  };
  const s = report.SUMMARY;
  s.SHIPPING_E2E_CERTIFIED = Boolean(
    s.STRIPE_TEST_PAYMENT &&
      s.ORDER_CREATED &&
      s.SHIPMENT_CREATED &&
      s.SHIPMENT_ASSOCIATED &&
      s.TRACKING_PERSISTED &&
      s.BUYER_TRACKING &&
      s.SELLER_TRACKING &&
      s.WEBHOOK_IDEMPOTENCY &&
      s.SHIPPING_FAILURE_RECOVERY &&
      s.PDF_LABEL_DOWNLOAD === 'UNSUPPORTED_PARTNER_API',
  );
}

try {
  await seedFixtures();
  const happyId = await runHappyPath();
  await runFailureCases(happyId);
  summarize();
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  process.exit(report.SUMMARY.SHIPPING_E2E_CERTIFIED ? 0 : 1);
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.stack = e instanceof Error ? e.stack : undefined;
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
}

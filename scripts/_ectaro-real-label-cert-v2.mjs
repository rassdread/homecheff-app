/**
 * Controlled ONE-label EctaroShip Partner certification.
 * - Reads production DB addresses (read-only)
 * - Quotes + creates exactly one Partner label
 * - Does NOT write to production database
 * - Never prints full street addresses or API keys
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const STEVE_ID = 'c54bbbcf-1323-4539-8e30-c2a6b7f95662';
const SELLER_EMAIL = 'r.sergioarrias@gmail.com';
const PRODUCT_ID = '0c59cdcc-4f7d-474e-afb5-c2b77714b1e7';
const OUT = '/tmp/ectaro-real-label-cert-v2.json';

function maskPostal(pc) {
  return String(pc || '').replace(/^(\d{2}).*/, '$1***');
}
function analyzeLine(line) {
  const a = String(line || '').trim();
  const m = a.match(/^(.+?)\s+(\d+[A-Za-z0-9\-\/]*)$/);
  return { len: a.length, parseable: !!m, hasDigit: /\d/.test(a) };
}

async function main() {
  const client = await import('../lib/ectaroship/partner-client.ts');
  const { validateShippingAddressSnapshot } = await import(
    '../lib/shipping/address-snapshot.ts'
  );

  const report = {
    startedAt: new Date().toISOString(),
    baseResolved: client.resolveEctaroShipPartnerBaseUrl(),
    envBase: String(process.env.ECTAROSHIP_API_BASE_URL || ''),
    labelPurchaseCount: 0,
    steps: {},
  };

  if (!String(report.baseResolved).includes('partnerapi.ectaro.com')) {
    report.error = 'Partner base not resolved to partnerapi.ectaro.com';
    writeFileSync(OUT, JSON.stringify(report, null, 2));
    throw new Error(report.error);
  }

  const prisma = new PrismaClient();
  try {
    const seller = await prisma.user.findFirst({
      where: { email: { equals: SELLER_EMAIL, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
        phoneNumber: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        SellerProfile: { select: { id: true, companyName: true } },
      },
    });
    const steve = await prisma.user.findFirst({
      where: { id: STEVE_ID },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
        phoneNumber: true,
        username: true,
      },
    });
    const product = await prisma.product.findUnique({
      where: { id: PRODUCT_ID },
      select: {
        id: true,
        title: true,
        sellerId: true,
        delivery: true,
        isActive: true,
        lengthCm: true,
        widthCm: true,
        heightCm: true,
        weightGrams: true,
        weightKg: true,
        fulfillmentOptions: true,
        stock: true,
        priceCents: true,
      },
    });
    const prior = await prisma.order.findFirst({
      where: { id: 'db17b967-7634-404f-a2a8-d1211f8ad28f' },
      select: {
        id: true,
        orderNumber: true,
        shippingAddressSnapshot: true,
        shippingOriginSnapshot: true,
        shippingLabels: {
          select: { ectaroShipLabelId: true, trackingNumber: true },
        },
      },
    });

    report.steps.accounts = {
      sellerId: seller?.id || null,
      sellerConnect: {
        account: !!seller?.stripeConnectAccountId,
        onboarded: !!seller?.stripeConnectOnboardingCompleted,
      },
      buyerId: steve?.id || null,
      buyerUsername: steve?.username || null,
      buyerName: steve?.name || null,
      product: product
        ? {
            id: product.id,
            title: product.title,
            sellerMatch: product.sellerId === seller?.SellerProfile?.id,
            shippingEnabled: Boolean(
              product.delivery === 'SHIPPING' ||
                product.delivery === 'BOTH' ||
                product.fulfillmentOptions?.shipping,
            ),
            dims: {
              l: product.lengthCm,
              w: product.widthCm,
              h: product.heightCm,
              grams: product.weightGrams ?? Math.round((product.weightKg || 0) * 1000),
            },
            stock: product.stock,
            priceCents: product.priceCents,
          }
        : null,
    };

    if (!seller || !steve || !product) {
      report.error = 'Missing seller, buyer, or product';
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      throw new Error(report.error);
    }
    if (!report.steps.accounts.product.sellerMatch) {
      report.error = 'Product does not belong to authorized seller';
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      throw new Error(report.error);
    }

    // Recipient: prefer Steve saved shipping snapshot (profile lacks house number)
    const destSnapRaw = prior?.shippingAddressSnapshot;
    const destValidation = validateShippingAddressSnapshot(
      typeof destSnapRaw === 'string' ? JSON.parse(destSnapRaw) : destSnapRaw,
    );
    const profileSteve = analyzeLine(steve.address);
    report.steps.recipient = {
      source: destValidation.ok ? 'order_shipping_snapshot_HC-2026-0029' : 'profile',
      profileComplete: profileSteve.parseable && !!steve.postalCode && !!steve.city,
      snapshotValid: destValidation.ok,
      postalMasked: destValidation.ok
        ? maskPostal(destValidation.address.postalCode)
        : maskPostal(steve.postalCode),
      city: destValidation.ok ? destValidation.address.city : steve.city,
      country: destValidation.ok
        ? destValidation.address.country
        : (steve.country || '').toUpperCase(),
      phone: !!(destValidation.ok
        ? destValidation.address.phone || steve.phoneNumber
        : steve.phoneNumber),
      email: !!(destValidation.ok
        ? destValidation.address.email || steve.email
        : steve.email),
    };

    // Sender: seller profile address (parseable) or prior origin snapshot
    const originFromProfile = validateShippingAddressSnapshot({
      name: seller.name || 'Seller',
      addressLine: seller.address || '',
      postalCode: seller.postalCode || '',
      city: seller.city || '',
      country: seller.country || 'NL',
      email: seller.email || undefined,
      phone: seller.phoneNumber || undefined,
    });
    const originSnapRaw = prior?.shippingOriginSnapshot;
    const originFromSnap = originSnapRaw
      ? validateShippingAddressSnapshot(
          typeof originSnapRaw === 'string'
            ? JSON.parse(originSnapRaw)
            : originSnapRaw,
        )
      : { ok: false };
    const originValidation = originFromProfile.ok
      ? originFromProfile
      : originFromSnap;
    report.steps.sender = {
      source: originFromProfile.ok ? 'seller_profile' : 'order_origin_snapshot',
      valid: originValidation.ok,
      postalMasked: originValidation.ok
        ? maskPostal(originValidation.address.postalCode)
        : null,
      city: originValidation.ok ? originValidation.address.city : null,
      country: originValidation.ok ? originValidation.address.country : null,
      phone: !!(originValidation.ok && originValidation.address.phone),
      email: !!(originValidation.ok && originValidation.address.email),
      company: !!seller.SellerProfile?.companyName,
    };

    if (!destValidation.ok || !originValidation.ok) {
      report.RECIPIENT_ADDRESS_VALID = destValidation.ok;
      report.SENDER_ADDRESS_VALID = originValidation.ok;
      report.error = 'STOP: incomplete address — no label purchased';
      report.stoppedBeforePurchase = true;
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    report.RECIPIENT_ADDRESS_VALID = true;
    report.SENDER_ADDRESS_VALID = true;

    const grams = report.steps.accounts.product.dims.grams || 250;
    const l = product.lengthCm || 30;
    const w = product.widthCm || 20;
    const h = product.heightCm || 10;

    const before = await client.listShippingLabels({ page: 1, pageSize: 20 });
    report.steps.labelsBefore = before.ok
      ? {
          count: before.labels.length,
          withTracking: before.labels.filter((x) => x.trackingCode).length,
        }
      : { error: before.error, status: before.status };

    const products = await client.getShippingProducts({
      originCountry: originValidation.address.country,
      destinationCountry: destValidation.address.country,
      weightGrams: grams,
      lengthCm: l,
      widthCm: w,
      heightCm: h,
    });
    if (!products.ok) {
      report.error = `Quotes failed: ${products.status} ${products.code}`;
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      throw new Error(report.error);
    }

    const eligible = products.products
      .filter(
        (p) =>
          p.priceCents > 0 &&
          !/brievenbus|mailbox|address label/i.test(`${p.name} ${p.carrier}`),
      )
      // height 10cm → exclude mailbox-class if any slipped through
      .filter((p) => !(h > 3.5 && /brievenbus|mailbox/i.test(p.name)));
    eligible.sort((a, b) => a.priceCents - b.priceCents);
    const chosen = eligible[0];
    report.steps.quotes = {
      total: products.products.length,
      eligible: eligible.length,
      selected: chosen
        ? {
            shippingMethodId: chosen.shippingMethodId,
            productId: chosen.productId || null,
            carrier: chosen.carrier,
            name: chosen.name,
            priceCents: chosen.priceCents,
            currency: chosen.currency,
          }
        : null,
      parcel: { grams, l, w, h },
    };

    if (!chosen) {
      report.error = 'No eligible shipping products';
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      throw new Error(report.error);
    }

    // Cost safety: expect domestic NL parcel roughly under €25 for this size
    if (chosen.priceCents <= 0 || chosen.priceCents > 2500) {
      report.error = `Quote out of safety bounds: ${chosen.priceCents} cents`;
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      throw new Error(report.error);
    }

    const marketplaceOrderId = `HC-CERT-V2-${Date.now().toString(36).toUpperCase()}`;
    report.steps.marketplaceOrderId = marketplaceOrderId;

    const destAddr = {
      fullname: destValidation.address.name || steve.name || 'Steve',
      countryCode: destValidation.address.country,
      city: destValidation.address.city,
      postalCode: destValidation.address.postalCode,
      street: destValidation.address.street,
      houseNumber: destValidation.address.houseNumber,
      email: destValidation.address.email || steve.email || undefined,
      phone: destValidation.address.phone || seller.phoneNumber || undefined,
    };
    const fromAddr = {
      fullname: originValidation.address.name || seller.name || 'Seller',
      companyName: seller.SellerProfile?.companyName || undefined,
      countryCode: originValidation.address.country,
      city: originValidation.address.city,
      postalCode: originValidation.address.postalCode,
      street: originValidation.address.street,
      houseNumber: originValidation.address.houseNumber,
      email: originValidation.address.email || seller.email || undefined,
      phone: originValidation.address.phone || seller.phoneNumber || undefined,
    };

    // Payload shape check (no PII dump)
    const serializedDest = client.serializePartnerAddress(destAddr);
    const serializedFrom = client.serializePartnerAddress(fromAddr);
    report.steps.payloadShape = {
      destKeys: Object.keys(serializedDest).sort(),
      fromKeys: Object.keys(serializedFrom).sort(),
      hasLegacyAliases:
        'street' in serializedDest ||
        'houseNumber' in serializedDest ||
        'street' in serializedFrom ||
        'houseNumber' in serializedFrom,
    };

    console.log(
      JSON.stringify({
        phase: 'PRE_PURCHASE',
        carrier: chosen.carrier,
        service: chosen.name,
        priceCents: chosen.priceCents,
        marketplaceOrderId,
      }),
    );

    const created = await client.createPartnerLabel({
      shippingMethodId: chosen.shippingMethodId,
      productId: chosen.productId,
      carrier: chosen.carrier,
      weightGrams: grams,
      marketplaceOrderId,
      address: destAddr,
      fromAddress: fromAddr,
    });

    if (!created.ok) {
      report.REAL_LABEL_PURCHASED = false;
      report.labelPurchaseCount = 0;
      report.steps.create = {
        ok: false,
        status: created.status,
        code: created.code,
        error: String(created.error || '').slice(0, 240),
      };
      writeFileSync(OUT, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    report.labelPurchaseCount = 1;
    report.REAL_LABEL_PURCHASED = true;
    const label = created.label;
    const pdfUrl =
      typeof label.labelsExport === 'string'
        ? label.labelsExport
        : label.labelsExport &&
            typeof label.labelsExport === 'object' &&
            typeof label.labelsExport.url === 'string'
          ? label.labelsExport.url
          : null;

    report.steps.create = {
      ok: true,
      providerShipmentId: label.providerOrderId,
      trackingCodeSet: !!label.trackingCode,
      trackingLen: (label.trackingCode || '').length,
      trackingPrefix: (label.trackingCode || '').slice(0, 4),
      carrier: label.carrier || chosen.carrier,
      totalPrice: label.totalPrice ?? null,
      currency: label.currency || chosen.currency,
      trackingUrlSet: !!label.trackingUrl,
      trackingUrlAllowed: label.trackingUrl
        ? client.isAllowedEctaroDocumentUrl(label.trackingUrl)
        : null,
      pdfUrlSet: !!pdfUrl,
      pdfUrlAllowed: pdfUrl ? client.isAllowedEctaroDocumentUrl(pdfUrl) : null,
    };

    // Download check (HEAD/GET first bytes) without logging URL
    if (pdfUrl && client.isAllowedEctaroDocumentUrl(pdfUrl)) {
      try {
        const res = await fetch(pdfUrl, { method: 'GET' });
        const buf = Buffer.from(await res.arrayBuffer());
        const isPdf = buf.slice(0, 4).toString() === '%PDF';
        report.steps.download = {
          http: res.status,
          bytes: buf.length,
          isPdf,
        };
      } catch (e) {
        report.steps.download = {
          error: String(e?.message || e).slice(0, 160),
        };
      }
    } else {
      report.steps.download = { skipped: true, reason: 'no_allowed_pdf_url' };
    }

    // Idempotency: list after; do NOT create second label
    const after = await client.listShippingLabels({ page: 1, pageSize: 20 });
    report.steps.labelsAfter = after.ok
      ? {
          count: after.labels.length,
          withTracking: after.labels.filter((x) => x.trackingCode).length,
          delta:
            typeof report.steps.labelsBefore.count === 'number'
              ? after.labels.length - report.steps.labelsBefore.count
              : null,
          matchTracking: after.labels.some(
            (x) => x.trackingCode === label.trackingCode,
          ),
        }
      : { error: after.error };

    // Second create attempt intentionally NOT performed (AUTHORIZED_ADDITIONAL_LABELS=0)
    report.steps.idempotency = {
      secondCreateAttempted: false,
      reason: 'AUTHORIZED_ADDITIONAL_LABELS=0',
      listSeesTracking: report.steps.labelsAfter.matchTracking === true,
      priorOrderLabelUnchanged: prior?.shippingLabels?.[0]?.trackingNumber || null,
    };

    report.CARRIER = report.steps.create.carrier;
    report.SERVICE = chosen.name;
    report.QUOTED_LABEL_COST_CENTS = chosen.priceCents;
    report.PROVIDER_SHIPMENT_ID = label.providerOrderId;
    report.TRACKING_NUMBER_PRESENT = !!label.trackingCode;
    report.LABEL_CREATED = true;
    report.LABEL_DOWNLOAD =
      report.steps.download?.isPdf === true
        ? 'PASS'
        : report.steps.download?.skipped
          ? 'NO_URL'
          : 'FAIL';
    report.finishedAt = new Date().toISOString();
    writeFileSync(OUT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(String(e?.stack || e).slice(0, 800));
  process.exit(1);
});

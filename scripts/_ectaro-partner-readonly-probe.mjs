/**
 * Read-only EctaroShip Partner probe — quotes + list labels only.
 * Never creates labels. Never prints API keys or full addresses.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

async function loadClient() {
  // Prefer compiled-free TS via dynamic import of source through tsx registration.
  try {
    return await import('../lib/ectaroship/partner-client.ts');
  } catch {
    return await import('../lib/ectaroship/partner-client.js');
  }
}

async function main() {
  const client = await loadClient();
  const resolved =
    typeof client.resolveEctaroShipPartnerBaseUrl === 'function'
      ? client.resolveEctaroShipPartnerBaseUrl()
      : client.ECTAROSHIP_PARTNER_BASE_URL;
  console.log(
    JSON.stringify({
      configured: client.isEctaroShipConfigured(),
      envBaseHost: String(process.env.ECTAROSHIP_API_BASE_URL || '')
        .replace(/^https?:\/\//, '')
        .slice(0, 48),
      resolvedBaseHost: String(resolved || '')
        .replace(/^https?:\/\//, '')
        .slice(0, 48),
    }),
  );

  const products = await client.getShippingProducts({
    originCountry: 'NL',
    destinationCountry: 'NL',
    weightGrams: 850,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
  });
  if (!products.ok) {
    console.log(
      JSON.stringify({
        quotes: 'FAIL',
        status: products.status,
        code: products.code,
        error: String(products.error || '').slice(0, 160),
      }),
    );
  } else {
    const billable = products.products.filter(
      (p) =>
        p.priceCents > 0 &&
        !/brievenbus|mailbox|address label/i.test(`${p.name} ${p.carrier}`),
    );
    console.log(
      JSON.stringify({
        quotes: 'PASS',
        count: products.products.length,
        billable: billable.length,
        sample: billable.slice(0, 3).map((p) => ({
          id: p.shippingMethodId,
          productId: p.productId || null,
          carrier: p.carrier,
          name: p.name,
          cents: p.priceCents,
        })),
      }),
    );
  }

  const listed = await client.listShippingLabels({ page: 1, pageSize: 10 });
  if (!listed.ok) {
    console.log(
      JSON.stringify({
        list: 'FAIL',
        status: listed.status,
        code: listed.code,
        error: String(listed.error || '').slice(0, 160),
      }),
    );
  } else {
    console.log(
      JSON.stringify({
        list: 'PASS',
        count: listed.labels.length,
        withTracking: listed.labels.filter((l) => l.trackingCode).length,
        statuses: [
          ...new Set(listed.labels.map((l) => l.statusRaw).filter(Boolean)),
        ].slice(0, 8),
      }),
    );
  }

  const shape = client.serializePartnerAddress({
    fullname: 'Probe Buyer',
    countryCode: 'NL',
    city: 'Amsterdam',
    postalCode: '1025 XL',
    street: 'Buikslotermeerplein',
    houseNumber: '200',
    email: 'probe@example.com',
    phone: '+31600000000',
  });
  console.log(
    JSON.stringify({
      addrKeys: Object.keys(shape).sort(),
      postalCode: shape.postalCode,
      hasLegacyAliases:
        'street' in shape || 'houseNumber' in shape || 'zip' in shape,
      houseNoSet: Boolean(shape.houseNo),
      addressSet: Boolean(shape.address),
    }),
  );
}

main().catch((e) => {
  console.error(String(e?.stack || e).slice(0, 500));
  process.exit(1);
});

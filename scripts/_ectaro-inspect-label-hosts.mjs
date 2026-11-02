import { readFileSync } from 'node:fs';

const client = await import('../lib/ectaroship/partner-client.ts');
const cert = JSON.parse(readFileSync('/tmp/ectaro-real-label-cert-v2.json', 'utf8'));
const prefix = cert.steps.create.trackingPrefix;
const listed = await client.listShippingLabels({ page: 1, pageSize: 20 });
if (!listed.ok) {
  console.log(JSON.stringify(listed));
  process.exit(1);
}
const row =
  listed.labels.find((l) => (l.trackingCode || '').startsWith(prefix)) ||
  listed.labels.find((l) => String(l.providerOrderId) === String(cert.PROVIDER_SHIPMENT_ID)) ||
  listed.labels[0];

function hostOf(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
}

const raw = row.raw || {};
const urlCandidates = [];
for (const [k, v] of Object.entries(raw)) {
  if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
    urlCandidates.push({
      k,
      host: hostOf(v),
      allowed: client.isAllowedEctaroDocumentUrl(v),
    });
  }
  if (v && typeof v === 'object' && typeof v.url === 'string') {
    urlCandidates.push({
      k: `${k}.url`,
      host: hostOf(v.url),
      allowed: client.isAllowedEctaroDocumentUrl(v.url),
    });
  }
}

console.log(
  JSON.stringify(
    {
      trackingLen: (row.trackingCode || '').length,
      status: row.statusRaw,
      carrier: row.carrier,
      cost: row.totalPrice,
      providerOrderIdSet: !!row.providerOrderId,
      trackingUrlHost: hostOf(row.trackingUrl || ''),
      trackingUrlAllowed: row.trackingUrl
        ? client.isAllowedEctaroDocumentUrl(row.trackingUrl)
        : null,
      rawKeys: Object.keys(raw).slice(0, 50),
      urlCandidates,
    },
    null,
    2,
  ),
);

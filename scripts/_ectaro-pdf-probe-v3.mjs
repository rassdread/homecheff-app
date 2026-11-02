/**
 * Read-only probe for Partner label document retrieval (no label create).
 */
const client = await import('../lib/ectaroship/partner-client.ts');
const base = client.resolveEctaroShipPartnerBaseUrl();
const key = process.env.ECTAROSHIP_API_KEY;
const headers = { 'Api-Key': key, Accept: 'application/json' };
const id = '2179330';

function hostOf(u) {
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
}

function collectHosts(o, hosts = new Set(), depth = 0) {
  if (!o || depth > 5) return hosts;
  if (typeof o === 'string' && /^https?:\/\//i.test(o)) {
    const h = hostOf(o);
    if (h) hosts.add(h);
  } else if (Array.isArray(o)) {
    for (const x of o.slice(0, 30)) collectHosts(x, hosts, depth + 1);
  } else if (typeof o === 'object') {
    for (const x of Object.values(o).slice(0, 50)) collectHosts(x, hosts, depth + 1);
  }
  return hosts;
}

async function probe(path, init = { method: 'GET', headers }) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = { rawType: text.slice(0, 8) === '%PDF' ? 'pdf' : 'text', preview: text.slice(0, 80) };
    }
    return {
      path,
      method: init.method || 'GET',
      status: res.status,
      contentType: res.headers.get('content-type'),
      keys:
        body && typeof body === 'object' && !body.rawType
          ? Object.keys(body).slice(0, 30)
          : [],
      hosts: [...collectHosts(body)],
      isPdfBody: text.slice(0, 4) === '%PDF',
      len: text.length,
    };
  } catch (e) {
    return { path, error: String(e?.message || e).slice(0, 160) };
  }
}

const listed = await client.listShippingLabels({ page: 1, pageSize: 20 });
const match = listed.ok
  ? listed.labels.find((l) => String(l.providerOrderId) === id) ||
    listed.labels.find((l) => (l.raw?.channelOrderId && String(l.raw.channelOrderId).includes('CERT-V2')))
  : null;

const probes = [];
for (const p of [
  `/api/v1/shipping/label/${id}`,
  `/api/v1/shipping/labels/${id}`,
  `/api/v1/shipping/label?orderId=${id}`,
  `/api/v1/shipping/label?id=${id}`,
  `/api/v1/shipping/shipment/${id}`,
  `/api/v1/shipping/label/${id}/pdf`,
  `/api/v1/shipping/label/${id}/document`,
  `/api/v1/shipping/label/pdf?orderId=${id}`,
  `/api/v1/shipping/label/download?orderId=${id}`,
  `/api/v1/shipping/documents/${id}`,
]) {
  probes.push(await probe(p));
}

// Also try POST document fetch variants without creating a label
probes.push(
  await probe(`/api/v1/shipping/label/export`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', 'X-Api-Behavior': 'STRICT' },
    body: JSON.stringify({ orderId: id }),
  }),
);
probes.push(
  await probe(`/api/v1/shipping/label/pdf`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', 'X-Api-Behavior': 'STRICT' },
    body: JSON.stringify({ orderId: id }),
  }),
);

console.log(
  JSON.stringify(
    {
      base,
      listOk: listed.ok,
      match: match
        ? {
            providerOrderId: match.providerOrderId,
            trackingSet: !!match.trackingCode,
            trackingLen: (match.trackingCode || '').length,
            status: match.statusRaw,
            carrier: match.carrier,
            cost: match.totalPrice,
            rawKeys: Object.keys(match.raw || {}),
            hosts: [...collectHosts(match.raw || {})],
          }
        : null,
      probes,
    },
    null,
    2,
  ),
);

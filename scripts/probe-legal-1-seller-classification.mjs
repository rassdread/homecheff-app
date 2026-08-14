/**
 * LEGAL-1 browser/API smoke (read-mostly + auth-free checks).
 * Does not place real orders / change Stripe.
 *
 *   BASE_URL=https://homecheff.eu node scripts/probe-legal-1-seller-classification.mjs
 */
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function check(name, fn) {
  try {
    await fn();
    console.log('PASS', name);
    return true;
  } catch (e) {
    console.error('FAIL', name, e?.message || e);
    return false;
  }
}

const results = [];

results.push(
  await check('homepage 200', async () => {
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error(`status ${res.status}`);
  }),
);

results.push(
  await check('feed API unchanged shape', async () => {
    const res = await fetch(`${BASE}/api/feed?limit=3`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const items = data.items || data.products || data.dishes || [];
    if (!Array.isArray(items)) throw new Error('no items array');
    const sample = items[0];
    if (sample?.seller && 'reviewReasons' in (sample.seller || {})) {
      throw new Error('reviewReasons leaked on feed seller');
    }
    if (sample?.seller && 'commerceReviewState' in (sample.seller || {})) {
      throw new Error('commerceReviewState leaked on feed');
    }
  }),
);

results.push(
  await check('commerce-declaration requires auth', async () => {
    const res = await fetch(`${BASE}/api/seller/commerce-declaration`);
    if (res.status !== 401) throw new Error(`expected 401 got ${res.status}`);
  }),
);

results.push(
  await check('terms unchanged version stamp', async () => {
    const res = await fetch(`${BASE}/terms`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!html.includes('1.0')) throw new Error('missing version 1.0');
  }),
);

const ok = results.every(Boolean);
console.log(ok ? 'LEGAL-1 probe: OK' : 'LEGAL-1 probe: FAIL');
process.exit(ok ? 0 : 1);

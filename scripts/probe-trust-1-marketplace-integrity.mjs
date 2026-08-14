/**
 * TRUST-1 production smoke (guest).
 * BASE_URL=https://homecheff.eu node scripts/probe-trust-1-marketplace-integrity.mjs
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
  await check('homepage', async () => {
    if (!(await fetch(`${BASE}/`)).ok) throw new Error('homepage');
  }),
);
results.push(
  await check('feed 200', async () => {
    const res = await fetch(`${BASE}/api/feed?limit=5`);
    if (!res.ok) throw new Error(String(res.status));
  }),
);
results.push(
  await check('integrity report requires auth', async () => {
    const res = await fetch(`${BASE}/api/products/x/integrity-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'OTHER' }),
    });
    if (res.status !== 401 && res.status !== 404) {
      throw new Error(`expected 401/404 got ${res.status}`);
    }
  }),
);

const ok = results.every(Boolean);
console.log(ok ? 'TRUST-1 probe: OK' : 'TRUST-1 probe: FAIL');
process.exit(ok ? 0 : 1);

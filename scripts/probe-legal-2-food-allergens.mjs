/**
 * LEGAL-2 production smoke (guest).
 * BASE_URL=https://homecheff.eu node scripts/probe-legal-2-food-allergens.mjs
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
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error(String(res.status));
  }),
);
results.push(
  await check('feed no allergen payload leak', async () => {
    const res = await fetch(`${BASE}/api/feed?limit=5`);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const blob = JSON.stringify(data);
    if (blob.includes('allergensConfirmedAt')) {
      throw new Error('allergensConfirmedAt on feed');
    }
  }),
);
results.push(
  await check('terms still 1.0', async () => {
    const html = await (await fetch(`${BASE}/terms`)).text();
    if (!html.includes('1.0')) throw new Error('missing version');
  }),
);

const ok = results.every(Boolean);
console.log(ok ? 'LEGAL-2 probe: OK' : 'LEGAL-2 probe: FAIL');
process.exit(ok ? 0 : 1);

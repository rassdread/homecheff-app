/**
 * Phase A P0 containment — Marketplace security fixes.
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyEctaroShipWebhookSignature } from '../ectaroship-webhook-auth';
import { validateVideoProxyUrl } from '../video-proxy-url';

function ok(msg: string) {
  console.log('  ✓', msg);
}

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

// --- MP-003 / test-stripe deleted ---
{
  assert.equal(existsSync(resolve(process.cwd(), 'app/api/test-stripe/route.ts')), false);
  ok('test-stripe route removed');
  assert.equal(existsSync(resolve(process.cwd(), 'app/api/test-products/route.ts')), false);
  ok('test-products route removed (same-class)');
}

// --- MP-020 debug-session Production 404 ---
{
  const src = read('app/api/debug-session/route.ts');
  assert.match(src, /status:\s*404/);
  assert.match(src, /VERCEL_ENV|isDeployedEnvironment/);
  assert.doesNotMatch(src, /NEXTAUTH_SECRET.*gezet/);
  assert.doesNotMatch(src, /cookieNames/);
  ok('debug-session Production returns 404 without config leak');
}

// --- MP-001 EctaroShip fail-closed ---
{
  const payload = JSON.stringify({ type: 'shipment.delivered', shipment_id: 'x' });
  const secret = 'test-ectaro-webhook-secret';

  const missingSecret = verifyEctaroShipWebhookSignature(payload, 'abc', '');
  assert.equal(missingSecret.ok, false);
  if (!missingSecret.ok) assert.equal(missingSecret.reason, 'missing_secret');
  ok('missing secret → reject');

  const missingSig = verifyEctaroShipWebhookSignature(payload, '', secret);
  assert.equal(missingSig.ok, false);
  if (!missingSig.ok) assert.equal(missingSig.reason, 'missing_signature');
  ok('missing signature → reject');

  const bad = verifyEctaroShipWebhookSignature(payload, 'deadbeef', secret);
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.reason, 'invalid_signature');
  ok('invalid signature → reject');

  const goodHex = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const good = verifyEctaroShipWebhookSignature(payload, goodHex, secret);
  assert.equal(good.ok, true);
  ok('valid signature → accepted');

  const prefixed = verifyEctaroShipWebhookSignature(payload, `sha256=${goodHex}`, secret);
  assert.equal(prefixed.ok, true);
  ok('sha256= prefixed signature accepted');

  const route = read('app/api/webhooks/ectaroship/route.ts');
  assert.match(route, /verifyEctaroShipWebhookSignature/);
  assert.match(route, /401/);
  assert.match(route, /503/);
  assert.doesNotMatch(route, /Continue anyway/);
  ok('webhook route fail-closed before side effects');
}

// --- MP-002 video-proxy SSRF ---
{
  const cases: Array<{ url: string; expectOk: boolean; note: string }> = [
    { url: 'https://127.0.0.1/x', expectOk: false, note: '127.0.0.1' },
    { url: 'https://localhost/x', expectOk: false, note: 'localhost' },
    { url: 'https://169.254.169.254/latest/meta-data', expectOk: false, note: 'metadata IP' },
    { url: 'https://10.0.0.1/x', expectOk: false, note: '10.x' },
    { url: 'https://172.16.0.1/x', expectOk: false, note: '172.16' },
    { url: 'https://192.168.1.1/x', expectOk: false, note: '192.168' },
    { url: 'https://[::1]/x', expectOk: false, note: 'IPv6 loopback' },
    {
      url: 'https://evil.com/?u=blob.vercel-storage.com',
      expectOk: false,
      note: 'substring spoof query',
    },
    {
      url: 'https://blob.vercel-storage.com.evil.com/x',
      expectOk: false,
      note: 'allowed-host.evil.com',
    },
    {
      url: 'https://notblob.vercel-storage.com.attacker.tld/x',
      expectOk: false,
      note: 'suffix spoof',
    },
    { url: 'http://abc.public.blob.vercel-storage.com/v.mp4', expectOk: false, note: 'http rejected' },
    {
      url: 'https://user:pass@abc.public.blob.vercel-storage.com/v.mp4',
      expectOk: false,
      note: 'userinfo rejected',
    },
    {
      url: 'https://abc.public.blob.vercel-storage.com/videos/demo.mp4',
      expectOk: true,
      note: 'legitimate public blob',
    },
    {
      url: 'https://xyz.blob.vercel-storage.com/file.mp4',
      expectOk: true,
      note: 'legitimate blob host',
    },
  ];

  for (const c of cases) {
    const r = validateVideoProxyUrl(c.url);
    assert.equal(r.ok, c.expectOk, c.note);
  }
  ok('SSRF matrix blocks private/spoofed hosts');

  const legit = validateVideoProxyUrl(
    'https://abc.public.blob.vercel-storage.com/videos/demo.mp4'
  );
  assert.equal(legit.ok, true);
  if (legit.ok) assert.equal(legit.mayAttachBlobCredential, true);
  ok('legitimate media URL may attach blob credential');

  const proxy = read('app/api/video-proxy/route.ts');
  assert.match(proxy, /validateVideoProxyUrl/);
  assert.match(proxy, /redirect:\s*['"]error['"]/);
  assert.doesNotMatch(proxy, /NEXT_PUBLIC_VERCEL_BLOB/);
  assert.match(proxy, /mayAttachBlobCredential/);
  ok('video-proxy uses strict validation + redirect:error + no NEXT_PUBLIC token');
}

console.log('\nPhase A P0 containment tests: PASS');

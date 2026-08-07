/**
 * HOMECHEFF — Contact form anti-spam validator
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkHoneypot, CONTACT_HONEYPOT_FIELD } from '../lib/contact-security/honeypot';
import {
  checkFormTiming,
  TIMING_HARD_REJECT_MS,
} from '../lib/contact-security/timing';
import {
  checkContactRateLimit,
  __resetContactRateLimitStoreForTests,
} from '../lib/contact-security/rate-limit';
import { validateContactEmail } from '../lib/contact-security/email-validation';
import {
  scoreContactSpam,
  SPAM_SCORE_REJECT_THRESHOLD,
} from '../lib/contact-security/spam-score';
import { escapeHtml } from '../lib/contact-security/escape-html';
import { NextRequest } from 'next/server';

const ROOT = process.cwd();

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function mockReq(ip = '203.0.113.10'): NextRequest {
  return new NextRequest('https://homecheff.eu/api/contact', {
    method: 'POST',
    headers: {
      'cf-connecting-ip': ip,
      'user-agent': 'validator',
    },
  });
}

section('Honeypot');
assert.equal(checkHoneypot('').ok, true);
assert.equal(checkHoneypot(null).ok, true);
assert.equal(checkHoneypot('http://spam').ok, false);
assert.equal(CONTACT_HONEYPOT_FIELD, 'company_website');
console.log('OK honeypot');

section('Timing');
{
  const now = Date.now();
  const tooFast = checkFormTiming({ formStartedAt: now - 100, now });
  assert.equal(tooFast.ok, false);
  if (!tooFast.ok) assert.equal(tooFast.reason, 'TIMING_TOO_FAST');
  const ok = checkFormTiming({ formStartedAt: now - 3000, now });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.softPenalty, false);
  const soft = checkFormTiming({ formStartedAt: now - 800, now });
  assert.equal(soft.ok, true);
  if (soft.ok) assert.equal(soft.softPenalty, true);
  assert.ok(TIMING_HARD_REJECT_MS === 500);
  console.log('OK timing gates');
}

section('Rate limit');
{
  __resetContactRateLimitStoreForTests();
  const req = mockReq('198.51.100.1');
  const t0 = Date.now();
  assert.equal(checkContactRateLimit(req, t0).allowed, true);
  assert.equal(checkContactRateLimit(req, t0 + 1).allowed, true);
  assert.equal(checkContactRateLimit(req, t0 + 2).allowed, true);
  const burst = checkContactRateLimit(req, t0 + 3);
  assert.equal(burst.allowed, false);
  if (!burst.allowed) assert.equal(burst.reason, 'RATE_LIMIT');

  __resetContactRateLimitStoreForTests();
  const req2 = mockReq('198.51.100.9');
  let allowed = 0;
  for (let i = 0; i < 5; i++) {
    const r = checkContactRateLimit(req2, t0 + i * 61_000);
    if (r.allowed) allowed += 1;
  }
  assert.equal(allowed, 5);
  const hourBlock = checkContactRateLimit(req2, t0 + 5 * 61_000);
  assert.equal(hourBlock.allowed, false);
  if (!hourBlock.allowed) {
    assert.equal(hourBlock.reason, 'RATE_LIMIT');
    assert.ok((hourBlock.retryAfterSec || 0) > 0);
  }
  const other = checkContactRateLimit(mockReq('198.51.100.2'), t0);
  assert.equal(other.allowed, true);
  console.log('OK rate limit burst + 5/hour + Retry-After');
}

section('Email validation');
assert.equal(validateContactEmail('user@gmail.com').ok, true);
assert.equal(validateContactEmail('bad').ok, false);
assert.equal(validateContactEmail('a@mailinator.com').ok, false);
assert.equal(validateContactEmail('x@yopmail.com').ok, false);
console.log('OK email + disposable');

section('Spam scoring');
{
  const legit = scoreContactSpam({
    name: 'Sergio Arrias',
    email: 'sergio@homecheff.eu',
    subject: 'general',
    message:
      'Hallo, ik heb een vraag over mijn abonnement en hoe ik mijn gegevens kan wijzigen. Alvast bedankt!',
  });
  assert.equal(legit.reject, false, `legit score=${legit.score}`);

  const spam = scoreContactSpam({
    name: 'xqzmtplkjhwvbnm',
    email: 'abcdefghijklmnopqr@gmail.com',
    subject: 'other',
    message: 'crypto casino viagra http://a.com http://b.com xqzmtplkjhwvbnm',
    softTimingPenalty: true,
  });
  assert.ok(spam.score >= SPAM_SCORE_REJECT_THRESHOLD, `spam score=${spam.score}`);
  assert.equal(spam.reject, true);
  console.log('OK spam score threshold');
}

section('HTML escape');
assert.equal(escapeHtml('<script>').includes('&lt;script&gt;'), true);
console.log('OK escapeHtml');

section('Source wiring');
{
  const files = [
    'app/api/contact/route.ts',
    'app/contact/page.tsx',
    'lib/contact-security/evaluate.ts',
    'lib/contact-security/turnstile.ts',
    'app/api/admin/contact-security-metrics/route.ts',
    'components/contact/ContactTurnstile.tsx',
  ];
  for (const f of files) {
    assert.ok(existsSync(join(ROOT, f)), `missing ${f}`);
  }
  const api = readFileSync(join(ROOT, 'app/api/contact/route.ts'), 'utf8');
  assert.ok(api.includes('evaluateContactSubmission'));
  assert.ok(api.includes('escapeHtml'));
  assert.ok(api.includes('Retry-After') || api.includes('retryAfterSec'));
  const page = readFileSync(join(ROOT, 'app/contact/page.tsx'), 'utf8');
  assert.ok(page.includes('CONTACT_HONEYPOT_FIELD'));
  assert.ok(page.includes('formStartedAt'));
  assert.ok(page.includes('ContactTurnstile'));
  console.log('OK contact pipeline wired');
}

console.log('\nHOMECHEFF_CONTACT_SECURITY_VALIDATOR_PASS');

/**
 * Regression: delivery signup auto-login must use the credentials field
 * emailOrUsername. Registration must not verify the courier or open payout.
 *
 * Run: npx tsx --test lib/delivery/delivery-registration-signin.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  assertCommercialCourierCanReceivePayout,
  assertDelivererCanAccept,
  isCommerciallyMatchableDeliverer,
} from './delivery-eligibility';

const root = path.resolve(__dirname, '../..');

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function credentialsBlock(source: string) {
  const start = source.indexOf("signIn('credentials'");
  assert.ok(start >= 0, 'credentials signIn call missing');
  return source.slice(start, start + 350);
}

const freshProfile = {
  id: 'dp_fresh',
  userId: 'user_fresh',
  isVerified: false,
  isActive: true,
  age: 30,
  isBlocked: false,
  user: { dateOfBirth: null, id: 'user_fresh' },
};

describe('delivery registration auto-login payload', () => {
  it('A: independent signup sends emailOrUsername', () => {
    const block = credentialsBlock(read('app/delivery/signup/page.tsx'));
    assert.match(block, /emailOrUsername:\s*formData\.email/);
    assert.doesNotMatch(block, /\bemail:\s*formData\.email/);
    assert.match(block, /password:\s*formData\.password/);
    assert.match(block, /redirect:\s*false/);
    const page = read('app/delivery/signup/page.tsx');
    assert.match(page, /homecheff_pending_intent_v1/);
    assert.match(page, /markSameTabCredentialNavigation\(\)/);
    assert.match(
      page,
      /window\.location\.assign\('\/delivery\/dashboard\?welcome=true&newSignup=true'\)/
    );
  });

  it('B: business signup sends emailOrUsername', () => {
    const block = credentialsBlock(read('app/delivery/company/signup/page.tsx'));
    assert.match(block, /emailOrUsername:\s*form\.email/);
    assert.doesNotMatch(block, /\bemail:\s*form\.email/);
    assert.match(block, /password:\s*form\.password/);
    assert.match(block, /redirect:\s*false/);
    const page = read('app/delivery/company/signup/page.tsx');
    assert.match(page, /homecheff_pending_intent_v1/);
    assert.match(page, /markSameTabCredentialNavigation\(\)/);
    assert.match(
      page,
      /window\.location\.assign\('\/delivery\/company\/dashboard\?welcome=true&newSignup=true'\)/
    );
  });

  it('C: credentials provider still requires emailOrUsername and password', () => {
    const auth = read('lib/auth.ts');
    assert.match(auth, /emailOrUsername:\s*\{\s*label:/);
    assert.match(
      auth,
      /if\s*\(!credentials\?\.emailOrUsername\s*\|\|\s*!credentials\?\.password\)/
    );
    const login = credentialsBlock(read('app/login/page.tsx').replace(
      'signIn("credentials"',
      "signIn('credentials'"
    ));
    assert.match(login, /emailOrUsername:\s*state\.emailOrUsername/);
  });

  it('D: missing login field is rejected before a user lookup', () => {
    const auth = read('lib/auth.ts');
    const authorize = auth.indexOf('async authorize(credentials)');
    assert.ok(authorize > 0);
    const body = auth.slice(authorize, authorize + 2500);
    const guard = body.indexOf(
      'if (!credentials?.emailOrUsername || !credentials?.password)'
    );
    const lookup = body.indexOf('findUserByCanonicalEmail');
    assert.ok(guard > 0);
    assert.ok(lookup > guard);
    assert.match(body.slice(guard, guard + 180), /return null/);
  });

  it('I: marketplace registration still sends emailOrUsername', () => {
    const register = read('app/register/page.tsx');
    const start = register.indexOf('signIn("credentials"');
    assert.ok(start >= 0);
    const block = register.slice(start, start + 250);
    assert.match(block, /emailOrUsername:\s*state\.email/);
    assert.doesNotMatch(block, /\bemail:\s*state\.email/);
    assert.doesNotMatch(register, /markSameTabCredentialNavigation/);
  });
});

describe('registration does not grant courier privileges', () => {
  it('E: new profile data leaves verification at the schema default', () => {
    const service = read('lib/delivery/delivery-signup-service.ts');
    const start = service.indexOf('function profileCreateData');
    const end = service.indexOf('function ensureBusinessForUser');
    const body = service.slice(start, end);
    assert.match(body, /isActive:\s*true/);
    assert.doesNotMatch(body, /isVerified/);
    const schema = read('prisma/schema.prisma');
    const model = schema.slice(schema.indexOf('model DeliveryProfile'));
    assert.match(model.slice(0, 1200), /isVerified\s+Boolean\s+@default\(false\)/);
    const userCreate = service.slice(service.indexOf('tx.user.create'));
    assert.doesNotMatch(userCreate.slice(0, 900), /dateOfBirth/);
    assert.doesNotMatch(userCreate.slice(0, 900), /stripeConnect/);
  });

  it('F: an unverified courier cannot accept an assignment', () => {
    const result = assertDelivererCanAccept(freshProfile, {
      dateOfBirth: '1990-01-01',
      ageGateEnabled: true,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, 'DELIVERY_NOT_VERIFIED');
    assert.equal(result.status, 403);
    assert.equal(
      isCommerciallyMatchableDeliverer({
        isActive: true,
        isVerified: false,
        isBlocked: false,
        dateOfBirth: '1990-01-01',
        profileAge: 30,
        ageGateEnabled: true,
      }),
      false
    );
  });

  it('G: signup does not start Stripe Connect', () => {
    const service = read('lib/delivery/delivery-signup-service.ts');
    const independent = read('app/delivery/signup/page.tsx');
    const business = read('app/delivery/company/signup/page.tsx');
    for (const source of [service, independent, business]) {
      assert.doesNotMatch(source, /stripe\.accounts|accountLinks|stripeConnect/i);
    }
  });

  it('H: registration state is not payout-eligible', () => {
    const payout = assertCommercialCourierCanReceivePayout({
      profile: freshProfile,
      dateOfBirth: null,
      ageGateEnabled: true,
    });
    assert.equal(payout.ok, false);
    if (payout.ok) return;
    assert.equal(payout.code, 'DELIVERY_DOB_REQUIRED');
    const payable = read('lib/delivery/courier-payable.ts');
    assert.match(payable, /COURIER_CONNECT_REQUIRED|courierPayoutReady/);
  });
});

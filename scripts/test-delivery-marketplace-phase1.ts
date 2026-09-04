/**
 * Phase 1 delivery alignment unit tests (no DB).
 * Run: npx tsx scripts/test-delivery-marketplace-phase1.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_MIN_AGE,
  resolveCommercialDeliveryAgeYears,
} from '../lib/delivery/delivery-age';
import {
  assertCommercialCourierAgeForActivation,
  assertCommercialCourierCanReceivePayout,
  assertDelivererCanAccept,
  isCommerciallyMatchableDeliverer,
} from '../lib/delivery/delivery-eligibility';
import {
  isLocalProviderCheckoutSelection,
  normalizeFulfillmentInput,
  outboundLocalProviderMode,
} from '../lib/delivery/delivery-fulfillment-vocabulary';
import { readDeliveryAlignmentFlags } from '../lib/delivery/delivery-alignment-flags';

const ROOT = path.join(__dirname, '..');

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const noon = (isoDate: string) => new Date(`${isoDate}T12:00:00.000Z`);

test('turns 18 today is eligible', () => {
  const now = noon('2026-08-04');
  const dob = noon('2008-08-04');
  const age = calculateAgeFromDob(dob, now);
  assert.equal(age.ok && age.ageYears, 18);
  assert.equal(
    resolveCommercialDeliveryAgeYears({
      dateOfBirth: dob,
      ageGateEnabled: true,
      now,
    }).eligible,
    true
  );
});

test('turns 18 tomorrow is underage', () => {
  const now = noon('2026-08-04');
  const dob = noon('2008-08-05');
  const age = calculateAgeFromDob(dob, now);
  assert.equal(age.ok && age.ageYears, 17);
  assert.equal(
    resolveCommercialDeliveryAgeYears({
      dateOfBirth: dob,
      ageGateEnabled: true,
      now,
    }).eligible,
    false
  );
});

test('turned 18 yesterday is eligible', () => {
  const now = noon('2026-08-04');
  const dob = noon('2008-08-03');
  assert.equal(
    resolveCommercialDeliveryAgeYears({
      dateOfBirth: dob,
      ageGateEnabled: true,
      now,
    }).eligible,
    true
  );
});

test('leap-day birthday age calc', () => {
  const now = noon('2025-03-01');
  const dob = noon('2008-02-29');
  const age = calculateAgeFromDob(dob, now);
  assert.equal(age.ok, true);
  if (age.ok) assert.equal(age.ageYears, 17);
});

test('missing DOB fails closed when gate on', () => {
  const r = resolveCommercialDeliveryAgeYears({
    dateOfBirth: null,
    profileAge: 20,
    ageGateEnabled: true,
  });
  assert.equal(r.eligible, false);
  assert.equal(r.reason, 'MISSING_DOB');
});

test('invalid DOB fails closed', () => {
  const r = calculateAgeFromDob('not-a-date');
  assert.equal(r.ok, false);
});

test('17y 364d cannot activate', () => {
  const now = noon('2026-08-04');
  const dob = noon('2008-08-05');
  const gate = assertCommercialCourierAgeForActivation({
    dateOfBirth: dob,
    claimedAge: 17,
    now,
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, false);
});

test('claimed age 17 blocked even without DOB at signup', () => {
  const gate = assertCommercialCourierAgeForActivation({
    dateOfBirth: null,
    claimedAge: 17,
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, false);
});

test('claimed age 18 allowed at signup without DOB', () => {
  const gate = assertCommercialCourierAgeForActivation({
    dateOfBirth: null,
    claimedAge: 18,
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, true);
});

test('under-18 active profile excluded from matching', () => {
  const now = noon('2026-08-04');
  assert.equal(
    isCommerciallyMatchableDeliverer({
      isActive: true,
      isVerified: true,
      dateOfBirth: noon('2009-01-01'),
      now,
      ageGateEnabled: true,
    }),
    false
  );
});

test('zero-price does not bypass age gate on accept', () => {
  const profile = {
    id: 'p1',
    userId: 'u1',
    isActive: true,
    isVerified: true,
    age: 17,
    user: { dateOfBirth: noon('2009-01-01') },
  };
  const gate = assertDelivererCanAccept(profile, {
    dateOfBirth: profile.user.dateOfBirth,
    now: noon('2026-08-04'),
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, false);
  // fee irrelevant — gate is age-only
  assert.equal(COMMERCIAL_DELIVERY_MIN_AGE, 18);
});

test('under-18 payout blocked', () => {
  const profile = {
    id: 'p1',
    userId: 'u1',
    isActive: true,
    isVerified: true,
    age: 17,
    user: { dateOfBirth: noon('2009-01-01') },
  };
  const gate = assertCommercialCourierCanReceivePayout({
    profile,
    dateOfBirth: profile.user.dateOfBirth,
    now: noon('2026-08-04'),
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, false);
});

test('TEEN_DELIVERY normalizes to LOCAL_PROVIDER without display teen', () => {
  const n = normalizeFulfillmentInput('TEEN_DELIVERY');
  assert.equal(n.canonical, 'LOCAL_PROVIDER');
  assert.equal(n.normalizedFromLegacyTeen, true);
  assert.equal(n.prismaDeliveryMode, 'DELIVERY');
  assert.equal(outboundLocalProviderMode(), 'LOCAL_PROVIDER');
  assert.notEqual(outboundLocalProviderMode(), 'TEEN_DELIVERY');
});

test('teen_delivery checkout selection maps as local provider', () => {
  assert.equal(isLocalProviderCheckoutSelection('teen_delivery'), true);
  assert.equal(isLocalProviderCheckoutSelection('local_provider'), true);
  assert.equal(isLocalProviderCheckoutSelection('local_delivery'), false);
});

test('LOCAL_DELIVERY maps to seller delivery', () => {
  const n = normalizeFulfillmentInput('LOCAL_DELIVERY');
  assert.equal(n.canonical, 'SELLER_DELIVERY');
});

test('flag parsing deterministic fail-closed defaults', () => {
  const flags = readDeliveryAlignmentFlags({});
  assert.equal(flags.commercialAgeGate18Enabled, true);
  assert.equal(flags.namedProviderCopyEnabled, true);
  assert.equal(flags.providerPricingEnabled, true);
  assert.equal(flags.namedProviderSelectionEnabled, true);
  assert.equal(flags.businessProfilesEnabled, true);
  assert.equal(flags.firstAcceptPoolConfiguredDefault, false);
  assert.equal(flags.firstAcceptPoolRuntimeEnabled, false); // unset → named selection SSOT

  const disabled = readDeliveryAlignmentFlags({
    DELIVERY_COMMERCIAL_AGE_GATE_18_ENABLED: 'false',
    DELIVERY_FIRST_ACCEPT_POOL_ENABLED: 'false',
  });
  assert.equal(disabled.commercialAgeGate18Enabled, false);
  assert.equal(disabled.firstAcceptPoolRuntimeEnabled, false);

  const junk = readDeliveryAlignmentFlags({
    DELIVERY_PROVIDER_PRICING_ENABLED: 'yesplease',
  });
  assert.equal(junk.providerPricingEnabled, false);
});

test('adult eligible deliverer can accept', () => {
  const profile = {
    id: 'p1',
    userId: 'u1',
    isActive: true,
    isVerified: true,
    age: 22,
    user: { dateOfBirth: noon('2000-01-01') },
  };
  const gate = assertDelivererCanAccept(profile, {
    dateOfBirth: profile.user.dateOfBirth,
    now: noon('2026-08-04'),
    ageGateEnabled: true,
  });
  assert.equal(gate.ok, true);
});

test('profile PUT path rejects legacy 15–25 band (commercial 18+)', () => {
  const src = fs.readFileSync(
    path.join(ROOT, 'app/api/delivery/profile/route.ts'),
    'utf8'
  );
  assert.equal(src.includes('age < 15'), false);
  assert.equal(src.includes('15 en 25'), false);
  assert.equal(src.includes('assertCommercialCourierAgeForActivation'), true);
  const under = assertCommercialCourierAgeForActivation({
    claimedAge: 16,
    dateOfBirth: noon('2010-01-01'),
    userId: 'u-legacy',
    now: noon('2026-08-04'),
    ageGateEnabled: true,
  });
  assert.equal(under.ok, false);
});

if (process.exitCode) {
  process.exit(1);
}
console.log('All Phase 1 delivery alignment checks passed.');

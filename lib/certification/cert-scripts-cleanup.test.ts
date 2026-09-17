import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

const SCRIPTS = [
  'scripts/certify-operations-data-parity.mts',
  'scripts/certify-app-production-auth-e2e.mts',
  'scripts/certify-stripe-settings-cta-layout.mts',
  'scripts/certify-account-readiness-delivery-stripe-ops.mts',
  'scripts/certify-ectaroship-package-selector.mts',
  'scripts/certify-public-test-data-isolation.mts',
  'scripts/certify-delivery-profile-production.mts',
  'scripts/certify-profile-requirement-notices-production.mts',
  'scripts/certify-temporary-delivery-availability-production.mts',
  'scripts/certify-delivery-dashboard-production.mts',
  'scripts/certify-order-review-trust-flow-production.mts',
  'scripts/certify-stripe-connect-safe-states.ts',
  'scripts/certify-stripe-connect-onboarding-final.ts',
  'scripts/live-fulfillment-location-e2e-cert.mts',
  'scripts/live-proposal-flow-e2e-cert.mts',
  'scripts/live-proposal-appointments-final-cert.mts',
  'scripts/live-app-stability-smoke.mts',
  'scripts/affiliate-other-seller-share-cert.ts',
];

describe('certification fixture cleanup contract', () => {
  for (const file of SCRIPTS) {
    it(`${file} disposes temp users via canonical helper`, () => {
      const src = readFileSync(file, 'utf8');
      assert.match(src, /disposeTempCertificationUsers/);
      assert.doesNotMatch(src, /stripeConnectAccountId:\s*null/);
    });
  }
});

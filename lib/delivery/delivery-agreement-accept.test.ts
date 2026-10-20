/**
 * Agreement display, dashboard acceptance, and affiliate separation.
 * No database. Run: npx tsx --test lib/delivery/delivery-agreement-accept.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  acceptanceMatchesCurrent,
  agreementAcceptanceRow,
  agreementContentHash,
  decideDashboardAgreementWrite,
  DELIVERY_AGREEMENT_VERSION,
} from './delivery-agreement-version';
import { parseAndValidateDeliverySignupFields } from './delivery-signup-validation';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('dashboard agreement write', () => {
  const nl = agreementContentHash('nl');
  const current = { version: DELIVERY_AGREEMENT_VERSION, contentHash: nl, language: 'nl' };

  it('stores the current version when the dashboard accept is explicit and no row exists', () => {
    const decision = decideDashboardAgreementWrite({
      profileAcceptedAt: null,
      existing: null,
    });
    assert.equal(decision.writeVersionRow, true);
    assert.equal(decision.writeProfileTimestamp, true);
    assert.equal(decision.unchanged, false);
    const row = agreementAcceptanceRow({
      deliveryProfileId: 'profile-1',
      userId: 'user-b',
      language: 'nl',
      acceptedAt: new Date('2026-10-20T00:00:00.000Z'),
    });
    assert.equal(row.version, DELIVERY_AGREEMENT_VERSION);
    assert.equal(row.contentHash, nl);
    assert.equal(acceptanceMatchesCurrent(row), true);
  });

  it('adds the version row without moving an old profile timestamp', () => {
    const oldTimestamp = new Date('2026-10-01T00:00:00.000Z');
    const decision = decideDashboardAgreementWrite({
      profileAcceptedAt: oldTimestamp,
      existing: null,
    });
    assert.equal(acceptanceMatchesCurrent(null), false);
    assert.equal(decision.writeVersionRow, true);
    assert.equal(decision.writeProfileTimestamp, false);
    assert.equal(decision.unchanged, false);
  });

  it('does not write again when the current version is already stored', () => {
    const decision = decideDashboardAgreementWrite({
      profileAcceptedAt: new Date('2026-10-18T00:00:00.000Z'),
      existing: current,
    });
    assert.equal(decision.writeVersionRow, false);
    assert.equal(decision.writeProfileTimestamp, false);
    assert.equal(decision.unchanged, true);
  });

  it('does not treat a legacy version as the current agreement', () => {
    const decision = decideDashboardAgreementWrite({
      profileAcceptedAt: new Date('2026-10-01T00:00:00.000Z'),
      existing: { version: 'legacy', contentHash: nl, language: 'nl' },
    });
    assert.equal(decision.writeVersionRow, true);
    assert.equal(acceptanceMatchesCurrent({ version: 'legacy', contentHash: nl, language: 'nl' }), false);
  });
});

describe('signup agreement display and private regression', () => {
  it('uses private-courier wording on signup and leaves the hashed agreement unchanged', () => {
    const nl = JSON.parse(read('public/i18n/nl.json')).deliverySignup;
    const en = JSON.parse(read('public/i18n/en.json')).deliverySignup;
    assert.equal(nl.title, 'Word particuliere bezorger');
    assert.match(nl.subtitle, /Bezorg wanneer het jou uitkomt/);
    assert.equal(nl.signupAsAmbassador, 'Aanmelden als particuliere bezorger');
    assert.equal(en.title, 'Become a private courier');
    assert.equal(nl.legalModalTitle, 'Bezorgaanbieder-overeenkomst');
    assert.equal(agreementContentHash('nl'), 'c1effe940da1b856b30f06c77876640b18ada233bc267e5f192f58ab39562ff9');
    assert.doesNotMatch(JSON.stringify({ title: nl.title, subtitle: nl.subtitle, button: nl.signupAsAmbassador }), /Ambassadeur/);
  });

  it('shows the same agreement modal on the business final step', () => {
    const company = read('app/delivery/company/signup/page.tsx');
    const modal = read('components/delivery/DeliveryAgreementModal.tsx');
    assert.match(company, /DeliveryAgreementModal/);
    assert.match(company, /acceptDeliveryAgreement: false/);
    assert.match(modal, /deliverySignup.insurance1/);
    assert.match(modal, /deliverySignup.legalModalTitle/);
    assert.doesNotMatch(modal, /acceptDeliveryAgreement:\s*true/);
  });

  it('private signup still accepts without a KvK number', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Neighbor',
        email: 'neighbor@example.com',
        password: 'secret12',
        username: 'neighbor_one',
        age: 30,
        transportation: ['BIKE'],
        acceptDeliveryAgreement: true,
      },
      { requireAccountFields: true },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.providerType, 'INDEPENDENT');
    assert.equal(result.data.kvkNumber, null);
  });

  it('business signup still requires the checkbox and an 8-digit KvK', () => {
    const missing = parseAndValidateDeliverySignupFields(
      {
        name: 'Owner',
        email: 'owner@example.com',
        password: 'secret12',
        username: 'owner_one',
        age: 32,
        transportation: ['CAR'],
        acceptDeliveryAgreement: true,
        providerType: 'DELIVERY_BUSINESS',
        companyName: 'Nearby Rides',
      },
      { requireAccountFields: true },
    );
    assert.equal(missing.ok, false);
    const accepted = parseAndValidateDeliverySignupFields(
      {
        name: 'Owner',
        email: 'owner@example.com',
        password: 'secret12',
        username: 'owner_one',
        age: 32,
        transportation: ['CAR'],
        acceptDeliveryAgreement: true,
        providerType: 'DELIVERY_BUSINESS',
        companyName: 'Nearby Rides',
        kvkNumber: '12345678',
      },
      { requireAccountFields: true },
    );
    assert.equal(accepted.ok, true);
    if (!accepted.ok) return;
    assert.equal(accepted.data.contentHash, undefined);
    const row = agreementAcceptanceRow({
      deliveryProfileId: 'profile-business',
      userId: 'user-owner',
      language: 'nl',
    });
    assert.equal(row.version, 'delivery-agreement-2026-10-18');
    assert.equal(row.contentHash, agreementContentHash('nl'));
  });
});

describe('courier signup does not grant affiliate status', () => {
  it('keeps referral capture on account signup and does not create an affiliate from a courier profile', () => {
    const signup = read('lib/delivery/delivery-signup-service.ts');
    const route = read('app/api/delivery/signup/route.ts');
    const attribution = read('lib/affiliate-attribution.ts');
    assert.doesNotMatch(signup, /affiliate\.create|prisma\.affiliate/);
    assert.match(route, /if \(!result\.recovered && !sessionUserId\)/);
    assert.match(attribution, /if \(!already\)/);
    assert.match(read('lib/auth/delivery-guest-auth.ts'), /preserveAccountRoleOnDeliveryProfile/);
    assert.doesNotMatch(read('components/delivery/DeliveryAgreementModal.tsx'), /affiliate/i);
  });
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  companyRegistrationRequiresMarketplaceSubscription,
  kvkImpliesMarketplaceSeller,
  normalizeAffiliateCompanyKvk,
  personalAffiliateRequiresKvk,
  selectExistingOrganizationByExactKvk,
  suggestOwnedCompanyIdentity,
} from '@/lib/affiliate/affiliate-company-kvk';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('A personal affiliate without KvK', () => {
  it('remains valid with no KvK and no Marketplace plan', () => {
    assert.equal(personalAffiliateRequiresKvk(), false);
    assert.equal(companyRegistrationRequiresMarketplaceSubscription(), false);
    const signup = read('lib/affiliate/activate-affiliate.ts');
    assert.doesNotMatch(signup, /kvkNumber|subscriptionId|SellerProfile/);
  });
});

describe('B and J company identity', () => {
  it('stores a valid KvK and reuses one exact organization', () => {
    assert.equal(normalizeAffiliateCompanyKvk('1234 5678'), '12345678');
    const existing = [
      { id: 'org-1', companyName: 'Example BV', kvkNumber: '12345678', status: 'ACTIVE' },
    ];
    assert.equal(selectExistingOrganizationByExactKvk(existing, '12345678')?.id, 'org-1');
  });

  it('prefills one unambiguous Marketplace KvK and does not merge different numbers or similar names', () => {
    assert.deepEqual(
      suggestOwnedCompanyIdentity({
        businessName: 'Example BV',
        businessKvk: '12345678',
        sellerCompanyName: 'Example BV',
        sellerKvk: '12345678',
      }),
      { companyName: 'Example BV', kvkNumber: '12345678' },
    );
    assert.equal(
      suggestOwnedCompanyIdentity({
        businessName: 'Example BV',
        businessKvk: '12345678',
        sellerCompanyName: 'Example B.V.',
        sellerKvk: '87654321',
      }),
      null,
    );
    assert.equal(
      selectExistingOrganizationByExactKvk(
        [
          { id: 'a', companyName: 'Example BV', kvkNumber: '12345678', status: 'ACTIVE' },
          { id: 'b', companyName: 'Example B.V.', kvkNumber: null, status: 'ACTIVE' },
        ],
        '11112222',
      ),
      null,
    );
  });
});

describe('BUSINESS_AFFILIATE_REGISTRATION_DOES_NOT_CREATE_MARKETPLACE_SUBSCRIPTION', () => {
  it('the company route does not create a plan, trial, seller, or Stripe subscription', () => {
    const route = read('app/api/affiliate/organization/route.ts');
    const page = read('app/affiliate/company/page-client.tsx');
    for (const src of [route, page]) {
      assert.doesNotMatch(src, /\/api\/subscribe/);
      assert.doesNotMatch(src, /subscriptionId/);
      assert.doesNotMatch(src, /subscriptionValidUntil/);
      assert.doesNotMatch(src, /prisma\.business\.create/);
      assert.doesNotMatch(src, /SellerProfile:\s*\{[^}]*create/);
    }
    assert.match(page, /kvkNumber/);
    assert.match(route, /normalizeAffiliateCompanyKvk/);
  });
});

describe('BUSINESS_AFFILIATE_REGISTRATION_DOES_NOT_REQUIRE_MARKETPLACE_SUBSCRIPTION', () => {
  it('explains that no HomeCheff subscription is required', () => {
    assert.equal(companyRegistrationRequiresMarketplaceSubscription(), false);
    const page = read('app/affiliate/company/page-client.tsx');
    assert.match(page, /Je hebt geen HomeCheff-abonnement nodig om zakelijk affiliate te zijn/);
    assert.match(page, /You don't need a HomeCheff subscription to participate as a business affiliate/);
    assert.doesNotMatch(page, /Choose your Marketplace subscription|Business subscription required/);
  });
});

describe('KVK_DOES_NOT_IMPLY_MARKETPLACE_SELLER', () => {
  it('KvK does not start seller onboarding', () => {
    assert.equal(kvkImpliesMarketplaceSeller(), false);
    const page = read('app/affiliate/company/page-client.tsx');
    assert.doesNotMatch(page, /seller\/onboard|\/pricing|choose-plan/);
  });
});

describe('E-H affiliate surfaces stay independent of a Marketplace plan', () => {
  it('dashboard, promote, earnings, and promo library do not require a seller plan', () => {
    const screen = read('app/affiliate/dashboard/screen.tsx');
    const promo = read('app/affiliate/promotiemateriaal/page.tsx');
    const codes = read('app/affiliate/promo-codes/page.tsx');
    for (const src of [screen, promo, codes]) {
      assert.doesNotMatch(src, /subscriptionId|\/pricing|\/api\/subscribe/);
      assert.match(src, /affiliate/);
    }
  });
});

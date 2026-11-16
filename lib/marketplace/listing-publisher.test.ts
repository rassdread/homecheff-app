import assert from 'node:assert/strict';
import test from 'node:test';
import {
  businessListingCardClass,
  resolveListingCompanyPublisher,
} from './listing-publisher';

test('company card only when this listing is published for the company', () => {
  const company = resolveListingCompanyPublisher({
    publishedAsCompany: true,
    companyName: 'Bakkerij Noord',
    plan: 'individual',
    verified: false,
  });
  assert.equal(company?.kind, 'company');
  assert.equal(company?.companyName, 'Bakkerij Noord');
  assert.equal(company?.plan, null);
  assert.equal(company?.verified, false);
  assert.match(businessListingCardClass(company), /hc-business-listing-card/);
});

test('a person with a business plan still looks private on a private listing', () => {
  assert.equal(
    resolveListingCompanyPublisher({
      publishedAsCompany: false,
      companyName: 'Bakkerij Noord',
      plan: 'premium',
      verified: true,
    }),
    null,
  );
  assert.equal(businessListingCardClass(null), '');
});

test('company name without the listing link does not invent a card', () => {
  assert.equal(
    resolveListingCompanyPublisher({
      publishedAsCompany: true,
      companyName: '   ',
    }),
    null,
  );
});

test('Premium and the verification flag travel only with a real company listing', () => {
  const company = resolveListingCompanyPublisher({
    publishedAsCompany: true,
    companyName: 'Bakkerij Noord',
    plan: 'premium',
    verified: true,
    logoUrl: ' https://example.test/logo.png ',
  });
  assert.equal(company?.plan, 'premium');
  assert.equal(company?.verified, true);
  assert.equal(company?.logoUrl, 'https://example.test/logo.png');
});

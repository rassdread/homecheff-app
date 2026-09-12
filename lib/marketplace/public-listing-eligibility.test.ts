#!/usr/bin/env npx tsx
/**
 * Regression: certification fixtures must never appear via public listing eligibility.
 * Run: npx tsx --test lib/marketplace/public-listing-eligibility.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  andPublicListingWhere,
  isCertificationFixtureEmail,
  isListingPubliclyDiscoverable,
  publicListingEligibilityWhere,
} from './public-listing-eligibility';

describe('public-listing-eligibility SoT', () => {
  it('detects certification fixture emails', () => {
    assert.equal(
      isCertificationFixtureEmail('foo+seller@homecheff-validation.test'),
      true,
    );
    assert.equal(isCertificationFixtureEmail('user@gmail.com'), false);
  });

  it('blocks inactive and fixture sellers from discovery', () => {
    assert.equal(
      isListingPubliclyDiscoverable({
        isActive: true,
        integrityStatus: 'ACTIVE',
        sellerEmail: 'x@homecheff-validation.test',
      }),
      false,
    );
    assert.equal(
      isListingPubliclyDiscoverable({
        isActive: false,
        integrityStatus: 'ACTIVE',
        sellerEmail: 'real@example.com',
      }),
      false,
    );
    assert.equal(
      isListingPubliclyDiscoverable({
        isActive: true,
        integrityStatus: 'ACTIVE',
        sellerEmail: 'real@example.com',
      }),
      true,
    );
  });

  it('where clause requires active + excludes fixtures; no Stripe inactive leak', () => {
    const where = publicListingEligibilityWhere();
    assert.ok(where.AND);
    const json = JSON.stringify(where);
    assert.match(json, /homecheff-validation\.test/);
    assert.match(json, /isActive/);
    assert.match(json, /ACTIVE/);
    assert.doesNotMatch(json, /orderItems/);
  });

  it('andPublicListingWhere nests extras under SoT', () => {
    const combined = andPublicListingWhere({ category: 'CHEFF' });
    const json = JSON.stringify(combined);
    assert.match(json, /CHEFF/);
    assert.match(json, /homecheff-validation\.test/);
  });
});

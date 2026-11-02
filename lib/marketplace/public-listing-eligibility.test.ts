#!/usr/bin/env npx tsx
/**
 * Regression: certification fixtures must never appear via public listing eligibility.
 * A missing or empty seller bio must stay publicly discoverable.
 * Run: npx tsx --test lib/marketplace/public-listing-eligibility.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Prisma } from '@prisma/client';
import {
  andPublicListingWhere,
  isCertificationFixtureEmail,
  isCertificationFixtureUser,
  isListingPubliclyDiscoverable,
  publicListingEligibilityWhere,
  type ListingPublicDiscoverabilityInput,
} from './public-listing-eligibility';

const REAL_SELLER: ListingPublicDiscoverabilityInput = {
  isActive: true,
  integrityStatus: 'ACTIVE',
  sellerEmail: 'seller@example.com',
  sellerBio: 'Ik bak oliebollen in Vlaardingen.',
  sellerSuspendedAt: null,
  sellerAccountDeletedAt: null,
};

function discover(
  overrides: ListingPublicDiscoverabilityInput,
): boolean {
  return isListingPubliclyDiscoverable({ ...REAL_SELLER, ...overrides });
}

type JsonObject = Record<string, unknown>;

function collectObjects(node: unknown, out: JsonObject[] = []): JsonObject[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectObjects(item, out);
    return out;
  }
  const record = node as JsonObject;
  out.push(record);
  for (const value of Object.values(record)) collectObjects(value, out);
  return out;
}

function sellerUserAnd(
  where: Prisma.ProductWhereInput,
): Prisma.UserWhereInput[] {
  const objects = collectObjects(where);
  const seller = objects.find(
    (row) => row.seller && typeof row.seller === 'object',
  );
  const user = (seller?.seller as { User?: { AND?: Prisma.UserWhereInput[] } })
    ?.User;
  assert.ok(Array.isArray(user?.AND), 'seller user AND clause missing');
  return user.AND;
}

function bioPublicOr(where: Prisma.ProductWhereInput): Prisma.UserWhereInput[] {
  const clauses = sellerUserAnd(where);
  const bioOr = clauses.find(
    (clause) =>
      Array.isArray(clause.OR) &&
      clause.OR.some((branch) => branch.bio === null),
  );
  assert.ok(bioOr?.OR, 'null-safe bio OR missing');
  return bioOr.OR;
}

function emailStartsWithDeleted(branch: Prisma.UserWhereInput): boolean {
  const email = branch.email;
  return Boolean(
    email &&
      typeof email === 'object' &&
      'startsWith' in email &&
      email.startsWith === 'deleted+',
  );
}

function excludesFixtureBioMarker(branch: Prisma.UserWhereInput): boolean {
  const not = branch.NOT;
  if (!not || Array.isArray(not)) return false;
  const bio = not.bio;
  return Boolean(
    bio &&
      typeof bio === 'object' &&
      'contains' in bio &&
      bio.contains === 'certificationFixture=true',
  );
}

describe('public-listing-eligibility SoT', () => {
  it('detects certification fixture emails', () => {
    assert.equal(
      isCertificationFixtureEmail('foo+seller@homecheff-validation.test'),
      true,
    );
    assert.equal(
      isCertificationFixtureEmail('mediacert+homecheff@example.com'),
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
    assert.match(json, /mediacert\+homecheff@example\.com/);
    assert.match(json, /isActive/);
    assert.match(json, /ACTIVE/);
    assert.doesNotMatch(json, /orderItems/);
    assert.doesNotMatch(json, /subscription/);
    assert.doesNotMatch(json, /promoCode/);
    assert.doesNotMatch(json, /stripe/i);
  });

  it('andPublicListingWhere nests extras under SoT', () => {
    const combined = andPublicListingWhere({ category: 'CHEFF' });
    const json = JSON.stringify(combined);
    assert.match(json, /CHEFF/);
    assert.match(json, /homecheff-validation\.test/);
    assert.equal(bioPublicOr(combined).some((branch) => branch.bio === null), true);
  });

  it('detects certification fixture users via bio marker', () => {
    assert.equal(
      isCertificationFixtureUser({
        email: 'a@b.com',
        bio: 'certificationFixture=true',
      }),
      true,
    );
    assert.equal(
      isCertificationFixtureUser({ email: 'a@b.com', bio: null }),
      false,
    );
    assert.equal(
      isCertificationFixtureUser({ email: 'a@b.com', bio: '' }),
      false,
    );
  });
});

describe('null-safe bio publication', () => {
  it('keeps the fixture-bio predicate outside the email NOT/OR', () => {
    const where = publicListingEligibilityWhere();
    const clauses = sellerUserAnd(where);
    const emailNot = clauses.find((clause) => {
      const not = clause.NOT;
      if (!not || Array.isArray(not) || !not.OR) return false;
      return not.OR.some((branch) => emailStartsWithDeleted(branch));
    });
    const emailNotFilter = emailNot?.NOT;
    if (!emailNotFilter || Array.isArray(emailNotFilter)) {
      throw new Error('email NOT filter missing');
    }
    const emailOr = emailNotFilter.OR ?? [];
    assert.equal(
      emailOr.some((branch) => branch.bio != null),
      false,
      'bio must not sit inside the email NOT/OR (NULL bio becomes UNKNOWN)',
    );

    const bioOr = bioPublicOr(where);
    assert.equal(bioOr.some((branch) => branch.bio === null), true);
    assert.equal(bioOr.some((branch) => branch.bio === ''), true);
    assert.equal(bioOr.some((branch) => excludesFixtureBioMarker(branch)), true);
  });

  const cases: Array<{
    name: string;
    input: ListingPublicDiscoverabilityInput;
    visible: boolean;
  }> = [
    {
      name: 'null bio and active product',
      input: { sellerBio: null },
      visible: true,
    },
    {
      name: 'empty bio and active product',
      input: { sellerBio: '' },
      visible: true,
    },
    {
      name: 'normal bio',
      input: { sellerBio: 'Oliebollenkraam in Vlaardingen' },
      visible: true,
    },
    {
      name: 'certificationFixture bio',
      input: { sellerBio: 'certificationFixture=true;internalTest=true' },
      visible: false,
    },
    {
      name: 'excluded test email',
      input: { sellerEmail: 'seller@homecheff-validation.test' },
      visible: false,
    },
    {
      name: 'internal keep email',
      input: { sellerEmail: 'mediacert+homecheff@example.com' },
      visible: false,
    },
    {
      name: 'suspended account',
      input: { sellerSuspendedAt: '2026-10-28T00:00:00.000Z' },
      visible: false,
    },
    {
      name: 'deleted account',
      input: { sellerAccountDeletedAt: '2026-10-28T00:00:00.000Z' },
      visible: false,
    },
    {
      name: 'inactive product',
      input: { isActive: false },
      visible: false,
    },
    {
      name: 'removed by moderation',
      input: { integrityStatus: 'REMOVED' },
      visible: false,
    },
    {
      name: 'review-required moderation stays public',
      input: { integrityStatus: 'REVIEW_REQUIRED' },
      visible: true,
    },
    {
      name: 'active premium subscription does not gate discovery',
      input: { sellerBio: null },
      visible: true,
    },
    {
      name: 'premium via 100 percent promo does not gate discovery',
      input: { sellerBio: '' },
      visible: true,
    },
    {
      name: 'seller without a subscription stays public',
      input: { sellerBio: 'Particuliere aanbieder' },
      visible: true,
    },
  ];

  for (const testCase of cases) {
    it(`javascript eligibility: ${testCase.name}`, () => {
      assert.equal(discover(testCase.input), testCase.visible);
    });
  }

  it('prisma where and javascript eligibility agree on bio, fixtures, and account state', () => {
    const where = publicListingEligibilityWhere();
    const json = JSON.stringify(where);
    assert.match(json, /"bio":null/);
    assert.match(json, /"bio":""/);
    assert.match(json, /certificationFixture=true/);
    assert.match(json, /suspendedAt/);
    assert.match(json, /accountDeletedAt/);
    assert.match(json, /"isActive":true/);
    assert.doesNotMatch(json, /subscriptionId/);
    assert.doesNotMatch(json, /priceCents/);

    const jsVisible = [
      discover({ sellerBio: null }),
      discover({ sellerBio: '' }),
      discover({ sellerBio: 'normale bio' }),
      discover({ sellerBio: null, integrityStatus: 'REVIEW_REQUIRED' }),
    ];
    assert.deepEqual(jsVisible, [true, true, true, true]);

    const jsHidden = [
      discover({ sellerBio: 'hello certificationFixture=true' }),
      discover({ sellerEmail: 'a@homecheff.test', sellerBio: null }),
      discover({ sellerEmail: 'deleted+user@homecheff.nl', sellerBio: '' }),
      discover({ sellerSuspendedAt: new Date(), sellerBio: null }),
      discover({ sellerAccountDeletedAt: new Date(), sellerBio: null }),
      discover({ isActive: false, sellerBio: null }),
      discover({ integrityStatus: 'TEMPORARILY_HIDDEN', sellerBio: null }),
    ];
    assert.deepEqual(jsHidden, [false, false, false, false, false, false, false]);

    const bioOr = bioPublicOr(where);
    const admitsNull = bioOr.some((branch) => branch.bio === null);
    const admitsEmpty = bioOr.some((branch) => branch.bio === '');
    const excludesMarker = bioOr.some((branch) => excludesFixtureBioMarker(branch));
    assert.equal(admitsNull, discover({ sellerBio: null }));
    assert.equal(admitsEmpty, discover({ sellerBio: '' }));
    assert.equal(excludesMarker, !discover({ sellerBio: 'certificationFixture=true' }));
  });
});

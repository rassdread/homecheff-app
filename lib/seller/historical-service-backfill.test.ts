import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  planHistoricalRoleIntegrity,
  provenCapability,
  sellerRoleWriteIsAdditive,
  type HistoricalOfferRow,
  type HistoricalUserRow,
} from './historical-service-backfill';

function offer(partial: Partial<HistoricalOfferRow> & Pick<HistoricalOfferRow, 'userId' | 'productId'>): HistoricalOfferRow {
  return {
    listingIntent: 'OFFER',
    marketplaceCategory: 'DESIGN',
    productCategory: 'DESIGNER',
    specializations: [],
    subcategory: 'design.website',
    isActive: true,
    integrityPublic: true,
    sellerSuspended: false,
    sellerDeleted: false,
    isCertificationFixture: false,
    ...partial,
  };
}

function user(partial: Partial<HistoricalUserRow> & Pick<HistoricalUserRow, 'userId'>): HistoricalUserRow {
  return {
    userRole: 'SELLER',
    sellerRoles: ['designer'],
    hasSellerProfile: true,
    hasDeliveryProfile: false,
    isCertificationFixture: false,
    accountDeleted: false,
    ...partial,
  };
}

describe('historical service backfill', () => {
  it('classifies a design-work offer as service and a request as nothing', () => {
    assert.equal(provenCapability(offer({ userId: 'u', productId: 'p' })), 'service');
    assert.equal(
      provenCapability(offer({ userId: 'u', productId: 'p2', listingIntent: 'REQUEST' })),
      null,
    );
  });

  it('does not treat a craft listing as a service', () => {
    assert.equal(
      provenCapability(
        offer({
          userId: 'u',
          productId: 'p',
          marketplaceCategory: 'CREATE',
          productCategory: 'DESIGNER',
          subcategory: 'create.art',
          specializations: ['create.art'],
        }),
      ),
      'designer',
    );
  });

  it('adds service beside designer and leaves the stored role in place', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1' })],
      users: [user({ userId: 'u1', sellerRoles: ['designer'] })],
      requestCount: 4,
      serviceLikeRequestCount: 1,
      dishCount: 9,
    });
    assert.deepEqual(plan.serviceRepairs, [
      {
        userId: 'u1',
        userRole: 'SELLER',
        before: ['designer'],
        after: ['designer', 'service'],
        added: ['service'],
        evidence: ['service:DESIGN:design.website'],
      },
    ]);
    assert.equal(plan.otherRoleRepairs.length, 0);
    assert.equal(sellerRoleWriteIsAdditive(['designer'], ['designer', 'service']), true);
  });

  it('keeps chef and designer when service is added', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1', marketplaceCategory: 'ARTISTIC_SERVICE', subcategory: 'artistic.nails' })],
      users: [user({ userId: 'u1', sellerRoles: ['chef', 'designer'] })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.deepEqual(plan.serviceRepairs[0].after, ['chef', 'designer', 'service']);
  });

  it('does not write again once service is already present', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1' })],
      users: [user({ userId: 'u1', sellerRoles: ['designer', 'service'] })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.equal(plan.serviceRepairs.length, 0);
    assert.deepEqual(plan.serviceUsersAlreadyWithService, ['u1']);
  });

  it('treats the services alias as already having service', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1' })],
      users: [user({ userId: 'u1', sellerRoles: ['designer', 'services'] })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.equal(plan.serviceRepairs.length, 0);
  });

  it('keeps an unrecognized stored role and appends service once', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1' })],
      users: [user({ userId: 'u1', sellerRoles: ['custom-legacy'] })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.deepEqual(plan.serviceRepairs[0].before, ['custom-legacy']);
    assert.deepEqual(plan.serviceRepairs[0].after, ['custom-legacy', 'service']);
  });

  it('does not repair a certification fixture', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [offer({ userId: 'u1', productId: 'p1', isCertificationFixture: true })],
      users: [user({ userId: 'u1', isCertificationFixture: true, sellerRoles: [] })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.equal(plan.serviceRepairs.length, 0);
    assert.equal(plan.excluded.certificationOffers, 1);
  });

  it('adds a proven chef role only when the profile has no commercial capability', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [
        offer({
          userId: 'u1',
          productId: 'p1',
          marketplaceCategory: 'CREATE',
          productCategory: 'CHEFF',
          subcategory: 'create.meal',
        }),
      ],
      users: [user({ userId: 'u1', sellerRoles: [], userRole: 'USER' })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.equal(plan.serviceRepairs.length, 0);
    assert.deepEqual(plan.otherRoleRepairs[0].after, ['chef']);
    assert.deepEqual(plan.profileWithoutRole.provableRoleMissing, ['u1']);
  });

  it('leaves a profile with no commercial proof unchanged', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [],
      users: [user({ userId: 'u1', sellerRoles: [], userRole: 'USER' })],
      requestCount: 2,
      serviceLikeRequestCount: 1,
      dishCount: 5,
    });
    assert.equal(plan.otherRoleRepairs.length, 0);
    assert.deepEqual(plan.profileWithoutRole.legitimateProfileWithoutRole, ['u1']);
    assert.equal(plan.excluded.requests, 2);
    assert.equal(plan.excluded.dishes, 5);
  });

  it('does not create a seller profile for delivery-only', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [],
      users: [
        user({
          userId: 'u1',
          sellerRoles: ['delivery'],
          hasSellerProfile: false,
          hasDeliveryProfile: true,
          userRole: 'DELIVERY',
        }),
      ],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.deepEqual(plan.roleWithoutProfile.notRequired, ['u1']);
    assert.equal(plan.profilesToCreate.length, 0);
  });

  it('plans a seller profile when a marketplace role has none', () => {
    const plan = planHistoricalRoleIntegrity({
      offers: [],
      users: [user({ userId: 'u1', sellerRoles: ['designer'], hasSellerProfile: false })],
      requestCount: 0,
      serviceLikeRequestCount: 0,
      dishCount: 0,
    });
    assert.deepEqual(plan.profilesToCreate, [{ userId: 'u1', reason: 'commercial-role-without-profile' }]);
  });

  it('rejects a write that drops an existing role', () => {
    assert.equal(sellerRoleWriteIsAdditive(['designer'], ['service']), false);
    assert.equal(sellerRoleWriteIsAdditive(['designer', 'service'], ['designer', 'service', 'service']), false);
  });
});

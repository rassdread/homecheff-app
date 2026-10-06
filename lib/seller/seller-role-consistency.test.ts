import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergeSellerRolesForSocialOnboarding,
  parseSuppliedSellerRoles,
  sellerRoleForCommercialOffer,
  socialOnboardingSubmittedRoles,
  unionSellerRoles,
} from './seller-role-consistency';

describe('profile sellerRoles semantics', () => {
  it('keeps an explicit list and normalizes aliases without duplicates', () => {
    const parsed = parseSuppliedSellerRoles(['CHEFF', 'garden', 'chef']);
    assert.deepEqual(parsed, { ok: true, roles: ['chef', 'garden'] });
  });

  it('treats an explicit empty list as a clear', () => {
    const parsed = parseSuppliedSellerRoles([]);
    assert.deepEqual(parsed, { ok: true, roles: [] });
  });

  it('rejects a role the client invented', () => {
    const parsed = parseSuppliedSellerRoles(['admin']);
    assert.equal(parsed.ok, false);
  });
});

describe('commercial offer role union', () => {
  it('maps food, garden, and design offers onto the existing role names', () => {
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'CHEFF'), 'chef');
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'GROWN'), 'garden');
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'DESIGNER'), 'designer');
  });

  it('maps service taxonomy to service and does not grant chef or designer for that listing', () => {
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'PRACTICAL_SERVICE'),
      'service',
    );
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'KNOWLEDGE'), 'service');
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'ARTISTIC_SERVICE'),
      'service',
    );
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'CREATE'), 'chef');
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'GROWN', 'GROW'), 'garden');
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['design.logo']),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['design.photo']),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['design.video', 'design.photo'], {
        priceModel: 'FIXED',
        fulfillmentOptions: { digital: false, pickup: true, shipping: true, delivery: false },
      }),
      'designer',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['create.art']),
      'designer',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'CREATE', ['create.jewelry']),
      'designer',
    );
  });

  it('does not grant service for a food offer, a design product, a request, or inspiration', () => {
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'CREATE'), 'chef');
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['create.art']),
      'designer',
    );
    assert.equal(sellerRoleForCommercialOffer('REQUEST', 'CHEFF', 'PRACTICAL_SERVICE'), null);
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'DISH'), null);
    assert.equal(parseSuppliedSellerRoles(['service']).ok, true);
    assert.equal(parseSuppliedSellerRoles(['practical_service']).ok, false);
    assert.equal(parseSuppliedSellerRoles(['admin']).ok, false);
  });

  it('unions service onto existing roles without removing them or duplicating', () => {
    const withService = unionSellerRoles(['chef', 'delivery'], 'service');
    assert.deepEqual(withService.roles, ['chef', 'delivery', 'service']);
    const again = unionSellerRoles(withService.roles, 'service');
    assert.equal(again.added, false);
    const withFood = unionSellerRoles(['service', 'affiliate'], 'chef');
    assert.deepEqual(withFood.roles, ['service', 'affiliate', 'chef']);
    const full = unionSellerRoles(['chef', 'service', 'delivery'], 'garden');
    assert.deepEqual(full.roles, ['chef', 'service', 'delivery', 'garden']);
  });

  it('does not assign a role for a request or for inspiration-only categories', () => {
    assert.equal(sellerRoleForCommercialOffer('REQUEST', 'CHEFF'), null);
    assert.equal(sellerRoleForCommercialOffer('OFFER', 'DISH'), null);
  });

  it('unions a new vertical onto existing roles and leaves affiliate-unrelated roles untouched', () => {
    const first = unionSellerRoles(['chef', 'delivery'], 'designer');
    assert.deepEqual(first, { roles: ['chef', 'delivery', 'designer'], added: true });
    const again = unionSellerRoles(first.roles, 'designer');
    assert.equal(again.added, false);
    assert.deepEqual(again.roles, first.roles);
  });
});

describe('social onboarding role preservation', () => {
  function merged(existing: string[], submitted: unknown) {
    const result = mergeSellerRolesForSocialOnboarding(existing, submitted);
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error('expected ok');
    return result.roles;
  }

  it('preserves existing capabilities when onboarding submits nothing', () => {
    assert.deepEqual(merged([], []), []);
    assert.deepEqual(merged(['chef'], []), ['chef']);
    assert.deepEqual(merged(['service'], []), ['service']);
    assert.deepEqual(merged(['delivery'], []), ['delivery']);
    assert.deepEqual(merged(['chef', 'service'], undefined), ['chef', 'service']);
    assert.deepEqual(merged(['chef', 'service'], null), ['chef', 'service']);
  });

  it('unions submitted roles and never drops an existing one', () => {
    assert.deepEqual(merged(['chef', 'service'], ['chef']), ['chef', 'service']);
    assert.deepEqual(merged(['garden'], ['service']), ['garden', 'service']);
    assert.deepEqual(merged(['designer', 'service'], ['designer']), ['designer', 'service']);
    assert.deepEqual(merged(['service', 'delivery'], ['service']), ['service', 'delivery']);
    assert.deepEqual(merged(['garden', 'delivery'], ['designer']), ['garden', 'delivery', 'designer']);
    assert.deepEqual(merged([], ['service']), ['service']);
  });

  it('canonicalizes aliases without duplicates', () => {
    assert.deepEqual(merged([], ['services']), ['service']);
    assert.deepEqual(merged(['chef'], ['design']), ['chef', 'designer']);
    assert.deepEqual(merged(['garden'], ['grown']), ['garden']);
    assert.deepEqual(merged(['cheff'], []), ['chef']);
  });

  it('rejects roles that are not commercial capabilities', () => {
    for (const bad of ['admin', 'superadmin', 'seller', 'practical_service', 'knowledge_service', 'artistic_service', 'foobar']) {
      const result = mergeSellerRolesForSocialOnboarding(['chef', 'service'], [bad]);
      assert.equal(result.ok, false);
    }
    assert.equal(parseSuppliedSellerRoles([]).ok, true);
    assert.deepEqual(parseSuppliedSellerRoles([]), { ok: true, roles: [] });
  });

  it('is idempotent when the same onboarding is submitted twice', () => {
    const first = merged(['chef'], ['service']);
    assert.deepEqual(first, ['chef', 'service']);
    assert.deepEqual(merged(first, ['service']), ['chef', 'service']);
  });

  it('treats a missing onboarding field as preserve and an empty list as preserve', () => {
    assert.equal(socialOnboardingSubmittedRoles({}), undefined);
    assert.deepEqual(socialOnboardingSubmittedRoles({ userTypes: null }), []);
    assert.deepEqual(socialOnboardingSubmittedRoles({ userTypes: [], sellerRoles: ['service'] }), ['service']);
    assert.deepEqual(
      merged(['chef', 'service'], socialOnboardingSubmittedRoles({})),
      ['chef', 'service'],
    );
    assert.deepEqual(
      merged(['chef', 'service'], socialOnboardingSubmittedRoles({ userTypes: [] })),
      ['chef', 'service'],
    );
  });
});

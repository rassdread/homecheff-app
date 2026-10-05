import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseSuppliedSellerRoles,
  sellerRoleForCommercialOffer,
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

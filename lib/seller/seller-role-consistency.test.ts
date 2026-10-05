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

import assert from 'node:assert/strict';
import test from 'node:test';
import { accessDecision, CAPABILITY_TEMPLATES, encodeCapabilityGrants } from './admin-capabilities';
import { resolveAdminRouteCapabilities } from './admin-route-capabilities';

function allows(template: keyof typeof CAPABILITY_TEMPLATES, pathname: string, method: string) {
  const requirements = resolveAdminRouteCapabilities(pathname, method);
  if (requirements.includes('SUPERADMIN')) return false;
  const roles = encodeCapabilityGrants(CAPABILITY_TEMPLATES[template]);
  return requirements.some((requirement) =>
    requirement !== 'SUPERADMIN' &&
    accessDecision({ role: 'ADMIN', adminRoles: roles, permissions: null, capability: requirement }).allow,
  );
}

test('a marketplace administrator cannot open growth, studio, or refund routes', () => {
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/orders', 'GET'), true);
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/affiliates', 'GET'), false);
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/center/summary', 'GET'), true);
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/refunds/execute', 'POST'), false);
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/orders/order/recover-seller-transfer', 'POST'), false);
  assert.equal(allows('MARKETPLACE_ADMIN', '/api/admin/capabilities', 'POST'), false);
});

test('a growth administrator cannot open marketplace payments or studio routes', () => {
  assert.equal(allows('GROWTH_ADMIN', '/api/admin/hc-campaigns', 'GET'), true);
  assert.equal(allows('GROWTH_ADMIN', '/api/admin/orders', 'GET'), false);
  assert.equal(allows('GROWTH_ADMIN', '/api/admin/financial', 'GET'), false);
});

test('a read-only administrator cannot execute refunds, promotions, or transfers', () => {
  assert.equal(allows('READ_ONLY_ADMIN', '/api/admin/orders', 'GET'), true);
  assert.equal(allows('READ_ONLY_ADMIN', '/api/admin/promo-codes/code', 'PATCH'), false);
  assert.equal(allows('READ_ONLY_ADMIN', '/api/admin/refunds', 'POST'), false);
  assert.equal(allows('READ_ONLY_ADMIN', '/api/admin/orders/order/recover-seller-transfer', 'POST'), false);
  assert.equal(allows('READ_ONLY_ADMIN', '/api/admin/assign-role', 'POST'), false);
});

test('a promotion editor is not granted refund execution by the route map', () => {
  const roles = encodeCapabilityGrants(['MARKETPLACE.PROMOTIONS.EDIT', 'GLOBAL.DASHBOARD.VIEW']);
  const requirements = resolveAdminRouteCapabilities('/api/admin/refunds/execute', 'POST');
  const allowed = requirements.some((requirement) =>
    requirement !== 'SUPERADMIN' &&
    accessDecision({ role: 'ADMIN', adminRoles: roles, permissions: { canViewPaymentInfo: true }, capability: requirement }).allow,
  );
  assert.equal(allowed, false);
});

test('legacy administrators keep order access and do not receive studio access', () => {
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: [], permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: [], permissions: null, capability: 'STUDIO.PROJECTS.VIEW' }).allow, false);
  assert.equal(accessDecision({ role: 'USER', adminRoles: [], permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, false);
});

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { accessDecision, CAPABILITY_TEMPLATES, encodeCapabilityGrants } from './admin-capabilities';
import { isAdminCapabilityRequirement, resolveAdminRouteCapabilities, unknownAdminRouteDecision } from './admin-route-capabilities';

function allows(template: keyof typeof CAPABILITY_TEMPLATES, pathname: string, method: string) {
  const requirements = resolveAdminRouteCapabilities(pathname, method);
  if (requirements.includes('SUPERADMIN') || requirements.includes('DENY')) return false;
  const roles = encodeCapabilityGrants(CAPABILITY_TEMPLATES[template]);
  return requirements.some((requirement) =>
    isAdminCapabilityRequirement(requirement) &&
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
    isAdminCapabilityRequirement(requirement) &&
    accessDecision({ role: 'ADMIN', adminRoles: roles, permissions: { canViewPaymentInfo: true }, capability: requirement }).allow,
  );
  assert.equal(allowed, false);
});

test('an unknown admin route is denied for every role except superadmin', () => {
  assert.deepEqual(resolveAdminRouteCapabilities('/api/admin/not-a-real-route', 'GET'), ['DENY']);
  assert.deepEqual(resolveAdminRouteCapabilities('/api/admin/not-a-real-route', 'POST'), ['DENY']);
  assert.equal(unknownAdminRouteDecision('SUPERADMIN'), 'allow');
  assert.equal(unknownAdminRouteDecision('ADMIN'), 'deny');
  assert.equal(unknownAdminRouteDecision('USER'), 'deny');
});

test('every existing admin route has an explicit capability', () => {
  const root = join(process.cwd(), 'app/api/admin');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === 'route.ts') files.push(full);
    }
  };
  walk(root);
  assert.ok(files.length >= 82);
  const unmapped: string[] = [];
  for (const file of files) {
    const url = `/${relative(join(process.cwd(), 'app'), file).replace(/\/route\.ts$/, '').replace(/\[[^\]]+\]/g, 'example')}`;
    const source = readFileSync(file, 'utf8');
    const methods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map((match) => match[1]);
    for (const method of methods) {
      const requirements = resolveAdminRouteCapabilities(url, method);
      if (requirements.includes('DENY')) unmapped.push(`${method} ${url}`);
    }
  }
  assert.deepEqual(unmapped, []);
});

test('legacy administrators keep order access and do not receive studio access', () => {
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: [], permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: [], permissions: null, capability: 'STUDIO.PROJECTS.VIEW' }).allow, false);
  assert.equal(accessDecision({ role: 'USER', adminRoles: [], permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, false);
});

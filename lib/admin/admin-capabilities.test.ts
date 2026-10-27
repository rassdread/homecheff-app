import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accessDecision,
  CAPABILITY_TEMPLATES,
  decideCapabilityAssignment,
  encodeCapabilityGrants,
  explicitGrants,
  platformsForCapabilities,
  tabsAllowedByCapabilities,
} from './admin-capabilities';

test('superadmin is allowed every capability, including studio costs', () => {
  const decision = accessDecision({
    role: 'SUPERADMIN',
    adminRoles: [],
    permissions: null,
    capability: 'STUDIO.COSTS.VIEW',
  });
  assert.equal(decision.allow, true);
  assert.equal(decision.source, 'superadmin');
});

test('a marketplace template cannot open growth billing or studio projects', () => {
  const grants = encodeCapabilityGrants(CAPABILITY_TEMPLATES.MARKETPLACE_ADMIN);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'GROWTH.BILLING.VIEW' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'STUDIO.PROJECTS.VIEW' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.REFUNDS.EXECUTE' }).allow, false);
});

test('finance execution does not include administrator management or promotion edits', () => {
  const grants = encodeCapabilityGrants(CAPABILITY_TEMPLATES.FINANCE_ADMIN);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.REFUNDS.EXECUTE' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.TRANSFERS.RECOVER' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'GLOBAL.ADMINISTRATORS.MANAGE' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.PROMOTIONS.EDIT' }).allow, false);
});

test('read-only template cannot execute refunds or recover transfers', () => {
  const grants = encodeCapabilityGrants(CAPABILITY_TEMPLATES.READ_ONLY_ADMIN);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.ORDERS.VIEW' }).allow, true);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.REFUNDS.EXECUTE' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.TRANSFERS.RECOVER' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.PROMOTIONS.EDIT' }).allow, false);
});

test('studio template cannot see marketplace payments or growth campaigns', () => {
  const grants = encodeCapabilityGrants(CAPABILITY_TEMPLATES.STUDIO_ADMIN);
  const platforms = platformsForCapabilities(explicitGrants(grants));
  assert.deepEqual(platforms.sort(), ['global', 'studio']);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'MARKETPLACE.PAYMENTS.VIEW' }).allow, false);
  assert.equal(accessDecision({ role: 'ADMIN', adminRoles: grants, permissions: null, capability: 'GROWTH.CAMPAIGNS.VIEW' }).allow, false);
});

test('multi-platform grants stay inside the assigned platforms', () => {
  const grants = encodeCapabilityGrants([
    ...CAPABILITY_TEMPLATES.MARKETPLACE_ADMIN,
    ...CAPABILITY_TEMPLATES.GROWTH_ADMIN,
  ]);
  const platforms = platformsForCapabilities(explicitGrants(grants));
  assert.equal(platforms.includes('studio'), false);
  assert.equal(platforms.includes('marketplace'), true);
  assert.equal(platforms.includes('growth'), true);
});

test('a subadmin cannot assign capabilities or change a superadmin', () => {
  const denied = decideCapabilityAssignment({
    actorRole: 'ADMIN',
    actorId: 'sub',
    targetRole: 'ADMIN',
    targetId: 'other',
    nextCapabilities: ['MARKETPLACE.REFUNDS.EXECUTE'],
    activeSuperadminCount: 1,
    removingSuperadmin: false,
  });
  assert.equal(denied.ok, false);
  const own = decideCapabilityAssignment({
    actorRole: 'SUPERADMIN',
    actorId: 'root',
    targetRole: 'ADMIN',
    targetId: 'root',
    nextCapabilities: ['GLOBAL.ADMINISTRATORS.MANAGE'],
    activeSuperadminCount: 1,
    removingSuperadmin: false,
  });
  assert.equal(own.ok, false);
  const superadmin = decideCapabilityAssignment({
    actorRole: 'SUPERADMIN',
    actorId: 'root',
    targetRole: 'SUPERADMIN',
    targetId: 'other-root',
    nextCapabilities: [],
    activeSuperadminCount: 2,
    removingSuperadmin: false,
  });
  assert.equal(superadmin.ok, false);
});

test('the last superadmin cannot be removed', () => {
  const decision = decideCapabilityAssignment({
    actorRole: 'SUPERADMIN',
    actorId: 'root',
    targetRole: 'ADMIN',
    targetId: 'other',
    nextCapabilities: [],
    activeSuperadminCount: 1,
    removingSuperadmin: true,
  });
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.reason, 'LAST_SUPERADMIN');
});

test('revoked explicit grants deny a capability the legacy flags would allow', () => {
  const grants = encodeCapabilityGrants(['MARKETPLACE.ORDERS.VIEW']);
  const decision = accessDecision({
    role: 'ADMIN',
    adminRoles: grants,
    permissions: { canViewPaymentInfo: true },
    capability: 'MARKETPLACE.REFUNDS.EXECUTE',
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.source, 'denied');
});

test('legacy admins do not receive studio access', () => {
  const decision = accessDecision({
    role: 'ADMIN',
    adminRoles: [],
    permissions: null,
    capability: 'STUDIO.PROJECTS.VIEW',
  });
  assert.equal(decision.allow, false);
  assert.equal(decision.source, 'denied');
});

test('explicit grants expose only the matching admin tabs', () => {
  const tabs = tabsAllowedByCapabilities(CAPABILITY_TEMPLATES.GROWTH_ADMIN);
  assert.equal(tabs.includes('affiliates'), true);
  assert.equal(tabs.includes('financial'), false);
  assert.equal(tabs.includes('studio-desk'), false);
  assert.equal(tabs.includes('admin-management'), false);
});

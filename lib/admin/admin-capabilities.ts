/**
 * Central admin capabilities.
 * SUPERADMIN keeps full access.
 * An administrator with no `cap:` grant stays on the legacy role and boolean map.
 * The first `cap:` grant switches that account to explicit capabilities only.
 */

export const ADMIN_CAPABILITY_PREFIX = 'cap:';
export const ADMIN_SCOPE_MARKER = 'cap:SCOPED';

export const ADMIN_CAPABILITIES = [
  'GLOBAL.DASHBOARD.VIEW',
  'GLOBAL.USERS.VIEW',
  'GLOBAL.USERS.EDIT',
  'GLOBAL.ADMINISTRATORS.MANAGE',
  'GLOBAL.AUDIT.VIEW',
  'GLOBAL.SYSTEM.VIEW',
  'MARKETPLACE.USERS.VIEW',
  'MARKETPLACE.SELLERS.VIEW',
  'MARKETPLACE.LISTINGS.VIEW',
  'MARKETPLACE.ORDERS.VIEW',
  'MARKETPLACE.ORDERS.MANAGE',
  'MARKETPLACE.PAYMENTS.VIEW',
  'MARKETPLACE.REFUNDS.EXECUTE',
  'MARKETPLACE.TRANSFERS.RECOVER',
  'MARKETPLACE.PROMOTIONS.VIEW',
  'MARKETPLACE.PROMOTIONS.EDIT',
  'MARKETPLACE.DELIVERY.VIEW',
  'MARKETPLACE.DELIVERY.MANAGE',
  'GROWTH.CAMPAIGNS.VIEW',
  'GROWTH.CAMPAIGNS.MANAGE',
  'GROWTH.AFFILIATES.VIEW',
  'GROWTH.BILLING.VIEW',
  'STUDIO.PROJECTS.VIEW',
  'STUDIO.JOBS.VIEW',
  'STUDIO.COSTS.VIEW',
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export const CAPABILITY_TEMPLATES = {
  MARKETPLACE_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'MARKETPLACE.USERS.VIEW',
    'MARKETPLACE.SELLERS.VIEW',
    'MARKETPLACE.LISTINGS.VIEW',
    'MARKETPLACE.ORDERS.VIEW',
    'MARKETPLACE.ORDERS.MANAGE',
    'MARKETPLACE.DELIVERY.VIEW',
    'MARKETPLACE.PROMOTIONS.VIEW',
  ],
  GROWTH_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'GROWTH.CAMPAIGNS.VIEW',
    'GROWTH.CAMPAIGNS.MANAGE',
    'GROWTH.AFFILIATES.VIEW',
  ],
  STUDIO_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'STUDIO.PROJECTS.VIEW',
    'STUDIO.JOBS.VIEW',
  ],
  SUPPORT_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'GLOBAL.USERS.VIEW',
    'MARKETPLACE.ORDERS.VIEW',
  ],
  FINANCE_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'MARKETPLACE.PAYMENTS.VIEW',
    'MARKETPLACE.REFUNDS.EXECUTE',
    'MARKETPLACE.TRANSFERS.RECOVER',
    'GROWTH.BILLING.VIEW',
  ],
  READ_ONLY_ADMIN: [
    'GLOBAL.DASHBOARD.VIEW',
    'GLOBAL.USERS.VIEW',
    'GLOBAL.AUDIT.VIEW',
    'MARKETPLACE.USERS.VIEW',
    'MARKETPLACE.SELLERS.VIEW',
    'MARKETPLACE.LISTINGS.VIEW',
    'MARKETPLACE.ORDERS.VIEW',
    'MARKETPLACE.PAYMENTS.VIEW',
    'MARKETPLACE.PROMOTIONS.VIEW',
    'MARKETPLACE.DELIVERY.VIEW',
    'GROWTH.CAMPAIGNS.VIEW',
    'GROWTH.AFFILIATES.VIEW',
    'STUDIO.PROJECTS.VIEW',
    'STUDIO.JOBS.VIEW',
  ],
  CUSTOM_ADMIN: ['GLOBAL.DASHBOARD.VIEW'],
} as const satisfies Record<string, readonly AdminCapability[]>;

export type CapabilityTemplateName = keyof typeof CAPABILITY_TEMPLATES;

const TAB_CAPABILITY: Record<string, AdminCapability> = {
  overview: 'GLOBAL.DASHBOARD.VIEW',
  'command-center': 'GLOBAL.SYSTEM.VIEW',
  users: 'GLOBAL.USERS.VIEW',
  messages: 'GLOBAL.USERS.VIEW',
  sellers: 'MARKETPLACE.SELLERS.VIEW',
  products: 'MARKETPLACE.LISTINGS.VIEW',
  orders: 'MARKETPLACE.ORDERS.VIEW',
  financial: 'MARKETPLACE.PAYMENTS.VIEW',
  delivery: 'MARKETPLACE.DELIVERY.VIEW',
  'live-locations': 'MARKETPLACE.DELIVERY.VIEW',
  affiliates: 'GROWTH.AFFILIATES.VIEW',
  'opportunity-funnel': 'GROWTH.CAMPAIGNS.VIEW',
  promotions: 'MARKETPLACE.PROMOTIONS.VIEW',
  'hc-campaigns': 'GROWTH.CAMPAIGNS.VIEW',
  notifications: 'GROWTH.CAMPAIGNS.MANAGE',
  disputes: 'MARKETPLACE.ORDERS.VIEW',
  moderation: 'MARKETPLACE.LISTINGS.VIEW',
  analytics: 'GLOBAL.DASHBOARD.VIEW',
  'promo-analytics': 'GROWTH.CAMPAIGNS.VIEW',
  'login-analytics': 'GLOBAL.DASHBOARD.VIEW',
  variabelen: 'GLOBAL.SYSTEM.VIEW',
  geographic: 'GLOBAL.DASHBOARD.VIEW',
  settings: 'GLOBAL.SYSTEM.VIEW',
  audit: 'GLOBAL.AUDIT.VIEW',
  'admin-management': 'GLOBAL.ADMINISTRATORS.MANAGE',
  'studio-desk': 'STUDIO.PROJECTS.VIEW',
};

export type LegacyPermissionFlags = {
  canViewRevenue?: boolean | null;
  canViewUserDetails?: boolean | null;
  canViewOrderDetails?: boolean | null;
  canViewPaymentInfo?: boolean | null;
  canViewDeliveryDetails?: boolean | null;
  canViewAnalytics?: boolean | null;
  canViewAuditLogs?: boolean | null;
  canEditUsers?: boolean | null;
  canEditProducts?: boolean | null;
  canModerateContent?: boolean | null;
  canManageAdminPermissions?: boolean | null;
  canSendNotifications?: boolean | null;
};

export function isAdminCapability(value: string): value is AdminCapability {
  return (ADMIN_CAPABILITIES as readonly string[]).includes(value);
}

export function explicitGrants(adminRoles: string[] | null | undefined): AdminCapability[] {
  const grants = new Set<AdminCapability>();
  for (const role of adminRoles ?? []) {
    if (!role.startsWith(ADMIN_CAPABILITY_PREFIX) || role === ADMIN_SCOPE_MARKER) continue;
    const capability = role.slice(ADMIN_CAPABILITY_PREFIX.length);
    if (isAdminCapability(capability)) grants.add(capability);
  }
  return [...grants];
}

export function hasExplicitCapabilityScope(adminRoles: string[] | null | undefined): boolean {
  return (adminRoles ?? []).includes(ADMIN_SCOPE_MARKER);
}

export function encodeCapabilityGrants(capabilities: readonly AdminCapability[]): string[] {
  return [ADMIN_SCOPE_MARKER, ...Array.from(new Set(capabilities), (capability) => `${ADMIN_CAPABILITY_PREFIX}${capability}`)];
}

export function accessDecision(input: {
  role: string;
  adminRoles: string[] | null | undefined;
  permissions: LegacyPermissionFlags | null;
  capability: AdminCapability;
}): { allow: boolean; source: 'superadmin' | 'explicit' | 'legacy' | 'denied' } {
  if (input.role === 'SUPERADMIN') return { allow: true, source: 'superadmin' };
  if (input.role !== 'ADMIN') return { allow: false, source: 'denied' };

  if (hasExplicitCapabilityScope(input.adminRoles)) {
    return explicitGrants(input.adminRoles).includes(input.capability)
      ? { allow: true, source: 'explicit' }
      : { allow: false, source: 'denied' };
  }

  return legacyAllows(input.capability, input.permissions)
    ? { allow: true, source: 'legacy' }
    : { allow: false, source: 'denied' };
}

function legacyAllows(capability: AdminCapability, permissions: LegacyPermissionFlags | null): boolean {
  const flags = permissions;
  const missingRow = flags == null;
  switch (capability) {
    case 'GLOBAL.DASHBOARD.VIEW':
    case 'GLOBAL.USERS.VIEW':
    case 'MARKETPLACE.USERS.VIEW':
    case 'MARKETPLACE.SELLERS.VIEW':
      return missingRow || flags.canViewUserDetails !== false;
    case 'GLOBAL.USERS.EDIT':
      return missingRow || flags.canEditUsers !== false;
    case 'GLOBAL.ADMINISTRATORS.MANAGE':
      return flags?.canManageAdminPermissions === true;
    case 'GLOBAL.AUDIT.VIEW':
      return missingRow || flags.canViewAuditLogs !== false;
    case 'GLOBAL.SYSTEM.VIEW':
      return missingRow || flags.canViewAnalytics !== false;
    case 'MARKETPLACE.LISTINGS.VIEW':
      return missingRow || flags.canEditProducts !== false || flags.canModerateContent === true;
    case 'MARKETPLACE.ORDERS.VIEW':
    case 'MARKETPLACE.ORDERS.MANAGE':
      return missingRow || flags.canViewOrderDetails !== false;
    case 'MARKETPLACE.PAYMENTS.VIEW':
    case 'GROWTH.BILLING.VIEW':
      return missingRow || flags.canViewPaymentInfo !== false || flags.canViewRevenue === true;
    case 'MARKETPLACE.REFUNDS.EXECUTE':
      return missingRow || flags.canViewPaymentInfo !== false;
    case 'MARKETPLACE.TRANSFERS.RECOVER':
    case 'MARKETPLACE.PROMOTIONS.EDIT':
      return flags?.canViewPaymentInfo === true;
    case 'MARKETPLACE.PROMOTIONS.VIEW':
    case 'GROWTH.CAMPAIGNS.VIEW':
    case 'GROWTH.CAMPAIGNS.MANAGE':
    case 'GROWTH.AFFILIATES.VIEW':
      return missingRow || flags.canViewAnalytics !== false || flags.canSendNotifications === true;
    case 'MARKETPLACE.DELIVERY.VIEW':
    case 'MARKETPLACE.DELIVERY.MANAGE':
      return missingRow || flags.canViewDeliveryDetails !== false;
    case 'STUDIO.PROJECTS.VIEW':
    case 'STUDIO.JOBS.VIEW':
    case 'STUDIO.COSTS.VIEW':
      return false;
    default:
      return false;
  }
}

export function tabsAllowedByCapabilities(capabilities: readonly AdminCapability[]): string[] {
  return Object.entries(TAB_CAPABILITY)
    .filter(([, capability]) => capabilities.includes(capability))
    .map(([tab]) => tab);
}

export function decideCapabilityAssignment(input: {
  actorRole: string;
  actorId: string;
  targetRole: string;
  targetId: string;
  nextCapabilities: readonly string[];
  activeSuperadminCount: number;
  removingSuperadmin: boolean;
}): { ok: true; grants: string[] } | { ok: false; reason: string } {
  if (input.actorRole !== 'SUPERADMIN') return { ok: false, reason: 'SUPERADMIN_REQUIRED' };
  if (input.actorId === input.targetId) return { ok: false, reason: 'CANNOT_CHANGE_OWN_ACCESS' };
  if (input.targetRole === 'SUPERADMIN') return { ok: false, reason: 'CANNOT_CHANGE_SUPERADMIN' };
  if (input.removingSuperadmin && input.activeSuperadminCount <= 1) {
    return { ok: false, reason: 'LAST_SUPERADMIN' };
  }
  const next: AdminCapability[] = [];
  for (const capability of input.nextCapabilities) {
    if (!isAdminCapability(capability)) return { ok: false, reason: 'UNKNOWN_CAPABILITY' };
    next.push(capability);
  }
  return { ok: true, grants: encodeCapabilityGrants(next) };
}

export function platformsForCapabilities(capabilities: readonly AdminCapability[]): Array<'global' | 'marketplace' | 'growth' | 'studio'> {
  const platforms = new Set<'global' | 'marketplace' | 'growth' | 'studio'>();
  for (const capability of capabilities) {
    if (capability.startsWith('GLOBAL.')) platforms.add('global');
    if (capability.startsWith('MARKETPLACE.')) platforms.add('marketplace');
    if (capability.startsWith('GROWTH.')) platforms.add('growth');
    if (capability.startsWith('STUDIO.')) platforms.add('studio');
  }
  return [...platforms];
}

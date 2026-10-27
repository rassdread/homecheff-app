import type { AdminCapability } from '@/lib/admin/admin-capabilities';

export type AdminRouteRequirement = AdminCapability | 'SUPERADMIN';

/**
 * Explicit route policy. A scoped administrator must match one of these
 * capabilities. SUPERADMIN means only a superadmin may call the route.
 * Legacy administrators still pass through accessDecision, not this list alone.
 */
export function resolveAdminRouteCapabilities(
  pathname: string,
  method: string,
): AdminRouteRequirement[] {
  const path = pathname.split('?')[0];
  const write = !['GET', 'HEAD'].includes(method.toUpperCase());

  if (
    path.startsWith('/api/admin/upgrade-to-superadmin') ||
    path.startsWith('/api/admin/capabilities') ||
    path.startsWith('/api/admin/assign-role') ||
    path.startsWith('/api/admin/permissions') ||
    path.startsWith('/api/admin/admins') ||
    path.startsWith('/api/admin/clear-messages') ||
    path.startsWith('/api/admin/users/bulk-delete') ||
    path.startsWith('/api/admin/migrate-orders')
  ) {
    return ['SUPERADMIN'];
  }

  if (path.startsWith('/api/admin/delivery/operations/recover')) return ['SUPERADMIN'];
  if (path.includes('/recover-seller-transfer')) return ['MARKETPLACE.TRANSFERS.RECOVER'];
  if (path.includes('hc-full-refund') || path.includes('release-escrow')) {
    return ['MARKETPLACE.REFUNDS.EXECUTE'];
  }
  if (path.startsWith('/api/admin/refunds')) {
    return [write ? 'MARKETPLACE.REFUNDS.EXECUTE' : 'MARKETPLACE.PAYMENTS.VIEW'];
  }
  if (path.startsWith('/api/admin/stripe/connect-reset') || path.includes('/payout')) {
    return [write ? 'MARKETPLACE.TRANSFERS.RECOVER' : 'MARKETPLACE.PAYMENTS.VIEW'];
  }
  if (
    path.startsWith('/api/admin/financial') ||
    path.startsWith('/api/admin/payouts') ||
    path.startsWith('/api/admin/transactions') ||
    path.startsWith('/api/admin/marketplace/finance-export') ||
    path.startsWith('/api/admin/stripe-status')
  ) {
    return ['MARKETPLACE.PAYMENTS.VIEW'];
  }
  if (path.startsWith('/api/admin/promo-codes')) {
    return [write ? 'MARKETPLACE.PROMOTIONS.EDIT' : 'MARKETPLACE.PROMOTIONS.VIEW'];
  }
  if (path.startsWith('/api/admin/shipping')) return ['MARKETPLACE.ORDERS.MANAGE'];
  if (path.startsWith('/api/admin/orders') || path.startsWith('/api/admin/disputes')) {
    return [write ? 'MARKETPLACE.ORDERS.MANAGE' : 'MARKETPLACE.ORDERS.VIEW'];
  }
  if (
    path.startsWith('/api/admin/products') ||
    path.startsWith('/api/admin/moderation') ||
    path.startsWith('/api/admin/integrity')
  ) {
    return [write ? 'MARKETPLACE.ORDERS.MANAGE' : 'MARKETPLACE.LISTINGS.VIEW'];
  }
  if (path.startsWith('/api/admin/sellers')) return ['MARKETPLACE.SELLERS.VIEW'];
  if (path.startsWith('/api/admin/delivery')) {
    return [write ? 'MARKETPLACE.DELIVERY.MANAGE' : 'MARKETPLACE.DELIVERY.VIEW'];
  }
  if (path.startsWith('/api/admin/users')) {
    return write
      ? ['GLOBAL.USERS.EDIT']
      : ['GLOBAL.USERS.VIEW', 'MARKETPLACE.USERS.VIEW'];
  }
  if (path.startsWith('/api/admin/affiliates') || path.startsWith('/api/admin/affiliate-program')) {
    return [write ? 'GROWTH.CAMPAIGNS.MANAGE' : 'GROWTH.AFFILIATES.VIEW'];
  }
  if (
    path.startsWith('/api/admin/hc-campaigns') ||
    path.startsWith('/api/admin/hcp') ||
    path.startsWith('/api/admin/opportunity-funnel') ||
    path.startsWith('/api/admin/notifications') ||
    path.startsWith('/api/admin/beta')
  ) {
    return [write ? 'GROWTH.CAMPAIGNS.MANAGE' : 'GROWTH.CAMPAIGNS.VIEW'];
  }
  if (path.startsWith('/api/admin/subscriptions') || path.startsWith('/api/admin/business-subscriptions')) {
    return [write ? 'GROWTH.BILLING.MANAGE' : 'GROWTH.BILLING.VIEW'];
  }
  if (path.startsWith('/api/admin/audit') || path.startsWith('/api/admin/contact-security')) {
    return ['GLOBAL.AUDIT.VIEW'];
  }
  if (path.startsWith('/api/admin/settings') || path.startsWith('/api/admin/compliance')) {
    return [write ? 'GLOBAL.SYSTEM.MANAGE' : 'GLOBAL.SYSTEM.VIEW'];
  }
  if (
    path.startsWith('/api/admin/analytics') ||
    path.startsWith('/api/admin/alerts') ||
    path.startsWith('/api/admin/command-center') ||
    path.startsWith('/api/admin/center') ||
    path.startsWith('/api/admin/preferences')
  ) {
    return ['GLOBAL.DASHBOARD.VIEW'];
  }
  if (path.startsWith('/api/admin/messages') || path.startsWith('/api/admin/send-') || path.startsWith('/api/admin/user-contact')) {
    return [write ? 'GLOBAL.USERS.EDIT' : 'GLOBAL.USERS.VIEW'];
  }
  if (path.startsWith('/api/admin/trust-queue')) return ['MARKETPLACE.LISTINGS.VIEW'];

  return write ? ['GLOBAL.SYSTEM.MANAGE'] : ['GLOBAL.SYSTEM.VIEW'];
}

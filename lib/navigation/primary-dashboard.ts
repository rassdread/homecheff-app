import {
  resolvePrimaryDashboardHref,
  resolvePrimaryOperationsHref,
  userHasEarningRole,
  userIsPlatformAdmin,
  type SettingsHubContext,
} from '@/lib/settings/settings-hub';

export const ADMIN_WORKSPACE_HREF = '/admin';

export {
  resolvePrimaryOperationsHref,
  userHasEarningRole,
  userIsPlatformAdmin,
};
import {
  isOperationsEntryPath,
  resolveOperationsEntryFromUser,
  type OperationsSection,
} from '@/lib/operations/operations-entry';

export type { OperationsSection };
export {
  OPERATIONS_ROUTES,
  resolveOperationsEntry,
  resolveOperationsEntryFromUser,
  listAvailableOperationsSections,
  isOperationsEntryPath,
  operationsSectionHome,
} from '@/lib/operations/operations-entry';
export type { OperationsEntryResult } from '@/lib/operations/operations-entry';

/** Merge session + bootstrap fields for nav routing. */
export function primaryDashboardContextFromUser(
  user: Record<string, unknown> | null | undefined
): SettingsHubContext | null {
  if (!user) return null;
  return {
    role: user.role as string | undefined,
    sellerRoles: (user.sellerRoles as string[] | undefined) ?? [],
    hasDeliveryProfile: Boolean(user.hasDeliveryProfile),
    hasAffiliate: Boolean(user.hasAffiliate),
  };
}

/** Primary operations dashboard for the current user (fallback `/profile`). */
export function resolvePrimaryDashboardHrefFromUser(
  user: Record<string, unknown> | null | undefined
): string {
  return resolveOperationsEntryFromUser(user).href;
}

/** True when user has at least one earning role (seller, delivery, affiliate). */
export function userHasEarningsHub(ctx: SettingsHubContext): boolean {
  return userHasEarningRole(ctx);
}

/** True when user can open the separate Admin workspace. */
export function userHasAdminWorkspace(
  user: Record<string, unknown> | null | undefined,
): boolean {
  const ctx = primaryDashboardContextFromUser(user);
  return ctx != null && userIsPlatformAdmin(ctx);
}

/** Count distinct earning channels (for combined /verdiensten discoverability). */
export function countEarningRoles(ctx: SettingsHubContext): number {
  let count = 0;
  const role = (ctx.role || '').toUpperCase();
  if ((ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER') count += 1;
  if (ctx.hasDeliveryProfile || role === 'DELIVERY') count += 1;
  if (ctx.hasAffiliate) count += 1;
  return count;
}

/** Whether bottom nav / dropdown should show an operations dashboard tab. */
export function userHasOperationsDashboard(
  user: Record<string, unknown> | null | undefined
): boolean {
  return resolveOperationsEntryFromUser(user).hasOperationsAccess;
}

/** Active state for the primary dashboard bottom-nav tab. */
export function isPrimaryDashboardPath(
  pathname: string | null | undefined,
  primaryHref: string
): boolean {
  return isOperationsEntryPath(pathname, primaryHref);
}

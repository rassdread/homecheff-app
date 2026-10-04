/**
 * HomeCheff presentation modes.
 *
 * Marketplace answers "what is here for me?".
 * Workspace answers "what should I do?".
 * This is presentation only. It does not create accounts, routes, or entitlements.
 *
 * Access and content are separate.
 * CAN_ACCESS_WORKSPACE: any authenticated session. Anonymous visitors stay
 * in Marketplace. No fake roles are added to open the door.
 * HAS_ACTIVE_WORKSPACE_ROLES: seller, affiliate, or delivery already on the
 * session. A buyer sees a starting orientation, not empty role tools.
 *
 * A seller role alone is not treated as active work for the default.
 * Listing counts are not on the session. This release does not add a count
 * query or a migration. Affiliate and delivery flags already mean a working
 * setup, so those still default to Workspace.
 *
 * A saved local preference wins while the user can still open Workspace.
 * Persistence is localStorage (`homecheff.ui.presentationMode`). No schema change.
 */

import type { FeedWorkspaceVisibleLayoutPlan } from '@/lib/adaptive-workspace-react/resolve-feed-workspace-visible-layout';
import { resolvePrimaryDashboardHrefFromUser } from '@/lib/navigation/primary-dashboard';
import {
  userHasEarningRole,
  type SettingsHubContext,
} from '@/lib/settings/settings-hub';

export type HomePresentationMode = 'marketplace' | 'workspace';

/** Readable marketplace column. Wider than the workspace feed cap (720/800). */
export const MARKETPLACE_FEED_MAX_WIDTH_PX = 1280;

/**
 * Workspace rails start at tablet portrait.
 * Phones, including landscape, stay single-column.
 */
export const WORKSPACE_RAIL_MIN_WIDTH_PX = 768;

export const PRESENTATION_MODE_STORAGE_KEY = 'homecheff.ui.presentationMode';

/**
 * CAN_ACCESS_WORKSPACE.
 * A non-null context means an authenticated session. Anonymous is null.
 */
export function userCanAccessWorkspace(
  ctx: SettingsHubContext | null | undefined,
): boolean {
  return ctx != null;
}

/** @deprecated name kept for callers. Means access, not an earning role. */
export function userCanUseWorkspace(
  ctx: SettingsHubContext | null | undefined,
): boolean {
  return userCanAccessWorkspace(ctx);
}

/**
 * HAS_ACTIVE_WORKSPACE_ROLES.
 * Seller, affiliate, or delivery already on the session. Not a buyer.
 */
export function userHasActiveWorkspaceRoles(
  ctx: SettingsHubContext | null | undefined,
): boolean {
  if (!ctx) return false;
  return userHasEarningRole(ctx);
}

/**
 * Active work already represented on the session.
 * Seller role alone is not activity.
 */
export function userHasWorkspaceActivity(
  ctx: SettingsHubContext | null | undefined,
): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return (
    Boolean(ctx.hasAffiliate) ||
    Boolean(ctx.hasDeliveryProfile) ||
    role === 'DELIVERY'
  );
}

export function defaultPresentationMode(
  ctx: SettingsHubContext | null | undefined,
): HomePresentationMode {
  if (!userCanUseWorkspace(ctx)) return 'marketplace';
  if (userHasWorkspaceActivity(ctx)) return 'workspace';
  return 'marketplace';
}

export function isHomePresentationMode(
  value: string | null | undefined,
): value is HomePresentationMode {
  return value === 'marketplace' || value === 'workspace';
}

/** Saved choice wins only while Workspace is still available. */
export function resolvePresentationMode(
  ctx: SettingsHubContext | null | undefined,
  saved: HomePresentationMode | null | undefined,
): HomePresentationMode {
  if (!userCanUseWorkspace(ctx)) return 'marketplace';
  if (saved && isHomePresentationMode(saved)) return saved;
  return defaultPresentationMode(ctx);
}

export function dashboardTargetForPresentation(input: {
  user: Record<string, unknown> | null | undefined;
  incompleteProfile?: boolean;
}): string {
  if (input.incompleteProfile) return '/onboarding/complete-profile';
  return resolvePrimaryDashboardHrefFromUser(input.user ?? null);
}

function hideSupportingPanels(
  plan: FeedWorkspaceVisibleLayoutPlan,
  feedColumnMaxWidthPx: number,
): FeedWorkspaceVisibleLayoutPlan {
  return {
    ...plan,
    supportingPanelCount: 0,
    showStartPanel: false,
    showEndPanel: false,
    gridTemplateColumns: 'minmax(0,1fr)',
    startRailWidthPx: 0,
    endRailWidthPx: 0,
    feedColumnMaxWidthPx,
  };
}

/**
 * Marketplace always drops both rails and widens the feed.
 * Workspace keeps the width plan from tablet up, and drops rails on phones.
 * Omitted mode is not handled here — callers keep the width plan.
 */
export function applyPresentationToLayoutPlan(
  plan: FeedWorkspaceVisibleLayoutPlan,
  mode: HomePresentationMode,
  options?: { rails?: boolean },
): FeedWorkspaceVisibleLayoutPlan {
  const feed = Math.min(
    MARKETPLACE_FEED_MAX_WIDTH_PX,
    Math.max(plan.usableWidthPx - 16, 280),
  );
  if (mode === 'marketplace' || options?.rails === false) {
    return hideSupportingPanels(plan, feed);
  }
  if (plan.usableWidthPx < WORKSPACE_RAIL_MIN_WIDTH_PX) {
    const feed = Math.min(
      plan.feedColumnMaxWidthPx,
      Math.max(plan.usableWidthPx - 16, 280),
    );
    return hideSupportingPanels(plan, feed);
  }
  return plan;
}

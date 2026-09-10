/**
 * Admin affiliate hierarchy mutations (Marketplace seat tree).
 *
 * Prospective only — never recalculates CommissionLedger / attributions.
 * Never creates/deletes Stripe Connect; User.stripeConnectAccountId stays canonical.
 */

import { prisma } from '@/lib/prisma';
import { bridgeAdminHierarchyEdgeToEcosystem } from '@/lib/affiliates/ecosystem-attribution-bridge';
import { resolveAffiliateConnectDestination } from '@/lib/stripe/affiliate-connect-mirror';

export type AffiliateHierarchyAction =
  | 'PROMOTE_TO_MAIN'
  | 'DEMOTE_TO_SUB'
  | 'REPARENT'
  | 'DETACH';

export type HierarchyMutationResult =
  | {
      ok: true;
      affiliateId: string;
      userId: string;
      oldParentAffiliateId: string | null;
      newParentAffiliateId: string | null;
      oldRole: 'MAIN' | 'SUB';
      newRole: 'MAIN' | 'SUB';
      stripeConnectAccountId: string | null;
      stripeUnchanged: true;
      edgeBridge: { ok: boolean; code?: string };
      effectiveAt: string;
    }
  | {
      ok: false;
      code:
        | 'NOT_FOUND'
        | 'SELF_PARENT'
        | 'CYCLE'
        | 'PARENT_IS_PARTNER'
        | 'PARENT_NOT_FOUND'
        | 'PARENT_REQUIRED'
        | 'ALREADY_MAIN'
        | 'ALREADY_SUB_OF_TARGET'
        | 'HAS_ACTIVE_CHILDREN'
        | 'INVALID_ACTION';
    };

function roleOf(parentAffiliateId: string | null): 'MAIN' | 'SUB' {
  return parentAffiliateId ? 'SUB' : 'MAIN';
}

/** Walk Marketplace parent chain — true if `candidateParentId` is under `affiliateId`. */
export async function wouldCreateMarketplaceCycle(
  affiliateId: string,
  candidateParentId: string,
): Promise<boolean> {
  let cursor: string | null = candidateParentId;
  const seen = new Set<string>([affiliateId]);
  for (let i = 0; i < 16 && cursor; i++) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    const row = await prisma.affiliate.findUnique({
      where: { id: cursor },
      select: { parentAffiliateId: true },
    });
    cursor = row?.parentAffiliateId ?? null;
  }
  return false;
}

export async function applyAdminAffiliateHierarchyChange(input: {
  affiliateId: string;
  action: AffiliateHierarchyAction;
  newParentAffiliateId?: string | null;
  reason?: string;
}): Promise<HierarchyMutationResult> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: input.affiliateId },
    include: {
      user: {
        select: {
          id: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
      childAffiliates: { select: { id: true, status: true } },
    },
  });

  if (!affiliate) return { ok: false, code: 'NOT_FOUND' };

  const connectBefore = resolveAffiliateConnectDestination({
    userStripeConnectAccountId: affiliate.user.stripeConnectAccountId,
    userStripeConnectOnboardingCompleted:
      affiliate.user.stripeConnectOnboardingCompleted,
    affiliateStripeConnectAccountId: affiliate.stripeConnectAccountId,
    affiliateStripeConnectOnboardingCompleted:
      affiliate.stripeConnectOnboardingCompleted,
  });

  const oldParent = affiliate.parentAffiliateId;
  const oldRole = roleOf(oldParent);
  let newParent: string | null = oldParent;
  let newRole: 'MAIN' | 'SUB' = oldRole;

  if (input.action === 'PROMOTE_TO_MAIN' || input.action === 'DETACH') {
    if (!oldParent) return { ok: false, code: 'ALREADY_MAIN' };
    newParent = null;
    newRole = 'MAIN';
  } else if (input.action === 'DEMOTE_TO_SUB' || input.action === 'REPARENT') {
    const targetParentId = input.newParentAffiliateId?.trim();
    if (!targetParentId) return { ok: false, code: 'PARENT_REQUIRED' };
    if (targetParentId === affiliate.id) return { ok: false, code: 'SELF_PARENT' };
    if (targetParentId === oldParent) {
      return { ok: false, code: 'ALREADY_SUB_OF_TARGET' };
    }

    const parent = await prisma.affiliate.findUnique({
      where: { id: targetParentId },
      select: { id: true, parentAffiliateId: true, status: true, userId: true },
    });
    if (!parent) return { ok: false, code: 'PARENT_NOT_FOUND' };
    if (parent.parentAffiliateId) return { ok: false, code: 'PARENT_IS_PARTNER' };

    // Demoting a MAIN with active children would create a 3-level tree.
    if (
      input.action === 'DEMOTE_TO_SUB' &&
      affiliate.childAffiliates.some((c) => c.status === 'ACTIVE')
    ) {
      return { ok: false, code: 'HAS_ACTIVE_CHILDREN' };
    }

    if (await wouldCreateMarketplaceCycle(affiliate.id, targetParentId)) {
      return { ok: false, code: 'CYCLE' };
    }

    newParent = parent.id;
    newRole = 'SUB';
  } else {
    return { ok: false, code: 'INVALID_ACTION' };
  }

  const effectiveAt = new Date();

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { parentAffiliateId: newParent },
  });

  // Verify Stripe fields untouched (User remains canonical).
  const userAfter = await prisma.user.findUnique({
    where: { id: affiliate.userId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      affiliate: {
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
  });
  const connectAfter = resolveAffiliateConnectDestination({
    userStripeConnectAccountId: userAfter?.stripeConnectAccountId,
    userStripeConnectOnboardingCompleted:
      userAfter?.stripeConnectOnboardingCompleted,
    affiliateStripeConnectAccountId: userAfter?.affiliate?.stripeConnectAccountId,
    affiliateStripeConnectOnboardingCompleted:
      userAfter?.affiliate?.stripeConnectOnboardingCompleted,
  });

  if (connectBefore.accountId !== connectAfter.accountId) {
    // Should be impossible — restore parent and fail hard.
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { parentAffiliateId: oldParent },
    });
    throw new Error('AFFILIATE_HIERARCHY_STRIPE_MUTATION_FORBIDDEN');
  }

  let edgeBridge: { ok: boolean; code?: string } = { ok: true };
  if (newParent === null) {
    edgeBridge = await bridgeAdminHierarchyEdgeToEcosystem({
      action: 'DETACH',
      childUserId: affiliate.userId,
      reason: input.reason ?? input.action,
    });
  } else {
    const parentUser = await prisma.affiliate.findUnique({
      where: { id: newParent },
      select: { userId: true },
    });
    if (parentUser) {
      edgeBridge = await bridgeAdminHierarchyEdgeToEcosystem({
        action: 'REPARENT',
        childUserId: affiliate.userId,
        newParentUserId: parentUser.userId,
        reason: input.reason ?? input.action,
      });
    }
  }

  return {
    ok: true,
    affiliateId: affiliate.id,
    userId: affiliate.userId,
    oldParentAffiliateId: oldParent,
    newParentAffiliateId: newParent,
    oldRole,
    newRole,
    stripeConnectAccountId: connectAfter.accountId,
    stripeUnchanged: true,
    edgeBridge,
    effectiveAt: effectiveAt.toISOString(),
  };
}

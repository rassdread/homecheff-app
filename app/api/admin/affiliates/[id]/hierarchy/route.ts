/**
 * PUT /api/admin/affiliates/[id]/hierarchy
 * Admin-only structural affiliate role/parent changes (prospective).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import {
  applyAdminAffiliateHierarchyChange,
  type AffiliateHierarchyAction,
} from '@/lib/affiliates/admin-affiliate-hierarchy';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set<AffiliateHierarchyAction>([
  'PROMOTE_TO_MAIN',
  'DEMOTE_TO_SUB',
  'REPARENT',
  'DETACH',
]);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminPermission('canViewPaymentInfo');
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as AffiliateHierarchyAction;
    const newParentAffiliateId =
      typeof body.newParentAffiliateId === 'string'
        ? body.newParentAffiliateId
        : body.newParentAffiliateId === null
          ? null
          : undefined;
    const reason =
      typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined;
    const confirmed = body.confirm === true;

    if (!ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Invalid action', code: 'INVALID_ACTION' },
        { status: 400 },
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        {
          error:
            'Bevestiging verplicht. Deze wijziging geldt voor toekomstige commissies. Bestaande commissies blijven ongewijzigd.',
          code: 'CONFIRMATION_REQUIRED',
        },
        { status: 400 },
      );
    }

    const result = await applyAdminAffiliateHierarchyChange({
      affiliateId: id,
      action,
      newParentAffiliateId,
      reason,
    });

    if (!result.ok) {
      const status =
        result.code === 'NOT_FOUND'
          ? 404
          : result.code === 'INVALID_ACTION' || result.code === 'PARENT_REQUIRED'
            ? 400
            : 422;
      return NextResponse.json(
        { error: result.code, code: result.code },
        { status },
      );
    }

    await logAdminAction(guard.admin.user.id, 'AFFILIATE_HIERARCHY_UPDATE', {
      targetType: 'affiliate',
      targetId: id,
      oldValue: {
        role: result.oldRole,
        parentAffiliateId: result.oldParentAffiliateId,
      },
      newValue: {
        role: result.newRole,
        parentAffiliateId: result.newParentAffiliateId,
        action,
        effectiveAt: result.effectiveAt,
        stripeConnectAccountId: result.stripeConnectAccountId
          ? `${result.stripeConnectAccountId.slice(0, 8)}…`
          : null,
        stripeUnchanged: true,
        edgeBridge: result.edgeBridge,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      message:
        'Hiërarchie bijgewerkt. Geldt voor toekomstige commissies. Bestaande commissies blijven ongewijzigd. Stripe Connect ongewijzigd.',
      result: {
        affiliateId: result.affiliateId,
        userId: result.userId,
        oldRole: result.oldRole,
        newRole: result.newRole,
        oldParentAffiliateId: result.oldParentAffiliateId,
        newParentAffiliateId: result.newParentAffiliateId,
        stripeUnchanged: true,
        stripeConnectAccountIdMasked: result.stripeConnectAccountId
          ? `${result.stripeConnectAccountId.slice(0, 7)}…${result.stripeConnectAccountId.slice(-4)}`
          : null,
        effectiveAt: result.effectiveAt,
        edgeBridge: result.edgeBridge,
      },
    });
  } catch (error: unknown) {
    console.error('[admin-affiliate-hierarchy]', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate hierarchy' },
      { status: 500 },
    );
  }
}

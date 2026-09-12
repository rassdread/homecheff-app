import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import {
  executeAdminConnectReset,
  previewAdminConnectReset,
} from '@/lib/stripe/admin-connect-reset';

export const dynamic = 'force-dynamic';

/** GET ?userId= — safety preview (read-only). */
export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const userId = req.nextUrl.searchParams.get('userId')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const preview = await previewAdminConnectReset(userId);
  if ('error' in preview) {
    return NextResponse.json({ error: preview.error }, { status: 404 });
  }
  return NextResponse.json(preview);
}

/**
 * POST — clear CURRENT Connect mapping only when financially safe.
 * Body: { userId, reason, confirm: true, idempotencyKey? }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason : '';
  const confirm = body.confirm === true;
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const result = await executeAdminConnectReset({
    adminId: guard.admin.user.id,
    userId,
    reason,
    confirm,
    idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.code === 'MANUAL_REVIEW'
        ? 409
        : result.code === 'USER_NOT_FOUND'
          ? 404
          : 400;
    return NextResponse.json(result, { status });
  }

  await logAdminAction(guard.admin.user.id, 'STRIPE_CONNECT_ADMIN_RESET', {
    targetType: 'User',
    targetId: userId,
    reason,
    meta: {
      oldStripeAccountId: result.oldStripeAccountId,
      auditId: result.auditId,
      alreadyCleared: result.alreadyCleared === true,
    },
  });

  return NextResponse.json({
    ok: true,
    message:
      'Stripe-koppeling opnieuw ingesteld. Oude Stripe-account is bewaard als legacy; gebruiker kiest opnieuw Particulier/Bedrijf.',
    ...result,
  });
}

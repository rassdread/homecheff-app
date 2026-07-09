import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export async function DELETE(req: NextRequest) {
  try {
    const guard = await requireSuperAdmin();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'Reason required' }, { status: 400 });
    }

    const deletedCount = await prisma.message.deleteMany({});

    await logAdminAction(guard.admin.user.id, 'CLEAR_ALL_MESSAGES', {
      targetType: 'messages',
      targetId: 'all',
      newValue: { deletedCount: deletedCount.count },
      reason,
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount.count,
      message: 'All messages cleared successfully',
    });
  } catch (error) {
    console.error('[Admin Clear Messages API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 },
    );
  }
}

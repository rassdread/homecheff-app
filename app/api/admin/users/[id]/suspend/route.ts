import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

/** POST suspend — PATCH-style body: { reason?: string } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminPermission('canEditUsers');
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true, suspendedAt: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (target.role === 'SUPERADMIN') {
    return NextResponse.json({ error: 'Cannot suspend superadmin' }, { status: 403 });
  }

  if (target.suspendedAt) {
    return NextResponse.json({ error: 'User already suspended' }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.user.update({
    where: { id },
    data: {
      suspendedAt: now,
      suspendedById: guard.admin.user.id,
      suspendReason: reason || null,
    },
    select: {
      id: true,
      email: true,
      suspendedAt: true,
      suspendReason: true,
    },
  });

  await logAdminAction(guard.admin.user.id, 'USER_SUSPENDED', {
    targetType: 'user',
    targetId: id,
    oldValue: { suspendedAt: null },
    newValue: { suspendedAt: now, reason },
    reason,
  });

  return NextResponse.json({ ok: true, user: updated });
}

/** DELETE restore suspended user */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminPermission('canEditUsers');
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, suspendedAt: true, suspendReason: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!target.suspendedAt) {
    return NextResponse.json({ error: 'User is not suspended' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      suspendedAt: null,
      suspendedById: null,
      suspendReason: null,
    },
    select: { id: true, email: true, suspendedAt: true },
  });

  await logAdminAction(guard.admin.user.id, 'USER_RESTORED', {
    targetType: 'user',
    targetId: id,
    oldValue: {
      suspendedAt: target.suspendedAt,
      reason: target.suspendReason,
    },
    newValue: { suspendedAt: null },
  });

  return NextResponse.json({ ok: true, user: updated });
}

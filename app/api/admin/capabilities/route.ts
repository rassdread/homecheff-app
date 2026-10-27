import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/admin-audit';
import { requireSuperAdmin } from '@/lib/admin-guard';
import {
  ADMIN_CAPABILITIES,
  CAPABILITY_TEMPLATES,
  decideCapabilityAssignment,
  explicitGrants,
  hasExplicitCapabilityScope,
  type CapabilityTemplateName,
} from '@/lib/admin/admin-capabilities';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  const administrators = await prisma.user.findMany({
    where: {
      accountDeletedAt: null,
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          }
        : { role: { in: ['ADMIN', 'SUPERADMIN'] } }),
    },
    select: { id: true, email: true, name: true, role: true, adminRoles: true, suspendedAt: true },
    orderBy: { email: 'asc' },
    take: 50,
  });
  return NextResponse.json({
    capabilities: ADMIN_CAPABILITIES,
    templates: CAPABILITY_TEMPLATES,
    administrators: administrators.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      suspended: Boolean(admin.suspendedAt),
      explicit: hasExplicitCapabilityScope(admin.adminRoles),
      capabilities: explicitGrants(admin.adminRoles),
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;
  const body = await request.json().catch(() => ({}));
  const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const action = body.action === 'suspend' || body.action === 'restore' || body.action === 'revoke' ? body.action : 'assign';
  if (!targetUserId || !reason) {
    return NextResponse.json({ error: 'targetUserId and reason are required' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, adminRoles: true, suspendedAt: true },
  });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const superadminCount = await prisma.user.count({
    where: { role: 'SUPERADMIN', accountDeletedAt: null, suspendedAt: null },
  });

  if (action === 'suspend' || action === 'restore') {
    const decision = decideCapabilityAssignment({
      actorRole: guard.admin.user.role,
      actorId: guard.admin.user.id,
      targetRole: target.role,
      targetId: target.id,
      nextCapabilities: explicitGrants(target.adminRoles),
      activeSuperadminCount: superadminCount,
      removingSuperadmin: false,
    });
    if (!decision.ok) return NextResponse.json({ error: decision.reason }, { status: 403 });
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        suspendedAt: action === 'suspend' ? new Date() : null,
        suspendReason: action === 'suspend' ? reason : null,
      },
      select: { id: true, suspendedAt: true },
    });
    await logAdminAction(guard.admin.user.id, action === 'suspend' ? 'ADMIN_SUSPENDED' : 'ADMIN_RESTORED', {
      targetType: 'user',
      targetId: target.id,
      oldValue: { suspendedAt: target.suspendedAt },
      newValue: { suspendedAt: updated.suspendedAt },
      reason,
    });
    return NextResponse.json({ ok: true, suspended: Boolean(updated.suspendedAt) });
  }

  const templateName = typeof body.template === 'string' ? body.template : '';
  const template = templateName && templateName in CAPABILITY_TEMPLATES
    ? CAPABILITY_TEMPLATES[templateName as CapabilityTemplateName]
    : null;
  const requested = Array.isArray(body.capabilities) ? body.capabilities.filter((item: unknown) => typeof item === 'string') : [];
  const nextCapabilities = action === 'revoke' ? [] : template ? [...template] : requested;

  const decision = decideCapabilityAssignment({
    actorRole: guard.admin.user.role,
    actorId: guard.admin.user.id,
    targetRole: target.role,
    targetId: target.id,
    nextCapabilities,
    activeSuperadminCount: superadminCount,
    removingSuperadmin: false,
  });
  if (!decision.ok) return NextResponse.json({ error: decision.reason }, { status: 403 });

  const preserved = target.adminRoles.filter((role) => !role.startsWith('cap:'));
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      adminRoles: [...preserved, ...decision.grants],
      ...(target.role === 'SUPERADMIN' ? {} : { role: 'ADMIN' as const }),
    },
    select: { id: true, adminRoles: true, role: true },
  });
  await logAdminAction(guard.admin.user.id, action === 'revoke' ? 'ADMIN_CAPABILITIES_REVOKED' : 'ADMIN_CAPABILITIES_ASSIGNED', {
    targetType: 'user',
    targetId: target.id,
    oldValue: { role: target.role, capabilities: explicitGrants(target.adminRoles) },
    newValue: { role: updated.role, capabilities: explicitGrants(updated.adminRoles) },
    reason,
  });
  return NextResponse.json({ ok: true, capabilities: explicitGrants(updated.adminRoles) });
}

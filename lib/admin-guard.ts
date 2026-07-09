/**
 * Phase 13E — Central admin authorization guard.
 * SUPERADMIN bypasses granular checks. ADMIN requires AdminPermissions where modeled.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AdminPermissions, User } from '@prisma/client';

export type AdminPermissionKey =
  | 'canEditUsers'
  | 'canDeleteUsers'
  | 'canDeleteProducts'
  | 'canEditProducts'
  | 'canViewOrderDetails'
  | 'canViewPaymentInfo'
  | 'canModerateContent'
  | 'canSendNotifications'
  | 'canViewAuditLogs'
  | 'canViewDeliveryDetails'
  | 'canManageAdminPermissions';

export type PlatformAdminContext = {
  user: Pick<User, 'id' | 'email' | 'role' | 'adminRoles'>;
  permissions: AdminPermissions | null;
  isSuperAdmin: boolean;
};

type GuardResult =
  | { ok: true; admin: PlatformAdminContext }
  | { ok: false; response: NextResponse };

export async function getPlatformAdmin(): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      adminRoles: true,
      suspendedAt: true,
      accountDeletedAt: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (user.accountDeletedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Account unavailable' }, { status: 403 }),
    };
  }

  const isPlatformAdmin =
    user.role === 'ADMIN' ||
    user.role === 'SUPERADMIN' ||
    (user.adminRoles?.length ?? 0) > 0;

  if (!isPlatformAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }

  if (user.suspendedAt && user.role !== 'SUPERADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Suspended admin account' }, { status: 403 }),
    };
  }

  const permissions = await prisma.adminPermissions.findUnique({
    where: { userId: user.id },
  });

  return {
    ok: true,
    admin: {
      user: user as PlatformAdminContext['user'],
      permissions,
      isSuperAdmin: user.role === 'SUPERADMIN',
    },
  };
}

export async function requirePlatformAdmin(): Promise<GuardResult> {
  return getPlatformAdmin();
}

export async function requireSuperAdmin(): Promise<GuardResult> {
  const result = await getPlatformAdmin();
  if (!result.ok) return result;
  if (!result.admin.isSuperAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Superadmin access required' }, { status: 403 }),
    };
  }
  return result;
}

export async function requireAdminPermission(
  permission: AdminPermissionKey,
): Promise<GuardResult> {
  const result = await getPlatformAdmin();
  if (!result.ok) return result;

  if (result.admin.isSuperAdmin) return result;

  const perms = result.admin.permissions;
  const allowed = perms?.[permission] ?? true;
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Missing permission: ${permission}` },
        { status: 403 },
      ),
    };
  }

  return result;
}

/** Destructive or high-risk actions — SUPERADMIN only. */
export async function requireSuperAdminForDestructive(): Promise<GuardResult> {
  return requireSuperAdmin();
}

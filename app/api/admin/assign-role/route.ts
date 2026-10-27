import { requireMappedAdminCapability } from '@/lib/admin-guard';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// SUPERADMIN can assign admin roles to users
export async function POST(req: NextRequest) {
  const mappedGuard = await requireMappedAdminCapability(req);
  if (!mappedGuard.ok) return mappedGuard.response;
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can assign admin roles' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, adminRoles, role } = body;

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Update user with admin roles and set role to ADMIN if not already
    // Also check if user already exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, adminRoles: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'CANNOT_CHANGE_OWN_ACCESS' }, { status: 403 });
    }
    if (
      targetUser.role === 'SUPERADMIN' ||
      role === 'SUPERADMIN' ||
      (Array.isArray(adminRoles) && adminRoles.includes('SUPERADMIN'))
    ) {
      return NextResponse.json({ error: 'CANNOT_CHANGE_SUPERADMIN' }, { status: 403 });
    }

    if (role === 'ADMIN') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'ADMIN',
        },
      });
    } else if (Array.isArray(adminRoles)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          adminRoles: adminRoles.filter((entry: string) => entry !== 'SUPERADMIN'),
          role: adminRoles.length > 0 ? 'ADMIN' : 'USER',
        },
      });
    } else {
      return NextResponse.json({ error: 'adminRoles array or role required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Admin roles toegekend' });
  } catch (error) {
    console.error('Error assigning admin roles:', error);
    return NextResponse.json(
      { error: 'Failed to assign admin roles' },
      { status: 500 }
    );
  }
}

// Remove admin roles from user
export async function DELETE(req: NextRequest) {
  const mappedGuard = await requireMappedAdminCapability(req);
  if (!mappedGuard.ok) return mappedGuard.response;
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can remove admin roles' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'CANNOT_CHANGE_OWN_ACCESS' }, { status: 403 });
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (targetUser?.role === 'SUPERADMIN') {
      return NextResponse.json({ error: 'CANNOT_CHANGE_SUPERADMIN' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        adminRoles: [],
        role: 'USER'
      }
    });

    return NextResponse.json({ success: true, message: 'Admin roles verwijderd' });
  } catch (error) {
    console.error('Error removing admin roles:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin roles' },
      { status: 500 }
    );
  }
}


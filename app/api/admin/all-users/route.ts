import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: 'Only SUPERADMIN can view all users' }, { status: 403 });
    }

    // Get all users who are not admins (for role assignment)
    const users = await prisma.user.findMany({
      where: {
        role: { notIn: ['ADMIN', 'SUPERADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        adminRoles: true,
        createdAt: true,
        profileImage: true,
        image: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for performance
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}


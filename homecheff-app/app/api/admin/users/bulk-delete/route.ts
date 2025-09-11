import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Check if trying to delete self
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    return NextResponse.json({ success: true, deletedCount: userIds.length });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


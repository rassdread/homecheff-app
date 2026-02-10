import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only ADMIN users can upgrade to SUPERADMIN' }, { status: 403 });
    }

    // Check if there are any SUPERADMIN users
    const superAdminExists = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    });

    if (superAdminExists && superAdminExists.id !== user.id) {
      return NextResponse.json({ error: 'SUPERADMIN already exists' }, { status: 403 });
    }

    // Upgrade to SUPERADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPERADMIN' }
    });

    return NextResponse.json({ success: true, message: 'Successfully upgraded to SUPERADMIN' });
  } catch (error) {
    console.error('Error upgrading to SUPERADMIN:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade to SUPERADMIN' },
      { status: 500 }
    );
  }
}


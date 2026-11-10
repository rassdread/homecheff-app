import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchActiveAdmins } from '@/lib/admin/load-notification-audience';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Je bent niet aangemeld.' }, { status: 401 });
    }
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Alleen een beheerder kan beheerders zoeken.' }, { status: 403 });
    }
    const query = new URL(req.url).searchParams.get('q') || '';
    const admins = await searchActiveAdmins(prisma, query);
    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin.id,
        name: admin.name || admin.username || 'Beheerder',
        email: admin.email,
        role: admin.role === 'SUPERADMIN' ? 'Superadmin' : 'Beheerder',
      })),
    });
  } catch (error) {
    console.error(
      '[admin/notifications/admins]',
      error instanceof Error ? error.message.slice(0, 200) : 'error',
    );
    return NextResponse.json({ error: 'Beheerders zoeken is mislukt.' }, { status: 500 });
  }
}

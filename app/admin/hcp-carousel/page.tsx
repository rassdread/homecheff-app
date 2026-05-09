import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HcpCarouselAdminClient from './HcpCarouselAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminHcpCarouselPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, adminRoles: true },
  });

  const ok =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN' ||
      (user.adminRoles?.length ?? 0) > 0);

  if (!ok) {
    redirect('/');
  }

  return <HcpCarouselAdminClient />;
}

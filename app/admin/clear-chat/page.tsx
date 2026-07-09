import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ClearChatClient from './ClearChatClient';

export const dynamic = 'force-dynamic';

export default async function ClearChatPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/clear-chat');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== 'SUPERADMIN') {
    redirect('/admin?domain=platform&tab=settings');
  }

  return <ClearChatClient />;
}

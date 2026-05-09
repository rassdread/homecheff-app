import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminBetaInsightsClient from '@/components/beta/AdminBetaInsightsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBetaPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Android beta — inzicht</h1>
          <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
            ← Admin
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          Ruwe tellers: downloadkliks op de beta-pagina, signups met bron{' '}
          <code className="text-xs bg-gray-200 px-1 rounded">ANDROID_BETA_DOWNLOAD</code>, en beta-testers met
          onboarding/HCP-bonus.
        </p>
        <AdminBetaInsightsClient />
      </div>
    </div>
  );
}

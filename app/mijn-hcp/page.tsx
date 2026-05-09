export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MijnHcpClient from '@/components/gamification/MijnHcpClient';

export default async function MijnHcpPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MijnHcpClient />
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MyHomeCheffHubClient from '@/components/my-homecheff/MyHomeCheffHubClient';

export default async function MijnHomeCheffPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=%2Fmijn-homecheff');
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <MyHomeCheffHubClient />
    </div>
  );
}

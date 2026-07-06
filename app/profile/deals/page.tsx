import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProfileDealsClient from '@/components/profile/ProfileDealsClient';

export const dynamic = 'force-dynamic';

export default async function ProfileDealsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=/profile/deals');
  }

  return <ProfileDealsClient />;
}

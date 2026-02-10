import { auth } from '@/lib/auth';
import { hasSellerAccess } from '@/lib/seller-access';
import { redirect } from 'next/navigation';
import VerkoperInstellingenPageClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function VerkoperInstellingenPageWrapper() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check if user has seller access
  const hasAccess = await hasSellerAccess(userId);

  if (!hasAccess) {
    redirect('/');
  }

  return <VerkoperInstellingenPageClient />;
}


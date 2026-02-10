import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';

export default async function DeliveryDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has delivery profile
  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: (session.user as any).id },
    select: { id: true, isActive: true }
  });

  if (!deliveryProfile) {
    redirect('/delivery/signup');
  }

  if (!deliveryProfile.isActive) {
    redirect('/delivery/signup?message=profile_inactive');
  }

  return <DeliveryDashboard />;
}
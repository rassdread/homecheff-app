import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';

export default async function DeliveryDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check email verification - redirect if not verified
  const emailCheckUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true }
  });

  if (!emailCheckUser || !emailCheckUser.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email || '')}`);
  }

  // Toegang: rol DELIVERY of iedereen met een actief bezorgerprofiel (incl. verkoper-bezorgers)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (user?.role !== 'DELIVERY') {
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: userId },
      select: { id: true, isActive: true }
    });

    if (!deliveryProfile) {
      // User is not a deliverer and has no delivery profile - redirect sellers to seller dashboard
      const hasSellerRoles = await prisma.user.findUnique({
        where: { id: userId },
        select: { sellerRoles: true, role: true }
      });
      
      if (hasSellerRoles?.sellerRoles && hasSellerRoles.sellerRoles.length > 0 || hasSellerRoles?.role === 'SELLER') {
        redirect('/verkoper/dashboard');
      }
      
      redirect('/delivery/signup');
    }

    if (!deliveryProfile.isActive) {
      redirect('/delivery/signup?message=profile_inactive');
    }
  }

  return <DeliveryDashboard />;
}
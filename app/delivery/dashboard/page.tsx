import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';
import { DELIVERY_START_HREF } from '@/lib/delivery/delivery-profile-completion';

/**
 * Canonical delivery dashboard entry: /delivery/dashboard
 *
 * Guards:
 * - auth + email verified
 * - DeliveryProfile must exist (else /delivery/start, sellers without courier → seller dash)
 * - Incomplete / inactive / no-Stripe are soft UX states inside the client dashboard
 */
export default async function DeliveryDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/delivery/dashboard`);
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect(`/login?callbackUrl=/delivery/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      role: true,
      sellerRoles: true,
      DeliveryProfile: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    redirect(`/login?callbackUrl=/delivery/dashboard`);
  }

  if (!user.emailVerified) {
    redirect(
      `/verify-email?email=${encodeURIComponent(user.email || session.user.email || '')}`,
    );
  }

  if (!user.DeliveryProfile) {
    const isSeller =
      (user.sellerRoles && user.sellerRoles.length > 0) || user.role === 'SELLER';
    if (isSeller && user.role !== 'DELIVERY') {
      redirect('/verkoper/dashboard');
    }
    redirect(DELIVERY_START_HREF);
  }

  return <DeliveryDashboard />;
}

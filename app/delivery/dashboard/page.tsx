import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard';
import { DELIVERY_START_HREF } from '@/lib/delivery/delivery-profile-completion';
import { sanitizeBookingRequestId } from '@/lib/delivery/booking-notice';

/**
 * Canonical delivery dashboard entry: /delivery/dashboard
 *
 * Guards:
 * - auth + email verified
 * - DeliveryProfile must exist (else /delivery/start, sellers without courier → seller dash)
 * - Incomplete / inactive / no-Stripe are soft UX states inside the client dashboard
 */
export default async function DeliveryDashboardPage({
  searchParams,
}: {
  searchParams?: { bookingRequestId?: string };
}) {
  const focusBookingRequestId = sanitizeBookingRequestId(searchParams?.bookingRequestId);
  const callbackUrl = focusBookingRequestId
    ? `/delivery/dashboard?bookingRequestId=${encodeURIComponent(focusBookingRequestId)}`
    : '/delivery/dashboard';
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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
      redirect('/operations/vandaag');
    }
    redirect(DELIVERY_START_HREF);
  }

  return <DeliveryDashboard focusBookingRequestId={focusBookingRequestId} />;
}

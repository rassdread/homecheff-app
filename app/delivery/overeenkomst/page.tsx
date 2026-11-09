import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DeliveryAgreementView from '@/components/delivery/DeliveryAgreementView';

export const dynamic = 'force-dynamic';

/**
 * Read-only view of the courier agreement already shown at signup.
 * Login returns here, so the email button still works for a signed-out recipient.
 */
export default async function DeliveryAgreementPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/delivery/overeenkomst')}`);
  }

  return <DeliveryAgreementView />;
}

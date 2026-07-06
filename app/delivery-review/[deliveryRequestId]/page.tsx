import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DeliveryReviewClient from './DeliveryReviewClient';

export const dynamic = 'force-dynamic';

export default async function DeliveryReviewPage({
  params,
}: {
  params: { deliveryRequestId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=/delivery-review/${params.deliveryRequestId}`);
  }

  return <DeliveryReviewClient deliveryRequestId={params.deliveryRequestId} />;
}

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DealReviewClient from './DealReviewClient';

export const dynamic = 'force-dynamic';

export default async function DealReviewPage({
  params,
}: {
  params: { communityOrderId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=/deal-review/${params.communityOrderId}`);
  }

  return <DealReviewClient communityOrderId={params.communityOrderId} />;
}

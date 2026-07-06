import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { CommunityOrderServiceError } from './community-order-service';
import { DealReviewServiceError } from './deal-review-service';
import { CommunityDeliveryReviewServiceError } from './community-delivery-review-service';

type AuthOk = { userId: string };
type AuthFail = { error: NextResponse };

export async function resolveTrustApiUser(): Promise<AuthOk | AuthFail> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  return { userId: user.id };
}

export function handleTrustServiceError(error: unknown) {
  if (
    error instanceof CommunityOrderServiceError ||
    error instanceof DealReviewServiceError ||
    error instanceof CommunityDeliveryReviewServiceError
  ) {
    const body: Record<string, string> = { error: error.message };
    if (error.errorKey) body.errorKey = error.errorKey;
    return NextResponse.json(body, { status: error.status });
  }
  console.error('[trust-api]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

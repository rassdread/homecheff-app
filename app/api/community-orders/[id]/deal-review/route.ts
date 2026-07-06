import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import {
  createDealReview,
  getDealReviewStatus,
} from '@/lib/trust/deal-review-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const status = await getDealReviewStatus(authResult.userId, params.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleTrustServiceError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json()) as {
      rating?: number;
      title?: string | null;
      message?: string | null;
    };

    if (typeof body.rating !== 'number') {
      return NextResponse.json({ error: 'Rating required' }, { status: 400 });
    }

    const review = await createDealReview(authResult.userId, params.id, {
      rating: body.rating,
      title: body.title,
      message: body.message,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return handleTrustServiceError(error);
  }
}

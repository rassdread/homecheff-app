/**
 * TRUST-1.1 — seller clarification while listing is under integrity review.
 * Does NOT restore public visibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { submitSellerIntegrityClarification } from '@/lib/trust/seller-integrity-clarification';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await Promise.resolve(context.params);
  const productId = resolveProductIdFromParam(
    typeof resolved?.id === 'string' ? resolved.id : '',
  );
  if (!productId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const note =
    typeof body.note === 'string'
      ? body.note
      : typeof body.clarification === 'string'
        ? body.clarification
        : '';

  try {
    const result = await submitSellerIntegrityClarification({
      productId,
      sellerUserId: userId,
      note,
      sellerContributionTypes: body.sellerContributionTypes,
      sellerContributionNote: body.sellerContributionNote,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ERROR';
    if (msg === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (msg === 'NOT_ELIGIBLE') {
      return NextResponse.json(
        { error: 'Clarification not available for this status' },
        { status: 400 },
      );
    }
    if (msg === 'NOTE_REQUIRED') {
      return NextResponse.json(
        { error: 'Toelichting is verplicht' },
        { status: 400 },
      );
    }
    console.error('[integrity-clarify]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * TRUST-1 — Product integrity report endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { submitProductIntegrityReport } from '@/lib/trust/submit-integrity-report';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = (await params).id;
    const productId = resolveProductIdFromParam(raw);
    if (!productId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await submitProductIntegrityReport({
      reporterId: user.id,
      productId,
      reasonRaw: String(body.reason || ''),
      explanation:
        typeof body.explanation === 'string'
          ? body.explanation
          : typeof body.description === 'string'
            ? body.description
            : null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, errorKey: result.errorKey },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      temporarilyHidden: result.temporarilyHidden,
      message:
        'Bedankt. We bekijken je melding. De aanbieder ziet niet wie heeft gemeld.',
    });
  } catch (e) {
    console.error('[integrity-report]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

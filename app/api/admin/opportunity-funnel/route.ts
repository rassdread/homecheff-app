import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildOpportunityFunnelReport } from '@/lib/analytics/opportunity-funnel';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== 'ADMIN') {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || 30)));
  const includeCert = url.searchParams.get('includeCert') === '1';
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const report = await buildOpportunityFunnelReport({
    from,
    to,
    commercialOnly: !includeCert,
  });

  return NextResponse.json({
    ok: true,
    ...report,
    certEventsExcludedFromCommercialBi: !includeCert,
    noMockBi: true,
  });
}

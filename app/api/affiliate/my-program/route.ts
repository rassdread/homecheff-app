import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveStoredAffiliateCapabilities } from '@/lib/affiliate/program-store';
import { durationCopy, effectiveSubLimitLabel } from '@/lib/affiliate/program-control';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      affiliate: {
        include: { programEnrollment: true },
      },
    },
  });
  if (!user?.affiliate) {
    return NextResponse.json({ error: 'Geen affiliate' }, { status: 404 });
  }
  const resolved = await resolveStoredAffiliateCapabilities(user.affiliate.id);
  const portfolio = await prisma.attribution.count({
    where: { affiliateId: user.affiliate.id },
  });
  return NextResponse.json({
    programName: resolved.programName,
    programCode: resolved.programCode,
    joinedAt: user.affiliate.programEnrollment?.enrolledAt ?? user.affiliate.createdAt,
    source: user.affiliate.programEnrollment?.source ?? null,
    portfolio,
    promo: resolved.capabilities.CAN_CREATE_PROMO_CODES.value,
    network: resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value,
    subLimit: effectiveSubLimitLabel(resolved.subAffiliateLimit.value),
    main: resolved.capabilities.CAN_BECOME_MAIN.value,
    duration: durationCopy(resolved.programName || 'jouw affiliateprogramma'),
  });
}

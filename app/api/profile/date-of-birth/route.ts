import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { confirmUserDateOfBirth } from '@/lib/delivery/confirm-user-date-of-birth';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_MIN_AGE,
  evaluateDeliveryAgeRequirement,
  formatDateOfBirthIso,
  resolveDeliveryAgeStatus,
} from '@/lib/delivery/delivery-age';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: cors });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dateOfBirth: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
  }

  const flags = getDeliveryAlignmentFlags();
  const age = evaluateDeliveryAgeRequirement({
    dateOfBirth: user.dateOfBirth,
    ageGateEnabled: flags.commercialAgeGate18Enabled,
  });
  const canonical = resolveDeliveryAgeStatus({
    dateOfBirth: user.dateOfBirth,
    ageGateEnabled: flags.commercialAgeGate18Enabled,
  });
  const fromDob = calculateAgeFromDob(user.dateOfBirth);

  return NextResponse.json(
    {
      dateOfBirth: formatDateOfBirthIso(user.dateOfBirth),
      locked: user.dateOfBirth != null,
      ageYears: fromDob.ok ? fromDob.ageYears : null,
      eligible: age.eligible,
      status: age.status,
      canonicalStatus: canonical.status,
      source: canonical.source,
      verified: canonical.verified,
      minAge: COMMERCIAL_DELIVERY_MIN_AGE,
    },
    { headers: cors },
  );
}

export async function PUT(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: cors });
  }

  const body = await req.json().catch(() => ({}));
  const raw = body.dateOfBirth ?? body.birthDate ?? null;
  const result = await confirmUserDateOfBirth(userId, raw);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status, headers: cors },
    );
  }

  return NextResponse.json(
    {
      success: true,
      dateOfBirth: result.dateOfBirthIso,
      locked: true,
      ageYears: result.ageYears,
      eligible: result.eligible,
      canonicalStatus: result.eligible ? 'VERIFIED_18_PLUS' : 'UNDER_18',
    },
    { headers: cors },
  );
}

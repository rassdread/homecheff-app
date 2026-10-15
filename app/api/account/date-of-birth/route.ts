import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  correctCanonicalDateOfBirth,
  dateOfBirthCorrectionCopy,
  foreignDateOfBirthTarget,
  persistCanonicalDateOfBirth,
  serializeOwnerDateOfBirth,
} from '@/lib/account/date-of-birth';
import {
  COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
} from '@/lib/delivery/delivery-age';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dateOfBirth: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(serializeOwnerDateOfBirth(user.dateOfBirth));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const raw =
    body.dateOfBirth ??
    body.birthDate ??
    (body.day && body.month && body.year
      ? `${body.day}/${body.month}/${body.year}`
      : null);

  const result = await persistCanonicalDateOfBirth(prisma, {
    userId: session.user.id,
    raw,
    onLocked: 'error',
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    locked: true,
    wrote: result.wrote,
    dateOfBirthIso: result.dateOfBirthIso,
    dateOfBirthNl: result.dateOfBirthNl,
    deliveryAgeEligible: result.eligible,
    deliveryAgeStatus: result.status,
    message: result.eligible
      ? 'Je leeftijd is bevestigd.'
      : result.status === 'DELIVERY_UNDER_18'
        ? COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL
        : 'Geboortedatum opgeslagen.',
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (foreignDateOfBirthTarget(session.user.id, body.userId)) {
    return NextResponse.json(
      {
        error: dateOfBirthCorrectionCopy('FORBIDDEN', 'nl'),
        errorEn: dateOfBirthCorrectionCopy('FORBIDDEN', 'en'),
        code: 'FORBIDDEN',
      },
      { status: 403 },
    );
  }

  const raw =
    body.dateOfBirth ??
    body.birthDate ??
    (body.day && body.month && body.year
      ? `${body.day}/${body.month}/${body.year}`
      : null);

  const result = await correctCanonicalDateOfBirth(prisma, {
    userId: session.user.id,
    raw,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, errorEn: result.errorEn, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    wrote: result.wrote,
    dateOfBirthIso: result.dateOfBirthIso,
    dateOfBirthNl: result.dateOfBirthNl,
    ageYears: result.ageYears,
    ageBand: result.ageBand,
    ageBandChanged: result.ageBandChanged,
    stripeIdentityPreserved: result.stripeIdentityPreserved,
    message: result.wrote
      ? 'Geboortedatum opgeslagen.'
      : 'Je geboortedatum is ongewijzigd.',
    messageEn: result.wrote ? 'Date of birth saved.' : 'Your date of birth is unchanged.',
  });
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}

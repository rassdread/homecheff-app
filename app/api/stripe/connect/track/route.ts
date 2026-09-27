import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decideConnectTrackPersist } from '@/lib/account/persist-connect-track';
import { subjectFromUser } from '@/lib/age/listing-age-guard';
import { resolveAgeEnforcement } from '@/lib/age/marketplace-eligibility';
import { parseConnectTrack } from '@/lib/stripe/connect-tracks';

export const dynamic = 'force-dynamic';

/**
 * Stores the seller type on the signed-in user only.
 * Does not create a Stripe account. The id always comes from the session.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string } | undefined;
  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const requested = parseConnectTrack(body.track);
  if (!requested) {
    return NextResponse.json({ error: 'TRACK_INVALID' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      dateOfBirth: true,
      stripeConnectAccountId: true,
      stripeConnectTrack: true,
      sellerActivatedAt: true,
      sellerRoles: true,
      createdAt: true,
      country: true,
      SellerProfile: { select: { id: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const age = resolveAgeEnforcement(subjectFromUser(user));
  const decision = decideConnectTrackPersist({
    requested,
    ageMode: age.mode,
    hasStripeAccount: Boolean(user.stripeConnectAccountId),
    existingTrack: parseConnectTrack(user.stripeConnectTrack),
  });
  if (!decision.ok) {
    return NextResponse.json(
      {
        error: decision.code,
        message: decision.messageNl,
        messageEn: decision.messageEn,
      },
      { status: decision.status },
    );
  }

  if (!decision.unchanged) {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { stripeConnectTrack: decision.track },
    });
  }

  return NextResponse.json({ ok: true, track: decision.track });
}

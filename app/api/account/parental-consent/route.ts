import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import {
  createParentalConsentInvite,
  getParentalConsentPublic,
  PARENTAL_CONSENT_VERSION,
} from '@/lib/age/parental-consent';
import { resolveAgeEnforcement } from '@/lib/age/marketplace-eligibility';

export const dynamic = 'force-dynamic';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (!sessionUser?.id && !sessionUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: sessionUser.id
      ? { id: sessionUser.id }
      : { email: sessionUser.email! },
    select: { id: true, dateOfBirth: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const consent = await getParentalConsentPublic(prisma, user.id);
  const age = resolveAgeEnforcement(user);
  return NextResponse.json({
    consent,
    mode: age.mode,
    ageBand: age.band,
    consentRequired: age.mode === 'MINOR' && consent.status !== 'ACTIVE',
    consentVersion: PARENTAL_CONSENT_VERSION,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const guardianEmail =
    typeof body.guardianEmail === 'string' ? body.guardianEmail.trim().toLowerCase() : '';
  if (!isEmail(guardianEmail)) {
    return NextResponse.json(
      {
        error: 'EMAIL_INVALID',
        message: 'Vul het e-mailadres van een ouder of wettelijk vertegenwoordiger in.',
        messageEn: 'Enter the email address of a parent or legal representative.',
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      email: true,
      dateOfBirth: true,
      preferredLanguage: true,
      stripeConnectAccountId: true,
      sellerActivatedAt: true,
      sellerRoles: true,
      country: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const age = resolveAgeEnforcement(user);
  if (age.mode !== 'MINOR') {
    return NextResponse.json(
      {
        error: 'CONSENT_NOT_REQUIRED',
        message: 'Voor dit account is geen ouderlijke toestemming nodig.',
        messageEn: 'This account does not need parental permission.',
      },
      { status: 400 },
    );
  }
  if (guardianEmail === (user.email ?? '').toLowerCase()) {
    return NextResponse.json(
      {
        error: 'GUARDIAN_EMAIL_SAME',
        message: 'Gebruik het e-mailadres van je ouder of wettelijk vertegenwoordiger, niet je eigen adres.',
        messageEn: 'Use your parent or legal representative’s email, not your own.',
      },
      { status: 400 },
    );
  }

  const invite = await createParentalConsentInvite(prisma, {
    userId: user.id,
    guardianEmail,
    username: user.username,
  });
  const link = `${getPublicAppUrl()}/account/ouderlijke-toestemming?token=${invite.token}`;
  const en = user.preferredLanguage === 'en';
  const who = user.username ? `@${user.username}` : 'een HomeCheff-account';
  const sent = await sendTransactionalEmail({
    to: guardianEmail,
    subject: en
      ? 'Permission requested for a HomeCheff account'
      : 'Toestemming gevraagd voor een HomeCheff-account',
    text: en
      ? `Someone (${who}) asked for your permission to sell on HomeCheff and set up payments. Open this link to accept or ignore it if you do not know this request: ${link}`
      : `Iemand (${who}) vraagt jouw toestemming om op HomeCheff te verkopen en betalingen in te stellen. Open deze link om toe te stemmen, of negeer de mail als je dit verzoek niet herkent: ${link}`,
    html: en
      ? `<p>Someone (<strong>${who}</strong>) asked for your permission to sell on HomeCheff and set up payments.</p><p><a href="${link}">Give permission</a></p><p>If you do not know this request, you can ignore this email.</p>`
      : `<p>Iemand (<strong>${who}</strong>) vraagt jouw toestemming om op HomeCheff te verkopen en betalingen in te stellen.</p><p><a href="${link}">Toestemming geven</a></p><p>Ken je dit verzoek niet, dan kun je deze e-mail negeren.</p>`,
    eventType: 'parental_consent_invite',
    priority: 'P1',
    idempotencyKey: `parental-consent:${user.id}:${invite.expiresAt.getTime()}`,
    route: '/api/account/parental-consent',
  });
  if (sent.status === 'failed') {
    return NextResponse.json(
      {
        error: 'EMAIL_FAILED',
        message: 'De e-mail kon niet worden verstuurd. Probeer het opnieuw.',
        messageEn: 'The email could not be sent. Try again.',
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    status: 'PENDING',
    message: 'We hebben een verzoek om toestemming verstuurd.',
    messageEn: 'We sent a permission request.',
  });
}

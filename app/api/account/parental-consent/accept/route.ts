import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { acceptParentalConsentToken, parentalConsentAcceptedCopy } from '@/lib/age/parental-consent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json(
      { error: 'INVALID', message: 'Deze link is ongeldig.' },
      { status: 400 },
    );
  }
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const result = await acceptParentalConsentToken(prisma, {
    token,
    acceptedIp: ip,
  });
  if (!result.ok) {
    const message =
      result.reason === 'EXPIRED'
        ? 'Deze link is verlopen. Vraag een nieuwe aan via het HomeCheff-account.'
        : result.reason === 'USED'
          ? 'Deze toestemming is al vastgelegd.'
          : 'Deze link is ongeldig.';
    return NextResponse.json({ error: result.reason, message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { username: true, preferredLanguage: true },
  });
  const pending = await prisma.auditLog.findFirst({
    where: { userId: result.userId, action: 'PARENTAL_CONSENT_ACTIVE' },
    orderBy: { createdAt: 'desc' },
    select: { meta: true },
  });
  const guardianEmail =
    pending?.meta &&
    typeof pending.meta === 'object' &&
    'guardianEmail' in pending.meta &&
    typeof (pending.meta as { guardianEmail?: unknown }).guardianEmail === 'string'
      ? (pending.meta as { guardianEmail: string }).guardianEmail
      : null;
  if (guardianEmail) {
    const revokeLink = `${getPublicAppUrl()}/account/ouderlijke-toestemming?revoke=${result.revokeToken}`;
    const copy = parentalConsentAcceptedCopy({
      en: user?.preferredLanguage === 'en',
      username: user?.username,
      revokeLink,
    });
    await sendTransactionalEmail({
      to: guardianEmail,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      eventType: 'parental_consent_accepted',
      priority: 'P1',
      idempotencyKey: `parental-consent-accepted:${result.userId}:${result.revokeToken.slice(0, 12)}`,
      route: '/api/account/parental-consent/accept',
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'Toestemming is vastgelegd. Het HomeCheff-account kan verder met verkopen.',
    messageEn: 'Permission is recorded. The HomeCheff account can continue with selling.',
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import {
  parentalConsentRevokedCopy,
  readGuardianContact,
  revokeParentalConsent,
} from '@/lib/age/parental-consent';
import type { GuardianLanguage } from '@/lib/age/parental-consent-copy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const revokeToken = typeof body.token === 'string' ? body.token.trim() : '';
  const session = await auth();
  const explicitLanguage: GuardianLanguage | null =
    body.guardianLanguage === 'nl' || body.guardianLanguage === 'en' ? body.guardianLanguage : null;

  if (!revokeToken && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string | null = null;
  if (!revokeToken && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const before = userId
    ? await readGuardianContact(prisma, userId)
    : { email: null as string | null, language: null as GuardianLanguage | null, username: null as string | null };

  const result = await revokeParentalConsent({
    prisma,
    userId,
    revokeToken: revokeToken || null,
    revokedIp: ip,
    revokedUserAgent: req.headers.get('user-agent'),
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'Er is geen actieve toestemming om in te trekken.',
        messageEn: 'There is no active consent to withdraw.',
      },
      { status: 404 },
    );
  }

  const contact = await readGuardianContact(prisma, result.userId);
  const email = contact.email ?? before.email;
  const language = explicitLanguage ?? contact.language ?? before.language ?? 'both';
  if (email) {
    const copy = parentalConsentRevokedCopy({
      language,
      username: contact.username ?? before.username,
    });
    await sendTransactionalEmail({
      to: email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      eventType: 'parental_consent_revoked',
      priority: 'P1',
      idempotencyKey: `parental-consent-revoked:${result.userId}:${Date.now()}`,
      route: '/api/account/parental-consent/revoke',
    });
  }

  return NextResponse.json({
    ok: true,
    message:
      'Toestemming is ingetrokken. Nieuwe verkopen zijn gepauzeerd. Bestaande bestellingen blijven staan.',
    messageEn:
      'Consent was withdrawn. New selling is paused. Existing orders stay in place.',
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { createHash } from 'crypto';
import {
  acceptParentalConsentToken,
  parentalConsentAcceptedCopy,
  readGuardianContact,
} from '@/lib/age/parental-consent';

export const dynamic = 'force-dynamic';

function failureMessage(reason: string): { message: string; messageEn: string } {
  if (reason === 'EXPIRED') {
    return {
      message: 'Deze link is verlopen. Vraag een nieuwe aan via het HomeCheff-account.',
      messageEn: 'This link has expired. Ask for a new one from the HomeCheff account.',
    };
  }
  if (reason === 'USED') {
    return {
      message: 'Deze toestemming is al vastgelegd.',
      messageEn: 'This consent has already been recorded.',
    };
  }
  if (reason === 'NAME_REQUIRED') {
    return {
      message: 'Vul je voor- en achternaam in.',
      messageEn: 'Enter your first and last name.',
    };
  }
  if (reason === 'RELATIONSHIP_REQUIRED') {
    return {
      message: 'Kies je relatie tot deze minderjarige.',
      messageEn: 'Choose your relationship to this minor.',
    };
  }
  if (reason === 'OTHER_AUTHORITY_REQUIRED') {
    return {
      message: 'Beschrijf waardoor je wettelijk bevoegd bent om deze toestemming te geven.',
      messageEn: 'Describe the legal authority that allows you to give this consent.',
    };
  }
  if (reason === 'DECLARATION_REQUIRED') {
    return {
      message: 'Vink de verklaring en de toestemming aan. Die staan niet vooraf aan.',
      messageEn: 'Tick the declaration and the consent. They are not pre-selected.',
    };
  }
  return {
    message: 'Deze link is ongeldig.',
    messageEn: 'This link is invalid.',
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    const copy = failureMessage('INVALID');
    return NextResponse.json({ error: 'INVALID', ...copy }, { status: 400 });
  }
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const result = await acceptParentalConsentToken(prisma, {
    token,
    guardianName: body.guardianName,
    relationship: body.relationship,
    otherAuthority: body.otherAuthority,
    legalAuthorityDeclaration: body.legalAuthorityDeclaration,
    informedConsent: body.informedConsent,
    guardianLanguage: body.guardianLanguage,
    acceptedIp: ip,
    acceptedUserAgent: req.headers.get('user-agent'),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason, ...failureMessage(result.reason) }, { status: 400 });
  }

  const contact = await readGuardianContact(prisma, result.userId);
  const language = result.guardianLanguage ?? contact.language ?? 'both';
  if (contact.email) {
    const revokeLink = `${getPublicAppUrl()}/account/ouderlijke-toestemming?revoke=${result.revokeToken}`;
    const copy = parentalConsentAcceptedCopy({
      language,
      username: contact.username,
      revokeLink,
    });
    const key = createHash('sha256').update(result.revokeToken).digest('hex').slice(0, 16);
    await sendTransactionalEmail({
      to: contact.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
      eventType: 'parental_consent_accepted',
      priority: 'P1',
      idempotencyKey: `parental-consent-accepted:${result.userId}:${key}`,
      route: '/api/account/parental-consent/accept',
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'Toestemming is vastgelegd. Het HomeCheff-account kan verder zodra betalingen apart zijn goedgekeurd.',
    messageEn: 'Consent is recorded. The HomeCheff account can continue once payments are separately approved.',
  });
}

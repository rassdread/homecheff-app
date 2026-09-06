import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import {
  evaluateContactSubmission,
  CONTACT_HONEYPOT_FIELD,
} from '@/lib/contact-security/evaluate';
import { escapeHtml } from '@/lib/contact-security/escape-html';
import { logContactSecurityEvent } from '@/lib/contact-security/logging';
import { getClientIp, hashForLog } from '@/lib/contact-security/client-ip';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY?.trim() && process.env.VERCEL_ENV === 'production') {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const lang =
      (typeof body.language === 'string' && body.language) ||
      req.cookies.get('homecheff-language')?.value ||
      req.headers.get('X-HomeCheff-Language') ||
      'nl';
    const isEnglish = lang === 'en';

    const gate = await evaluateContactSubmission(req, body);
    if (!gate.ok) {
      const headers = new Headers();
      if (gate.retryAfterSec) {
        headers.set('Retry-After', String(gate.retryAfterSec));
      }
      return NextResponse.json(
        {
          error:
            gate.status === 429
              ? isEnglish
                ? 'Too many requests. Please try again later.'
                : 'Te veel verzoeken. Probeer het later opnieuw.'
              : isEnglish
                ? 'Unable to send message. Please try again.'
                : 'Bericht kon niet worden verzonden. Probeer het opnieuw.',
          reason: gate.reason,
        },
        { status: gate.status, headers },
      );
    }

    const { name, email, subject, message } = gate;
    const submissionId = randomUUID();
    const contentHash = createHash('sha256')
      .update([email.toLowerCase(), subject, message].join('|'))
      .digest('hex')
      .slice(0, 24);

    const subjectMap: Record<string, { nl: string; en: string }> = {
      general: { nl: 'Algemene vraag', en: 'General question' },
      technical: { nl: 'Technische vraag', en: 'Technical question' },
      payment: { nl: 'Vraag over betaling', en: 'Payment question' },
      delivery: { nl: 'Vraag over bezorging', en: 'Delivery question' },
      account: { nl: 'Vraag over account', en: 'Account question' },
      other: { nl: 'Overige vraag', en: 'Other question' },
      feedback: { nl: 'Feedback', en: 'Feedback' },
    };

    const subjectText =
      subjectMap[subject]?.[isEnglish ? 'en' : 'nl'] ||
      (isEnglish ? 'Contact Form' : 'Contactformulier');
    const emailSubject = `${subjectText} - ${escapeHtml(name)}`;

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);
    const safeSubjectText = escapeHtml(subjectText);

    const supportResult = await sendTransactionalEmail({
      from: 'HomeCheff Contact <noreply@homecheff.eu>',
      to: ['support@homecheff.eu'],
      replyTo: email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isEnglish ? 'Contact Form' : 'Contactformulier'} - HomeCheff</title>
        </head>
        <body>
          <h1>${isEnglish ? 'New Contact Form' : 'Nieuw Contactformulier'}</h1>
          <p><strong>${isEnglish ? 'Name:' : 'Naam:'}</strong> ${safeName}</p>
          <p><strong>${isEnglish ? 'Email:' : 'E-mail:'}</strong> ${safeEmail}</p>
          <p><strong>${isEnglish ? 'Subject:' : 'Onderwerp:'}</strong> ${safeSubjectText}</p>
          <p style="white-space:pre-wrap;">${safeMessage}</p>
        </body>
        </html>
      `,
      eventType: 'contact_support',
      priority: EMAIL_PRIORITY.P1,
      route: 'contact',
      idempotencyKey: `contact-support:${submissionId}:${contentHash}`,
      intentionalResend: true,
      businessEventId: submissionId,
    });

    if (supportResult.status === 'failed') {
      console.error('Contact form email error:', supportResult.errorMessage.slice(0, 120));
      return NextResponse.json(
        {
          error: isEnglish
            ? 'Failed to send message. Please try again later.'
            : 'Bericht verzenden mislukt. Probeer het later opnieuw.',
        },
        { status: 500 },
      );
    }

    if (supportResult.status === 'suppressed' && supportResult.reason === 'missing_api_key') {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 503 },
      );
    }

    const ipHash = hashForLog(getClientIp(req));
    const uaHash = hashForLog(req.headers.get('user-agent') || '');
    await logContactSecurityEvent({
      outcome: 'accepted',
      ipHash,
      uaHash,
      meta: { spamScore: gate.spamScore },
    });

    // Confirmation — intentional second email per successful submission
    try {
      await sendTransactionalEmail({
        from: 'HomeCheff <noreply@homecheff.eu>',
        to: [email],
        subject: isEnglish
          ? 'Your message has been received - HomeCheff'
          : 'Je bericht is ontvangen - HomeCheff',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>HomeCheff</title></head>
          <body style="font-family:sans-serif;line-height:1.6;color:#333;">
            <h1>${isEnglish ? 'Thank you for your message!' : 'Bedankt voor je bericht!'}</h1>
            <p>${isEnglish ? `Hello ${safeName}!` : `Hallo ${safeName}!`}</p>
            <p>${
              isEnglish
                ? 'We have received your message and will respond as soon as possible, usually within 24 hours.'
                : 'We hebben je bericht ontvangen en zullen zo snel mogelijk reageren, meestal binnen 24 uur.'
            }</p>
            <p>HomeCheff · support@homecheff.eu</p>
          </body>
          </html>
        `,
        eventType: 'contact_confirmation',
        priority: EMAIL_PRIORITY.P2,
        route: 'contact',
        idempotencyKey: `contact-confirm:${submissionId}:${contentHash}`,
        intentionalResend: true,
        businessEventId: submissionId,
      });
    } catch (confirmationError) {
      console.error(
        'Confirmation email error:',
        confirmationError instanceof Error
          ? confirmationError.message.slice(0, 120)
          : 'error'
      );
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}

// Re-export for tests / docs
export { CONTACT_HONEYPOT_FIELD };

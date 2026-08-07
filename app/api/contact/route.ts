import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  evaluateContactSubmission,
  CONTACT_HONEYPOT_FIELD,
} from '@/lib/contact-security/evaluate';
import { escapeHtml } from '@/lib/contact-security/escape-html';
import { logContactSecurityEvent } from '@/lib/contact-security/logging';
import { getClientIp, hashForLog } from '@/lib/contact-security/client-ip';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
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
    const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { error } = await resend.emails.send({
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
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #006D52 0%, #005843 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: 600; color: #1f2937; margin-bottom: 8px; display: block; }
            .field-value { color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 8px; border-left: 3px solid #006D52; }
            .message-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .message-box p { color: #166534; margin: 0; white-space: pre-wrap; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #6b7280; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isEnglish ? 'New Contact Form' : 'Nieuw Contactformulier'}</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="field-label">${isEnglish ? 'Name:' : 'Naam:'}</span>
                <div class="field-value">${safeName}</div>
              </div>
              <div class="field">
                <span class="field-label">${isEnglish ? 'Email:' : 'E-mail:'}</span>
                <div class="field-value">${safeEmail}</div>
              </div>
              <div class="field">
                <span class="field-label">${isEnglish ? 'Subject:' : 'Onderwerp:'}</span>
                <div class="field-value">${safeSubjectText}</div>
              </div>
              <div class="message-box">
                <p>${safeMessage}</p>
              </div>
            </div>
            <div class="footer">
              <p>${isEnglish ? 'This message was sent via the contact form on HomeCheff' : 'Dit bericht is verzonden via het contactformulier op HomeCheff'}</p>
              <p>${isEnglish ? 'Reply directly to this email to reach the user' : 'Antwoord direct op deze e-mail om de gebruiker te bereiken'}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Contact form email error:', error);
      return NextResponse.json(
        {
          error: isEnglish
            ? 'Failed to send message. Please try again later.'
            : 'Bericht verzenden mislukt. Probeer het later opnieuw.',
        },
        { status: 500 },
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

    // Confirmation — only after support mail succeeded (never for rejected spam)
    try {
      await resend.emails.send({
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
      });
    } catch (confirmationError) {
      console.error('Confirmation email error:', confirmationError);
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

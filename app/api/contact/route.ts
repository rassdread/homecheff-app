import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, language } = await req.json();
    
    // Detect language from request (form data > cookie > header > default)
    const lang = language || req.cookies.get('homecheff-language')?.value || req.headers.get('X-HomeCheff-Language') || 'nl';
    const isEnglish = lang === 'en';

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send email to support
    const subjectMap: Record<string, { nl: string; en: string }> = {
      general: { nl: 'Algemene vraag', en: 'General question' },
      technical: { nl: 'Technische vraag', en: 'Technical question' },
      payment: { nl: 'Vraag over betaling', en: 'Payment question' },
      delivery: { nl: 'Vraag over bezorging', en: 'Delivery question' },
      account: { nl: 'Vraag over account', en: 'Account question' },
      other: { nl: 'Overige vraag', en: 'Other question' }
    };

    const subjectText = subjectMap[subject]?.[isEnglish ? 'en' : 'nl'] || (isEnglish ? 'Contact Form' : 'Contactformulier');
    const emailSubject = `${subjectText} - ${name}`;

    const { data, error } = await resend.emails.send({
      from: 'HomeCheff Contact <noreply@homecheff.nl>',
      to: ['support@homecheff.nl'],
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
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field">
                <span class="field-label">${isEnglish ? 'Email:' : 'E-mail:'}</span>
                <div class="field-value">${email}</div>
              </div>
              
              <div class="field">
                <span class="field-label">${isEnglish ? 'Subject:' : 'Onderwerp:'}</span>
                <div class="field-value">${subjectText}</div>
              </div>
              
              <div class="message-box">
                <p>${message}</p>
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
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: 'HomeCheff <noreply@homecheff.nl>',
        to: [email],
        subject: isEnglish ? 'Your message has been received - HomeCheff' : 'Je bericht is ontvangen - HomeCheff',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${isEnglish ? 'Message Received' : 'Bericht Ontvangen'} - HomeCheff</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #006D52 0%, #005843 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
              .content { padding: 30px; }
              .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; }
              .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
              .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .highlight p { color: #166534; margin: 0; font-weight: 500; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
              .footer p { color: #6b7280; font-size: 12px; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${isEnglish ? 'Thank you for your message!' : 'Bedankt voor je bericht!'}</h1>
              </div>
              
              <div class="content">
                <h2>${isEnglish ? `Hello ${name}!` : `Hallo ${name}!`}</h2>
                
                <p>${isEnglish ? 'We have received your message and will respond as soon as possible, usually within 24 hours.' : 'We hebben je bericht ontvangen en zullen zo snel mogelijk reageren, meestal binnen 24 uur.'}</p>
                
                <div class="highlight">
                  <p>📧 ${isEnglish ? 'You can also reach us directly at support@homecheff.nl' : 'Je kunt ons ook direct bereiken via support@homecheff.nl'}</p>
                </div>
                
                <p>${isEnglish ? 'Best regards,<br>The HomeCheff Team' : 'Met vriendelijke groet,<br>Het HomeCheff Team'}</p>
              </div>
              
              <div class="footer">
                <p>HomeCheff B.V. | <a href="mailto:support@homecheff.nl" style="color: #006D52;">support@homecheff.nl</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (confirmationError) {
      // Don't fail the request if confirmation email fails
      console.error('Confirmation email error:', confirmationError);
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}


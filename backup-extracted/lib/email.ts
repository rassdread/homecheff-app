import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailVerificationData {
  email: string;
  name: string;
  verificationToken: string;
  verificationCode?: string;
}

export async function sendVerificationEmail({ email, name, verificationToken, verificationCode }: EmailVerificationData) {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}/verify-email?token=${verificationToken}`;
    
    const { data, error } = await resend.emails.send({
      from: 'HomeCheff <noreply@homecheff.nl>',
      to: [email],
      subject: 'Bevestig je e-mailadres - HomeCheff',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>E-mail Verificatie - HomeCheff</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #006D52 0%, #005843 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
            .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #006D52 0%, #005843 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .button:hover { background: linear-gradient(135deg, #005843 0%, #004634 100%); }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #6b7280; font-size: 14px; margin: 0; }
            .logo { width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #006D52; }
            .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .highlight p { color: #166534; margin: 0; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">H</div>
              <h1>Welkom bij HomeCheff!</h1>
            </div>
            
            <div class="content">
              <h2>Hallo ${name}! 👋</h2>
              
              <p>Bedankt voor je aanmelding bij HomeCheff! We zijn blij dat je deel wilt uitmaken van onze lokale community.</p>
              
              <div class="highlight">
                <p>📧 Om je account te activeren, moet je eerst je e-mailadres bevestigen.</p>
              </div>
              
              ${verificationCode ? `
              <div style="background: #f0fdf4; border: 2px solid #006D52; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
                <p style="color: #005843; margin: 0 0 12px 0; font-weight: 600; font-size: 14px;">Je verificatiecode:</p>
                <div style="font-size: 36px; font-weight: 700; color: #006D52; letter-spacing: 8px; font-family: monospace;">
                  ${verificationCode}
                </div>
                <p style="color: #005843; margin: 12px 0 0 0; font-size: 12px;">Of klik op de knop hieronder</p>
              </div>
              ` : ''}
              
              <p>Klik op de onderstaande knop om je e-mailadres te verifiëren en je account te activeren:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Bevestig E-mailadres</a>
              </div>
              
              <p>Of kopieer en plak deze link in je browser:</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #374151;">${verificationUrl}</p>
              
              <p><strong>Let op:</strong> Deze link is 24 uur geldig. Als de link is verlopen, kun je een nieuwe verificatie-e-mail aanvragen.</p>
              
              <p>Na verificatie kun je:</p>
              <ul style="color: #6b7280; padding-left: 20px;">
                <li>Producten kopen en verkopen</li>
                <li>Lokale makers ontdekken</li>
                <li>Deel uitmaken van de community</li>
                <li>Je profiel personaliseren</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Met vriendelijke groet,<br>Het HomeCheff Team</p>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Als je deze e-mail niet hebt aangevraagd, kun je deze negeren.<br>
                HomeCheff B.V. | <a href="mailto:support@homecheff.nl" style="color: #006D52;">support@homecheff.nl</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Email service unavailable');
  }
}

/**
 * Send review request email to buyer after order completion
 */
export async function sendReviewRequestEmail(data: {
  email: string;
  buyerName: string;
  orderNumber: string;
  productTitle: string;
  productImage?: string;
  reviewToken: string;
  sellerName: string;
}) {
  try {
    const { renderReviewRequestEmail, getReviewRequestSubject } = await import('./email-templates/review-request');
    const reviewUrl = `${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}/review/${data.reviewToken}`;
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'HomeCheff <noreply@homecheff.nl>',
      to: [data.email],
      subject: getReviewRequestSubject(data.buyerName, data.productTitle),
      html: renderReviewRequestEmail({
        buyerEmail: data.email,
        buyerName: data.buyerName,
        orderNumber: data.orderNumber,
        productTitle: data.productTitle,
        productImage: data.productImage,
        reviewToken: data.reviewToken,
        reviewUrl: reviewUrl,
        sellerName: data.sellerName
      })
    });

    if (error) {
      console.error('Review request email sending error:', error);
      throw new Error('Failed to send review request email');
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Review request email service error:', error);
    throw new Error('Email service unavailable');
  }
}

export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HomeCheff <noreply@homecheff.nl>',
      to: [email],
      subject: 'Welkom bij HomeCheff! Je account is geactiveerd 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welkom - HomeCheff</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
            .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .button:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
            .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #6b7280; font-size: 14px; margin: 0; }
            .logo { width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #10b981; }
            .success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .success p { color: #166534; margin: 0; font-weight: 500; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .feature-icon { font-size: 32px; margin-bottom: 10px; }
            .feature h3 { color: #1f2937; margin: 0 0 10px 0; font-size: 16px; font-weight: 600; }
            .feature p { color: #6b7280; margin: 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">H</div>
              <h1>Welkom bij HomeCheff! 🎉</h1>
            </div>
            
            <div class="content">
              <h2>Hallo ${name}! Je account is geactiveerd</h2>
              
              <div class="success">
                <p>✅ Je e-mailadres is succesvol geverifieerd en je account is nu volledig actief!</p>
              </div>
              
              <p>Je kunt nu volledig gebruikmaken van alle functies van HomeCheff. Hier zijn enkele dingen die je kunt doen:</p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🛍️</div>
                  <h3>Ontdek Producten</h3>
                  <p>Vind verse producten en unieke creaties van lokale makers</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">👥</div>
                  <h3>Maak Contact</h3>
                  <p>Chat met verkopers en stel vragen over producten</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">⭐</div>
                  <h3>Bewaar Favorieten</h3>
                  <p>Bewaar je favoriete producten en makers</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📍</div>
                  <h3>Lokale Community</h3>
                  <p>Ontdek wat er in jouw buurt gebeurt</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}" class="button">Start Verkennen</a>
              </div>
              
              <p>Heb je vragen? Neem gerust contact met ons op via <a href="mailto:support@homecheff.nl" style="color: #006D52;">support@homecheff.nl</a></p>
            </div>
            
            <div class="footer">
              <p>Veel plezier op HomeCheff!<br>Het HomeCheff Team</p>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                HomeCheff B.V. | <a href="mailto:support@homecheff.nl" style="color: #006D52;">support@homecheff.nl</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Welcome email sending error:', error);
      throw new Error('Failed to send welcome email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Welcome email service error:', error);
    throw new Error('Email service unavailable');
  }
}

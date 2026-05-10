import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { getTransactionalFrom } from '@/lib/email-from';
import { logEmailSendFailure } from '@/lib/email-log';
import { sanitizeAdminBroadcastRoute } from '@/lib/admin/sanitize-admin-broadcast-route';
import { sendAdminBroadcastFcm } from '@/lib/admin/admin-broadcast-fcm';

export const dynamic = 'force-dynamic';

const MAX_RECIPIENTS = 5000;
const EMAIL_BATCH_SIZE = 25;
const EMAIL_BATCH_PAUSE_MS = 600;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const targetType = typeof body?.targetType === 'string' ? body.targetType.trim() : '';
    const sendNotification = Boolean(body?.sendNotification);
    const sendEmail = Boolean(body?.sendEmail);
    const subject =
      typeof body?.subject === 'string' ? body.subject.trim() : '';
    const titleRaw = typeof body?.title === 'string' ? body.title.trim() : '';
    const routeRaw = body?.route;

    if (!message || !targetType) {
      return NextResponse.json(
        { error: 'Message and targetType are required' },
        { status: 400 }
      );
    }

    if (!sendNotification && !sendEmail) {
      return NextResponse.json(
        { error: 'Select at least one delivery method (notification or email)' },
        { status: 400 }
      );
    }

    if (sendEmail && !subject) {
      return NextResponse.json(
        { error: 'Email subject is required when sending email' },
        { status: 400 }
      );
    }

    let targetUsers: { id: string; email: string | null; name: string | null }[] = [];

    if (targetType === 'all') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: { role: { not: 'ADMIN' } },
      });
    } else if (targetType === 'sellers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: { role: 'SELLER' },
      });
    } else if (targetType === 'buyers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: { role: 'BUYER' },
      });
    } else if (targetType === 'delivery') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: { DeliveryProfile: { isNot: null } },
      });
    } else {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    if (targetUsers.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        {
          error: `Too many recipients (max ${MAX_RECIPIENTS}). Narrow the audience or split the send.`,
        },
        { status: 400 }
      );
    }

    const broadcastId = randomUUID();
    const safeRoute = sanitizeAdminBroadcastRoute(routeRaw);
    const pushTitle =
      titleRaw.length > 0 ? titleRaw.slice(0, 120) : 'HomeCheff';
    const emailSubject = subject || 'Bericht van HomeCheff Admin';

    const payload = {
      title: pushTitle,
      body: message,
      message,
      from: 'Admin',
      timestamp: new Date().toISOString(),
      link: safeRoute,
      broadcastId,
      data: {
        type: 'ADMIN_ANNOUNCEMENT',
        route: safeRoute,
      },
    };

    let notificationsCreated = 0;
    let pushSuccess = 0;
    let pushFailures = 0;
    let pushTokensAttempted = 0;

    if (sendNotification) {
      const { count } = await prisma.notification.createMany({
        data: targetUsers.map((user) => ({
          id: randomUUID(),
          userId: user.id,
          type: 'ADMIN_NOTICE',
          payload,
        })),
      });
      notificationsCreated = count;

      const push = await sendAdminBroadcastFcm({
        userIds: targetUsers.map((u) => u.id),
        title: pushTitle,
        body: message.slice(0, 500),
        route: safeRoute,
        broadcastId,
      });
      pushSuccess = push.success;
      pushFailures = push.failures;
      pushTokensAttempted = push.tokensAttempted;
    }

    let emailsSent = 0;
    if (sendEmail) {
      if (!process.env.RESEND_API_KEY?.trim()) {
        return NextResponse.json(
          { error: 'RESEND_API_KEY is not configured; cannot send email.' },
          { status: 503 }
        );
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      const withEmail = targetUsers.filter((u) => u.email);

      for (let i = 0; i < withEmail.length; i += EMAIL_BATCH_SIZE) {
        const batch = withEmail.slice(i, i + EMAIL_BATCH_SIZE);
        const outcomes = await Promise.all(
          batch.map(async (user) => {
            try {
              const { error } = await resend.emails.send({
                from: getTransactionalFrom(),
                to: [user.email!],
                subject: emailSubject,
                html: emailHtml(emailSubject, user.name, message),
              });
              if (error) {
                logEmailSendFailure('admin_broadcast_email', error, {
                  recipientEmail: user.email!,
                });
                return false;
              }
              return true;
            } catch (e) {
              logEmailSendFailure('admin_broadcast_email', e, {
                recipientEmail: user.email!,
              });
              return false;
            }
          })
        );
        emailsSent += outcomes.filter(Boolean).length;
        if (i + EMAIL_BATCH_SIZE < withEmail.length) {
          await new Promise((r) => setTimeout(r, EMAIL_BATCH_PAUSE_MS));
        }
      }
    }

    const parts: string[] = [];
    if (notificationsCreated > 0) {
      parts.push(`${notificationsCreated} in-app notificatie(s)`);
    }
    if (pushTokensAttempted > 0) {
      parts.push(`${pushSuccess} push(s) afgeleverd (${pushFailures} mislukt)`);
    }
    if (emailsSent > 0) {
      parts.push(`${emailsSent} e-mail(s)`);
    }

    return NextResponse.json({
      success: true,
      notificationsCreated,
      emailsSent,
      push: {
        tokensAttempted: pushTokensAttempted,
        success: pushSuccess,
        failures: pushFailures,
      },
      message: parts.length ? parts.join(' · ') : 'Geen verzending uitgevoerd',
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin/notifications/send]', error);
    } else {
      console.error(
        '[admin/notifications/send]',
        error instanceof Error ? error.message.slice(0, 200) : 'error'
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailHtml(subject: string, name: string | null, message: string): string {
  const safeName = escapeHtml(name || 'Gebruiker');
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(message);
  return `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${safeSubject}</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
                  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                  .header { background: linear-gradient(135deg, #006D52 0%, #005843 100%); padding: 40px 30px; text-align: center; }
                  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
                  .content { padding: 40px 30px; }
                  .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
                  .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
                  .message-box { background: #f9fafb; border-left: 4px solid #006D52; padding: 20px; margin: 20px 0; border-radius: 4px; }
                  .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
                  .footer p { color: #6b7280; font-size: 14px; margin: 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>HomeCheff</h1>
                  </div>
                  <div class="content">
                    <h2>Hallo ${safeName}!</h2>
                    <p>Je hebt een bericht ontvangen van het HomeCheff-team:</p>
                    <div class="message-box">
                      <p style="white-space: pre-wrap; margin: 0;">${safeBody}</p>
                    </div>
                    <p>Je kunt dit bericht ook in de app bekijken onder meldingen.</p>
                  </div>
                  <div class="footer">
                    <p>Met vriendelijke groet,<br>Het HomeCheff-team</p>
                  </div>
                </div>
              </body>
              </html>
            `;
}

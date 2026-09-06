import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  claimAdminBroadcastIdempotencyKey,
  evaluateAdminEmailBlast,
} from '@/lib/email/admin-blast-guard';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { getTransactionalFrom } from '@/lib/email-from';

export const dynamic = 'force-dynamic';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const userIds = body?.userIds;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const type = body?.type;
    const subject =
      typeof body?.subject === 'string' ? body.subject.trim() : 'Bericht van HomeCheff Admin';
    const sendEmail = body?.sendEmail !== false;
    const confirmEmailBlast = Boolean(body?.confirmEmailBlast);
    const dryRun = Boolean(body?.dryRun);
    const idempotencyKey =
      request.headers.get('idempotency-key')?.trim() ||
      (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '');

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    const withEmail = users.filter((u) => u.email);
    const blastGate = evaluateAdminEmailBlast({
      sendEmail,
      emailRecipientCount: withEmail.length,
      targetType: userIds.length > 50 ? 'all' : 'custom',
      confirmEmailBlast,
      idempotencyKey,
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        targetCount: users.length,
        emailRecipientCount: withEmail.length,
        requiresConfirm: blastGate.ok ? blastGate.requiresConfirm : true,
        gate: blastGate.ok ? 'ok' : blastGate.code,
        message: blastGate.ok
          ? `Preview: ${withEmail.length} e-mails zouden worden verstuurd.`
          : blastGate.error,
      });
    }

    if (sendEmail && !blastGate.ok) {
      return NextResponse.json(
        {
          error: blastGate.error,
          code: blastGate.code,
          emailRecipientCount: blastGate.emailRecipientCount,
          softMax: blastGate.softMax,
          hardMax: blastGate.hardMax,
          requiresConfirm: true,
        },
        { status: 400 }
      );
    }

    if (sendEmail && idempotencyKey && !claimAdminBroadcastIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        {
          error: 'Deze bulk-actie is al uitgevoerd (idempotency).',
          code: 'IDEMPOTENT_REPLAY',
          notificationsSent: 0,
          emailsSent: 0,
        },
        { status: 200 }
      );
    }

    const broadcastId = randomUUID();

    const notifications = await Promise.all(
      users.map((u) =>
        prisma.notification.create({
          data: {
            id: `bulk-${Date.now()}-${u.id}`,
            userId: u.id,
            type: 'ADMIN_NOTICE',
            payload: {
              title: subject || 'Bericht van HomeCheff Admin',
              message,
              from: 'admin',
              bulkMessage: true,
              messageType: type,
              broadcastId,
            },
          },
        })
      )
    );

    let emailsSent = 0;
    if (sendEmail) {
      const safeMessage = escapeHtml(message);
      for (const u of withEmail) {
        const result = await sendTransactionalEmail({
          from: getTransactionalFrom(),
          to: [u.email!],
          subject: subject || 'Bericht van HomeCheff Admin',
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Bericht van HomeCheff Admin</title></head>
            <body>
              <h2>Hallo ${escapeHtml(u.name || 'Gebruiker')}!</h2>
              <p>Je hebt een bericht ontvangen van het HomeCheff admin team:</p>
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </body>
            </html>
          `,
          eventType: 'admin_bulk_message',
          priority: EMAIL_PRIORITY.P2,
          route: 'admin/send-bulk-message',
          idempotencyKey: `admin-bulk:${broadcastId}:${u.id}`,
          businessEventId: broadcastId,
        });
        if (result.status === 'sent') emailsSent += 1;
      }

      console.info(
        '[admin_email_blast]',
        JSON.stringify({
          broadcastId,
          route: 'send-bulk-message',
          emailRecipientCount: withEmail.length,
          emailsSent,
          adminEmail: session.user.email,
          ts: Date.now(),
        })
      );
    }

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.length,
      emailsSent,
      message: `Bericht succesvol verzonden naar ${notifications.length} gebruikers`,
    });
  } catch (error) {
    console.error(
      'Error sending bulk message:',
      error instanceof Error ? error.message.slice(0, 200) : 'error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

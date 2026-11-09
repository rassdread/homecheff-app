import { requireMappedAdminCapability } from '@/lib/admin-guard';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  claimAdminBroadcastIdempotencyKey,
  evaluateAdminEmailBlast,
} from '@/lib/email/admin-blast-guard';
import {
  attemptFromTransactionalResult,
  reportAdminBulkReplay,
  reportAdminBulkSend,
  type AdminBulkEmailAttempt,
} from '@/lib/email/admin-bulk-delivery';
import { sendSelectedUserPush } from '@/lib/admin/admin-selected-push';
import {
  renderAdminBulkMessage,
  resolveAdminEmailAction,
} from '@/lib/email/admin-bulk-message-content';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { getTransactionalFrom } from '@/lib/email-from';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const mappedGuard = await requireMappedAdminCapability(request);
  if (!mappedGuard.ok) return mappedGuard.response;
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
    const type =
      body?.type === 'push' || body?.type === 'both' || body?.type === 'email'
        ? body.type
        : 'email';
    const subject =
      typeof body?.subject === 'string' ? body.subject.trim() : 'Bericht van HomeCheff Admin';
    const sendEmail =
      typeof body?.sendEmail === 'boolean' ? body.sendEmail : type !== 'push';
    const sendPush = type === 'push' || type === 'both';
    const action = sendEmail
      ? resolveAdminEmailAction(body?.buttonLabel, body?.buttonUrl)
      : { ok: true as const, action: null };
    if (!action.ok) {
      return NextResponse.json({ error: action.error, message: action.error }, { status: 400 });
    }
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
      const replay = reportAdminBulkReplay();
      return NextResponse.json(
        {
          ...replay,
          error: replay.message,
          code: 'IDEMPOTENT_REPLAY',
        },
        { status: replay.httpStatus }
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

    const attempts: AdminBulkEmailAttempt[] = [];
    if (sendEmail) {
      for (const u of withEmail) {
        const rendered = renderAdminBulkMessage({
          recipientName: u.name || '',
          message,
          action: action.action,
        });
        const result = await sendTransactionalEmail({
          from: getTransactionalFrom(),
          to: [u.email!],
          subject: subject || 'Bericht van HomeCheff Admin',
          html: rendered.html,
          text: rendered.text,
          eventType: 'admin_bulk_message',
          priority: EMAIL_PRIORITY.P2,
          route: 'admin/send-bulk-message',
          allowDuringP2Pause: true,
          idempotencyKey: `admin-bulk:${broadcastId}:${u.id}`,
          businessEventId: broadcastId,
        });
        attempts.push(attemptFromTransactionalResult(result));
      }
    }

    const push = sendPush
      ? await sendSelectedUserPush({
          userIds: users.map((u) => u.id),
          title: subject || 'Bericht van HomeCheff Admin',
          body: message,
          broadcastId,
        })
      : undefined;

    const report = reportAdminBulkSend({
      emailRequested: sendEmail,
      notificationsSent: notifications.length,
      attempts,
      push,
    });

    const blastLog = JSON.stringify({
      broadcastId,
      route: 'send-bulk-message',
      outcome: report.outcome,
      emailRecipientCount: withEmail.length,
      emailsAttempted: report.emailsAttempted,
      emailsSent: report.emailsSent,
      emailsFailed: report.emailsFailed,
      emailsSuppressed: report.emailsSuppressed,
      adminEmail: session.user.email,
      ts: Date.now(),
    });
    if (report.success) {
      console.info('[admin_email_blast]', blastLog);
    } else if (sendEmail) {
      console.error('[admin_email_blast]', blastLog);
    }

    return NextResponse.json(
      {
        success: report.success,
        outcome: report.outcome,
        notificationsSent: report.notificationsSent,
        emailsAttempted: report.emailsAttempted,
        emailsSent: report.emailsSent,
        emailsFailed: report.emailsFailed,
        emailsSuppressed: report.emailsSuppressed,
        emailRequested: report.emailRequested ?? sendEmail,
        pushRequested: Boolean(sendPush),
        pushStatus: report.pushStatus,
        pushOffered: report.pushOffered ?? 0,
        pushFailed: report.pushFailed ?? 0,
        pushTokens: report.pushTokens ?? 0,
        message: report.message,
      },
      { status: report.httpStatus }
    );
  } catch (error) {
    console.error(
      'Error sending bulk message:',
      error instanceof Error ? error.message.slice(0, 200) : 'error'
    );
    return NextResponse.json(
      {
        success: false,
        outcome: 'failed',
        error: 'De verzending is op de server vastgelopen. Er is niet bevestigd dat de e-mail is aangeboden.',
        message:
          'De verzending is op de server vastgelopen. Er is niet bevestigd dat de e-mail is aangeboden.',
      },
      { status: 500 }
    );
  }
}

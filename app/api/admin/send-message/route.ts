import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';
import { getTransactionalFrom } from '@/lib/email-from';

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

    const { deliveryProfileId, message, type, subject } = await request.json();

    if (!deliveryProfileId || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { id: deliveryProfileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
    }

    const notification = await prisma.notification.create({
      data: {
        id: `admin-${Date.now()}-${deliveryProfile.userId}`,
        userId: deliveryProfile.userId,
        type: 'ADMIN_NOTICE',
        payload: {
          title: subject || 'Bericht van HomeCheff Admin',
          message: message,
          from: 'admin',
          deliveryProfileId: deliveryProfileId,
          messageType: type,
        },
      },
    });

    if (deliveryProfile.user.email) {
      try {
        const eventId = randomUUID();
        await sendTransactionalEmail({
          from: getTransactionalFrom(),
          to: [deliveryProfile.user.email],
          subject: subject || 'Bericht van HomeCheff Admin',
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Bericht van HomeCheff Admin</title></head>
            <body>
              <h2>Hallo ${escapeHtml(deliveryProfile.user.name || 'Gebruiker')}!</h2>
              <p>Je hebt een bericht ontvangen van het HomeCheff admin team:</p>
              <p style="white-space: pre-wrap;">${escapeHtml(String(message))}</p>
            </body>
            </html>
          `,
          eventType: 'admin_direct_message',
          priority: EMAIL_PRIORITY.P2,
          route: 'admin/send-message',
          idempotencyKey: `admin-dm:${eventId}:${deliveryProfile.userId}`,
          intentionalResend: true,
          businessEventId: notification.id,
        });
      } catch (emailError) {
        console.error(
          'Failed to send email notification:',
          emailError instanceof Error ? emailError.message.slice(0, 120) : 'error'
        );
      }
    }

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      message: 'Bericht succesvol verzonden',
    });
  } catch (error) {
    console.error(
      'Error sending message:',
      error instanceof Error ? error.message.slice(0, 200) : 'error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

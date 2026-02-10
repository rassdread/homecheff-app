import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIds, message, type, subject } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get users to send messages to
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            id: `bulk-${Date.now()}-${user.id}`,
            userId: user.id,
            type: 'ADMIN_NOTICE',
            payload: {
              title: subject || 'Bericht van HomeCheff Admin',
              message: message,
              from: 'admin',
              bulkMessage: true,
              messageType: type
            }
          }
        })
      )
    );

    // Send email notifications to users with email addresses
    const emailPromises = users
      .filter(user => user.email)
      .map(user => 
        resend.emails.send({
          from: 'HomeCheff <noreply@homecheff.nl>',
          to: [user.email!],
          subject: subject || 'Bericht van HomeCheff Admin',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Bericht van HomeCheff Admin</title>
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
                  <h1>HomeCheff Admin Bericht</h1>
                </div>
                <div class="content">
                  <h2>Hallo ${user.name || 'Gebruiker'}!</h2>
                  <p>Je hebt een bericht ontvangen van het HomeCheff admin team:</p>
                  <div class="message-box">
                    <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                  </div>
                  <p>Je kunt dit bericht ook bekijken in je HomeCheff account.</p>
                </div>
                <div class="footer">
                  <p>Met vriendelijke groet,<br>Het HomeCheff Team</p>
                </div>
              </div>
            </body>
            </html>
          `
        }).catch(err => {
          console.error(`Failed to send email to ${user.email}:`, err);
          return null; // Continue even if email fails
        })
      );

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ 
      success: true, 
      notificationsSent: notifications.length,
      message: `Bericht succesvol verzonden naar ${notifications.length} gebruikers`
    });

  } catch (error) {
    console.error('Error sending bulk message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

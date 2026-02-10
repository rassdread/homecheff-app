import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { message, targetType, sendNotification, sendEmail, subject } = await req.json();

    if (!message || !targetType) {
      return NextResponse.json({ error: 'Message and targetType are required' }, { status: 400 });
    }

    // At least one delivery method must be selected
    if (!sendNotification && !sendEmail) {
      return NextResponse.json({ error: 'Select at least one delivery method (notification or email)' }, { status: 400 });
    }

    // Get target users based on targetType (with email for email sending)
    let targetUsers: { id: string; email: string | null; name: string | null }[] = [];

    if (targetType === 'all') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: {
          role: { not: 'ADMIN' } // Don't send to other admins
        }
      });
    } else if (targetType === 'sellers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: {
          role: 'SELLER'
        }
      });
    } else if (targetType === 'buyers') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: {
          role: 'BUYER'
        }
      });
    } else if (targetType === 'delivery') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        where: {
          DeliveryProfile: { isNot: null }
        }
      });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    let notificationsCreated = 0;
    let emailsSent = 0;

    // Create notifications if requested
    if (sendNotification) {
      const notifications = await Promise.all(
        targetUsers.map(user => 
          prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              type: 'ADMIN_NOTICE',
              payload: {
                message,
                from: 'Admin',
                timestamp: new Date().toISOString()
              }
            }
          })
        )
      );
      notificationsCreated = notifications.length;
    }

    // Send emails if requested
    if (sendEmail) {
      const emailSubject = subject || 'Bericht van HomeCheff Admin';
      const emailPromises = targetUsers
        .filter(user => user.email)
        .map(user => 
          resend.emails.send({
            from: 'HomeCheff <noreply@homecheff.nl>',
            to: [user.email!],
            subject: emailSubject,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${emailSubject}</title>
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

      const emailResults = await Promise.allSettled(emailPromises);
      emailsSent = emailResults.filter(result => result.status === 'fulfilled' && result.value !== null).length;
    }

    const messages: string[] = [];
    if (notificationsCreated > 0) {
      messages.push(`${notificationsCreated} notificatie(s) verzonden`);
    }
    if (emailsSent > 0) {
      messages.push(`${emailsSent} email(s) verzonden`);
    }

    return NextResponse.json({ 
      success: true, 
      notificationsCreated,
      emailsSent,
      message: messages.join(' en ')
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

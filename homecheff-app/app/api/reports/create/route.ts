import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { entityId, entityType, reason, description, entityTitle } = await req.json();

    if (!entityId || !entityType || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has already reported this entity
    const existingReport = await prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'USER_REPORT',
        entityType: entityType,
        entityId: entityId,
        userId: session.user.id
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: 'Je hebt dit item al eerder gemeld' }, { status: 400 });
    }

    // Create the report
    const report = await prisma.analyticsEvent.create({
      data: {
        eventType: 'USER_REPORT',
        entityType: entityType,
        entityId: entityId,
        userId: session.user.id,
        metadata: {
          reason,
          description: description || '',
          entityTitle: entityTitle || '',
          reportedAt: new Date().toISOString(),
          status: 'pending'
        }
      }
    });

    // Send notification to admins
    await notifyAdmins(report.id, entityType, reason, entityTitle);

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      message: 'Melding succesvol verzonden. We bekijken dit zo snel mogelijk.'
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

async function notifyAdmins(reportId: string, entityType: string, reason: string, entityTitle?: string) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    });

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            id: `report-${reportId}-${admin.id}`,
            userId: admin.id,
            type: 'CONTENT_REPORT',
            payload: {
              title: 'Nieuwe content melding',
              message: `Nieuwe melding ontvangen voor ${entityType.toLowerCase()}: ${reason}`,
              reportId: reportId,
              entityType: entityType,
              reason: reason,
              entityTitle: entityTitle || 'Geen titel',
              reportedAt: new Date().toISOString()
            }
          }
        }).catch(error => {
          console.error(`Failed to create notification for admin ${admin.id}:`, error);
          return null;
        })
      )
    );

    console.log(`Created ${notifications.filter(n => n).length} admin notifications for report ${reportId}`);

  } catch (error) {
    console.error('Error notifying admins:', error);
    // Don't fail the report creation if notifications fail
  }
}

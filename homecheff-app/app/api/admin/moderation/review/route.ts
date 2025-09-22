import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);

  if (!session || (session as any).user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { logId, action } = await req.json();

    if (!logId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Find the moderation event
    const event = await prisma.analyticsEvent.findUnique({
      where: { id: logId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Moderation log not found' }, { status: 404 });
    }

    // Update the metadata with manual review result
    const updatedMetadata = {
      ...(event.metadata as any),
      manualReview: {
        action,
        reviewedBy: (session as any).user?.id || 'unknown',
        reviewedAt: new Date().toISOString(),
        status: action === 'approve' ? 'approved' : 'rejected'
      }
    };

    await prisma.analyticsEvent.update({
      where: { id: logId },
      data: {
        metadata: updatedMetadata
      }
    });

    // Log the manual review action
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'MANUAL_MODERATION_REVIEW',
        entityType: 'IMAGE',
        entityId: logId,
        userId: (session as any).user?.id || 'unknown',
        metadata: {
          originalLogId: logId,
          action,
          imageUrl: (event.metadata as any)?.imageUrl,
          category: (event.metadata as any)?.category,
          productTitle: (event.metadata as any)?.productTitle
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing manual review:', error);
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
  }
}

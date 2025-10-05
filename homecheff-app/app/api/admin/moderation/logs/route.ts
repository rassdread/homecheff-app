import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any);

  if (!session || (session as any).user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get moderation logs from analytics events
    const moderationEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'CONTENT_MODERATION',
        entityType: 'IMAGE'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Transform events to moderation logs
    const logs = moderationEvents.map(event => ({
      id: event.id,
      userId: event.userId || 'unknown',
      userName: 'Onbekende gebruiker',
      imageUrl: (event.metadata as any)?.imageUrl || '',
      category: (event.metadata as any)?.category || 'UNKNOWN',
      productTitle: (event.metadata as any)?.productTitle || '',
      result: {
        isAppropriate: (event.metadata as any)?.isAppropriate || false,
        confidence: (event.metadata as any)?.confidence || 0,
        violations: (event.metadata as any)?.violations || [],
        detectedObjects: (event.metadata as any)?.detectedObjects || [],
        categoryMatch: (event.metadata as any)?.categoryMatch || false,
        recommendedCategory: (event.metadata as any)?.recommendedCategory
      },
      timestamp: event.createdAt.toISOString(),
      status: getModerationStatus(event.metadata as any)
    }));

    // Calculate stats
    const stats = {
      totalImages: logs.length,
      approvedImages: logs.filter(log => log.status === 'approved').length,
      rejectedImages: logs.filter(log => log.status === 'rejected').length,
      pendingReview: logs.filter(log => log.status === 'pending_review').length,
      violationsByType: calculateViolationStats(logs),
      categoryAccuracy: calculateCategoryAccuracy(logs)
    };

    return NextResponse.json({ logs, stats });

  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    return NextResponse.json({ error: 'Failed to fetch moderation logs' }, { status: 500 });
  }
}

function getModerationStatus(metadata: any): 'approved' | 'rejected' | 'pending_review' {
  if (!metadata) return 'pending_review';
  
  if (metadata.isAppropriate && metadata.isValidForCategory) {
    return 'approved';
  }
  
  if (!metadata.isAppropriate || metadata.violations?.length > 0) {
    return 'rejected';
  }
  
  return 'pending_review';
}

function calculateViolationStats(logs: any[]) {
  const violations: { [key: string]: number } = {};
  
  logs.forEach(log => {
    log.result.violations.forEach((violation: string) => {
      violations[violation] = (violations[violation] || 0) + 1;
    });
  });
  
  return violations;
}

function calculateCategoryAccuracy(logs: any[]) {
  const accuracy: { [key: string]: { total: number; correct: number } } = {};
  
  logs.forEach(log => {
    const category = log.category;
    if (!accuracy[category]) {
      accuracy[category] = { total: 0, correct: 0 };
    }
    
    accuracy[category].total++;
    if (log.result.categoryMatch) {
      accuracy[category].correct++;
    }
  });
  
  // Convert to percentages
  const result: { [key: string]: number } = {};
  Object.keys(accuracy).forEach(category => {
    const data = accuracy[category];
    result[category] = accuracy[category].total > 0 ? Math.round((accuracy[category].correct / accuracy[category].total) * 100) : 0;
  });
  
  return result;
}

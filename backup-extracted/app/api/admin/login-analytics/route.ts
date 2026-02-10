import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch login events
    const [successfulLogins, failedLogins] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'LOGIN_SUCCESS',
          createdAt: { gte: startDate }
        },
        select: {
          userId: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'LOGIN_FAILED',
          createdAt: { gte: startDate }
        },
        select: {
          metadata: true,
          createdAt: true
        }
      })
    ]);

    const totalLogins = successfulLogins.length + failedLogins.length;
    const successRate = totalLogins > 0 ? (successfulLogins.length / totalLogins) * 100 : 0;

    // Calculate unique users
    const uniqueUserIds = new Set(successfulLogins.map(login => login.userId).filter(Boolean));
    const uniqueUsers = uniqueUserIds.size;

    // Calculate method breakdown
    const methodCounts = new Map<string, number>();
    successfulLogins.forEach(login => {
      const method = (login.metadata as any)?.method || 'unknown';
      methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
    });

    const methodBreakdown = Array.from(methodCounts.entries()).map(([method, count]) => ({
      method,
      count,
      percentage: totalLogins > 0 ? (count / totalLogins) * 100 : 0
    }));

    // Calculate failure reasons
    const failureReasons = new Map<string, number>();
    failedLogins.forEach(login => {
      const reason = (login.metadata as any)?.reason || 'unknown';
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
    });

    const failureReasonsArray = Array.from(failureReasons.entries()).map(([reason, count]) => ({
      reason,
      count
    }));

    // Calculate hourly data
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: successfulLogins.filter(login => 
        new Date(login.createdAt).getHours() === hour
      ).length
    }));

    // Calculate daily data
    const dailyData: Array<{ date: string; logins: number; unique: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayLogins = successfulLogins.filter(login => 
        login.createdAt >= dayStart && login.createdAt < dayEnd
      );
      
      const uniqueUsersDay = new Set(dayLogins.map(login => login.userId).filter(Boolean)).size;
      
      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        logins: dayLogins.length,
        unique: uniqueUsersDay
      });
    }

    // Count social vs credential logins
    const socialLogins = successfulLogins.filter(login => {
      const method = (login.metadata as any)?.method;
      return method && method !== 'credentials';
    }).length;

    const credentialLogins = successfulLogins.filter(login => {
      const method = (login.metadata as any)?.method;
      return method === 'credentials';
    }).length;

    // Estimate new vs returning users (simplified)
    const newUsers = successfulLogins.filter(login => 
      (login.metadata as any)?.isNewUser === true
    ).length;
    const returningUsers = uniqueUsers - newUsers;

    const stats = {
      totalLogins,
      successfulLogins: successfulLogins.length,
      failedLogins: failedLogins.length,
      successRate,
      uniqueUsers,
      newUsers,
      returningUsers: Math.max(0, returningUsers),
      socialLogins,
      credentialLogins,
      hourlyData,
      dailyData,
      methodBreakdown,
      failureReasons: failureReasonsArray
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Login analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login analytics' },
      { status: 500 }
    );
  }
}

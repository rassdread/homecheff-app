import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: {
        messagePrivacy: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      settings: {
        messagePrivacy: user.messagePrivacy,
        fanRequestEnabled: user.fanRequestEnabled,
        showFansList: user.showFansList,
        showProfileToEveryone: user.showProfileToEveryone,
        showOnlineStatus: user.showOnlineStatus,
        allowProfileViews: user.allowProfileViews,
        showActivityStatus: user.showActivityStatus,
      }
    });
  } catch (error) {
    console.error('[GET /api/profile/privacy]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      messagePrivacy,
      fanRequestEnabled,
      showFansList,
      showProfileToEveryone,
      showOnlineStatus,
      allowProfileViews,
      showActivityStatus,
    } = body;

    // Validate messagePrivacy
    if (messagePrivacy && !['NOBODY', 'FANS_ONLY', 'EVERYONE'].includes(messagePrivacy)) {
      return NextResponse.json({ error: 'Invalid message privacy setting' }, { status: 400 });
    }

    // Update user privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: (session as any).user.id },
      data: {
        ...(messagePrivacy && { messagePrivacy }),
        ...(typeof fanRequestEnabled === 'boolean' && { fanRequestEnabled }),
        ...(typeof showFansList === 'boolean' && { showFansList }),
        ...(typeof showProfileToEveryone === 'boolean' && { showProfileToEveryone }),
        ...(typeof showOnlineStatus === 'boolean' && { showOnlineStatus }),
        ...(typeof allowProfileViews === 'boolean' && { allowProfileViews }),
        ...(typeof showActivityStatus === 'boolean' && { showActivityStatus }),
      },
      select: {
        id: true,
        messagePrivacy: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
      }
    });

    return NextResponse.json({ 
      success: true,
      settings: {
        messagePrivacy: updatedUser.messagePrivacy,
        fanRequestEnabled: updatedUser.fanRequestEnabled,
        showFansList: updatedUser.showFansList,
        showProfileToEveryone: updatedUser.showProfileToEveryone,
        showOnlineStatus: updatedUser.showOnlineStatus,
        allowProfileViews: updatedUser.allowProfileViews,
        showActivityStatus: updatedUser.showActivityStatus,
      }
    });
  } catch (error) {
    console.error('[PUT /api/profile/privacy]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

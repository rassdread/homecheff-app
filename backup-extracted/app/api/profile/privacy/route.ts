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
        downloadPermission: true,
        printPermission: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      settings: {
        messagePrivacy: user.messagePrivacy || 'EVERYONE',
        fanRequestEnabled: user.fanRequestEnabled !== false,
        showFansList: user.showFansList !== false,
        showProfileToEveryone: user.showProfileToEveryone !== false,
        showOnlineStatus: user.showOnlineStatus !== false,
        allowProfileViews: user.allowProfileViews !== false,
        showActivityStatus: user.showActivityStatus !== false,
        downloadPermission: user.downloadPermission || 'EVERYONE',
        printPermission: user.printPermission || 'EVERYONE',
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
      downloadPermission,
      printPermission,
    } = body;

    // Validate permissions
    if (messagePrivacy && !['NOBODY', 'FANS_ONLY', 'EVERYONE'].includes(messagePrivacy)) {
      return NextResponse.json({ error: 'Invalid message privacy setting' }, { status: 400 });
    }

    const validPermissions = ['EVERYONE', 'FANS_ONLY', 'FAN_OF_ONLY', 'ASK_PERMISSION', 'NOBODY'];
    if (downloadPermission && !validPermissions.includes(downloadPermission)) {
      return NextResponse.json({ error: 'Invalid download permission' }, { status: 400 });
    }
    if (printPermission && !validPermissions.includes(printPermission)) {
      return NextResponse.json({ error: 'Invalid print permission' }, { status: 400 });
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
        ...(downloadPermission && { downloadPermission }),
        ...(printPermission && { printPermission }),
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
        downloadPermission: true,
        printPermission: true,
      }
    });

    return NextResponse.json({ 
      success: true,
      settings: {
        messagePrivacy: updatedUser.messagePrivacy || 'EVERYONE',
        fanRequestEnabled: updatedUser.fanRequestEnabled !== false,
        showFansList: updatedUser.showFansList !== false,
        showProfileToEveryone: updatedUser.showProfileToEveryone !== false,
        showOnlineStatus: updatedUser.showOnlineStatus !== false,
        allowProfileViews: updatedUser.allowProfileViews !== false,
        showActivityStatus: updatedUser.showActivityStatus !== false,
        downloadPermission: updatedUser.downloadPermission || 'EVERYONE',
        printPermission: updatedUser.printPermission || 'EVERYONE',
      }
    });
  } catch (error) {
    console.error('[PUT /api/profile/privacy]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

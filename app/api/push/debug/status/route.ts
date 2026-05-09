import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Eigen push-tokenstatus (geen ruwe FCM-tokens). Voor diagnose na idle/background.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rows = await prisma.pushToken.findMany({
      where: { userId: user.id, type: 'FCM' },
      select: {
        platform: true,
        isActive: true,
        lastUsedAt: true,
        updatedAt: true,
        deviceId: true,
      },
    });

    const activeByPlatform: Record<string, number> = {};
    const inactiveByPlatform: Record<string, number> = {};
    let lastActivity: Date | null = null;

    for (const r of rows) {
      if (r.isActive) {
        const p = r.platform || 'unknown';
        activeByPlatform[p] = (activeByPlatform[p] || 0) + 1;
        if (!lastActivity || r.lastUsedAt > lastActivity) {
          lastActivity = r.lastUsedAt;
        }
      } else {
        const p = r.platform || 'unknown';
        inactiveByPlatform[p] = (inactiveByPlatform[p] || 0) + 1;
      }
    }

    const distinctActiveDevices = new Set(
      rows.filter((r) => r.isActive && r.deviceId).map((r) => r.deviceId as string)
    ).size;

    return NextResponse.json({
      ok: true,
      userId: user.id,
      activeTokensTotal: rows.filter((r) => r.isActive).length,
      inactiveTokensTotal: rows.filter((r) => !r.isActive).length,
      activeByPlatform,
      inactiveByPlatform,
      distinctActiveDevicesWithDeviceId: distinctActiveDevices,
      lastServerTokenActivityAt: lastActivity?.toISOString() ?? null,
      pushPermissionNote:
        'OS-meldingpermissie staat niet op de server; controleer in de app of systeeminstellingen.',
    });
  } catch (e) {
    console.error('[push/debug/status]', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

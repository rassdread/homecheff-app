import { prisma } from '@/lib/prisma';
import type { UnlockedBadge } from '@/lib/gamification/unlock-badges';
import { randomUUID } from 'crypto';

const ADMIN = 'ADMIN_NOTICE' as const;

/**
 * Lightweight in-app notifications (DB row). No push fan-out for HCP V2.
 * Badge unlocks only (avoid spam from elke +HCP ping).
 */
export async function maybeNotifyHcpActivity(userId: string, newBadges: UnlockedBadge[]): Promise<void> {
  try {
    for (const b of newBadges) {
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId,
          type: ADMIN,
          payload: {
            title: 'Nieuwe badge',
            body: `Je hebt de badge “${b.name}” vrijgespeeld.`,
            data: { kind: 'HCP_BADGE', slug: b.slug },
          },
        },
      });
    }
  } catch (e) {
    console.warn('[hcp-notifications]', e);
  }
}

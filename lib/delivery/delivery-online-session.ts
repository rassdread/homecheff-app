/**
 * Persist / expire temporary online sessions.
 * Does not mutate scheduled availability fields.
 */

import type { PrismaClient } from '@prisma/client';
import {
  resolveOnlineUntil,
  type OnlineDurationPreset,
} from '@/lib/delivery/delivery-time-availability';

export async function expireExpiredTemporaryOnline(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<number> {
  const result = await prisma.deliveryProfile.updateMany({
    where: {
      isOnline: true,
      onlineUntil: { lte: now },
    },
    data: {
      isOnline: false,
      onlineUntil: null,
      lastOfflineAt: now,
    },
  });
  return result.count;
}

export async function applyDeliveryOnlineSession(
  prisma: PrismaClient,
  profileId: string,
  input: {
    action: 'online' | 'offline' | 'extend';
    preset?: OnlineDurationPreset;
    customUntil?: string | null;
    timeZone?: string;
    currentUntil?: Date | null;
    now?: Date;
  },
): Promise<
  | { ok: true; isOnline: boolean; onlineUntil: Date | null; lastOnlineAt: Date | null }
  | { ok: false; error: string; code: string }
> {
  const now = input.now ?? new Date();

  if (input.action === 'offline') {
    const updated = await prisma.deliveryProfile.update({
      where: { id: profileId },
      data: {
        isOnline: false,
        onlineUntil: null,
        lastOfflineAt: now,
        temporaryOffline: false,
      },
      select: { isOnline: true, onlineUntil: true, lastOnlineAt: true },
    });
    return {
      ok: true,
      isOnline: updated.isOnline,
      onlineUntil: updated.onlineUntil,
      lastOnlineAt: updated.lastOnlineAt,
    };
  }

  if (!input.preset) {
    return {
      ok: false,
      error: 'Kies hoe lang je online wilt blijven.',
      code: 'DURATION_REQUIRED',
    };
  }

  const from =
    input.action === 'extend' && input.currentUntil && input.currentUntil.getTime() > now.getTime()
      ? input.currentUntil
      : now;

  const until = resolveOnlineUntil({
    preset: input.preset,
    customUntil: input.customUntil,
    timeZone: input.timeZone,
    now,
    from,
  });
  if (!until.ok) return until;

  const updated = await prisma.deliveryProfile.update({
    where: { id: profileId },
    data: {
      isOnline: true,
      lastOnlineAt: now,
      onlineUntil: until.until,
      lastOfflineAt: null,
      temporaryOffline: false,
    },
    select: { isOnline: true, onlineUntil: true, lastOnlineAt: true },
  });

  return {
    ok: true,
    isOnline: updated.isOnline,
    onlineUntil: updated.onlineUntil,
    lastOnlineAt: updated.lastOnlineAt,
  };
}

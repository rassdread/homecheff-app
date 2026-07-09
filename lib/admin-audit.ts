/**
 * Phase 13E — Structured admin audit logging via AdminAction.notes JSON.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export type AdminAuditPayload = {
  targetType?: string;
  targetId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  meta?: Record<string, unknown>;
};

export async function logAdminAction(
  adminId: string,
  action: string,
  payload?: AdminAuditPayload,
  reportId?: string,
): Promise<void> {
  try {
    const notes = payload
      ? JSON.stringify({
          targetType: payload.targetType,
          targetId: payload.targetId,
          oldValue: payload.oldValue,
          newValue: payload.newValue,
          reason: payload.reason,
          meta: payload.meta,
        })
      : undefined;

    await prisma.adminAction.create({
      data: {
        id: randomUUID(),
        adminId,
        action,
        notes,
        reportId: reportId ?? null,
      },
    });
  } catch (error) {
    console.error('[admin-audit] failed to log action', action, error);
  }
}

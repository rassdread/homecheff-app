/**
 * Durable FCM push outbox — enqueue once, retry with backoff, never silent-drop.
 */
import { createHash, randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export const OUTBOX_STATUSES = [
  'QUEUED',
  'PROCESSING',
  'SENT',
  'FAILED',
  'EXPIRED',
] as const;

export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export type FcmOutboxPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
  androidChannelId: string;
  avatarUrl?: string | null;
  webIcon?: string | null;
  kind: 'chat' | 'order' | 'proposal' | 'announcement' | string;
};

export type EnqueueOutboxInput = {
  userId: string;
  token: string;
  platform: string;
  pushTokenId?: string | null;
  payload: FcmOutboxPayload;
  notificationId?: string | null;
  /** Stable key within a single send() batch; combined with token. */
  batchId: string;
  maxAttempts?: number;
};

export function createOutboxBatchId(): string {
  return randomUUID();
}

export function buildOutboxIdempotencyKey(
  batchId: string,
  token: string
): string {
  return createHash('sha256')
    .update(`${batchId}:${token}`)
    .digest('hex')
    .slice(0, 64);
}

/** Exponential backoff: 30s, 60s, 2m, 4m, 8m, 16m, 32m, 64m (capped). */
export function computeOutboxBackoffMs(attemptCount: number): number {
  const base = 30_000;
  const exp = Math.min(Math.max(attemptCount, 1), 8);
  return Math.min(base * 2 ** (exp - 1), 60 * 60 * 1000);
}

/**
 * Ensure table exists (safe for preview / pre-migrate deploy). Idempotent.
 */
export async function ensureNotificationPushOutboxTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotificationPushOutbox" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "pushTokenId" TEXT,
      "token" TEXT NOT NULL,
      "platform" TEXT NOT NULL,
      "idempotencyKey" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'QUEUED',
      "attemptCount" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 8,
      "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastError" TEXT,
      "payload" JSONB NOT NULL,
      "notificationId" TEXT,
      "kind" TEXT,
      "sentAt" TIMESTAMP(3),
      "expiredAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NotificationPushOutbox_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPushOutbox_idempotencyKey_key" ON "NotificationPushOutbox"("idempotencyKey")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "NotificationPushOutbox_status_nextAttemptAt_idx" ON "NotificationPushOutbox"("status", "nextAttemptAt")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "NotificationPushOutbox_userId_createdAt_idx" ON "NotificationPushOutbox"("userId", "createdAt")`
  );
}

export async function enqueuePushOutbox(
  input: EnqueueOutboxInput
): Promise<{ id: string; created: boolean }> {
  await ensureNotificationPushOutboxTable();
  const idempotencyKey = buildOutboxIdempotencyKey(input.batchId, input.token);
  const id = randomUUID();
  const now = new Date();
  const kind = input.payload.kind || null;
  const maxAttempts = input.maxAttempts ?? 8;
  const payloadJson = JSON.stringify(input.payload);

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "NotificationPushOutbox" (
        "id", "userId", "pushTokenId", "token", "platform", "idempotencyKey",
        "status", "attemptCount", "maxAttempts", "nextAttemptAt",
        "payload", "notificationId", "kind", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        'QUEUED', 0, $7, $8,
        $9::jsonb, $10, $11, $12, $13
      )`,
      id,
      input.userId,
      input.pushTokenId ?? null,
      input.token,
      input.platform,
      idempotencyKey,
      maxAttempts,
      now,
      payloadJson,
      input.notificationId ?? null,
      kind,
      now,
      now
    );
    return { id, created: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('Unique') ||
      msg.includes('duplicate') ||
      msg.includes('idempotencyKey')
    ) {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "NotificationPushOutbox"
        WHERE "idempotencyKey" = ${idempotencyKey}
        LIMIT 1
      `;
      return { id: existing[0]?.id || id, created: false };
    }
    throw e;
  }
}

export type OutboxRow = {
  id: string;
  userId: string;
  token: string;
  platform: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  payload: FcmOutboxPayload;
  lastError: string | null;
};

export async function claimDueOutboxRows(limit = 40): Promise<OutboxRow[]> {
  await ensureNotificationPushOutboxTable();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000);
  // Reclaim stuck PROCESSING rows after crash / deploy mid-send.
  await prisma.$executeRaw`
    UPDATE "NotificationPushOutbox"
    SET "status" = 'QUEUED', "updatedAt" = ${now}
    WHERE "status" = 'PROCESSING'
      AND "updatedAt" < ${staleBefore}
  `;
  const claimed = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      token: string;
      platform: string;
      status: string;
      attemptCount: number;
      maxAttempts: number;
      payload: FcmOutboxPayload | string;
      lastError: string | null;
    }>
  >`
    UPDATE "NotificationPushOutbox" AS o
    SET
      "status" = 'PROCESSING',
      "updatedAt" = ${now}
    WHERE o."id" IN (
      SELECT "id" FROM "NotificationPushOutbox"
      WHERE "status" = 'QUEUED'
        AND "nextAttemptAt" <= ${now}
        AND "attemptCount" < "maxAttempts"
        AND ("expiredAt" IS NULL)
      ORDER BY "nextAttemptAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING
      o."id", o."userId", o."token", o."platform", o."status",
      o."attemptCount", o."maxAttempts", o."payload", o."lastError"
  `;

  return claimed.map((row) => ({
    ...row,
    payload:
      typeof row.payload === 'string'
        ? (JSON.parse(row.payload) as FcmOutboxPayload)
        : row.payload,
  }));
}

export async function markOutboxSent(id: string): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "NotificationPushOutbox"
    SET
      "status" = 'SENT',
      "sentAt" = ${now},
      "lastError" = NULL,
      "updatedAt" = ${now},
      "attemptCount" = "attemptCount" + 1
    WHERE "id" = ${id}
  `;
}

export async function markOutboxRetry(
  id: string,
  error: string,
  attemptCount: number,
  maxAttempts: number
): Promise<void> {
  const now = new Date();
  const nextAttempt = attemptCount + 1;
  if (nextAttempt >= maxAttempts) {
    await prisma.$executeRaw`
      UPDATE "NotificationPushOutbox"
      SET
        "status" = 'EXPIRED',
        "attemptCount" = ${nextAttempt},
        "lastError" = ${error.slice(0, 500)},
        "expiredAt" = ${now},
        "updatedAt" = ${now}
      WHERE "id" = ${id}
    `;
    return;
  }
  const delay = computeOutboxBackoffMs(nextAttempt);
  const nextAt = new Date(now.getTime() + delay);
  await prisma.$executeRaw`
    UPDATE "NotificationPushOutbox"
    SET
      "status" = 'QUEUED',
      "attemptCount" = ${nextAttempt},
      "lastError" = ${error.slice(0, 500)},
      "nextAttemptAt" = ${nextAt},
      "updatedAt" = ${now}
    WHERE "id" = ${id}
  `;
}

export async function markOutboxFailedPermanent(
  id: string,
  error: string
): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "NotificationPushOutbox"
    SET
      "status" = 'FAILED',
      "lastError" = ${error.slice(0, 500)},
      "attemptCount" = "attemptCount" + 1,
      "updatedAt" = ${now}
    WHERE "id" = ${id}
  `;
}

/** Replay dead-letter / expired rows (operator tooling). */
export async function replayOutboxRows(opts: {
  ids?: string[];
  status?: 'FAILED' | 'EXPIRED';
  limit?: number;
}): Promise<number> {
  await ensureNotificationPushOutboxTable();
  const now = new Date();
  const limit = opts.limit ?? 50;
  if (opts.ids?.length) {
    let n = 0;
    for (const id of opts.ids) {
      const r = await prisma.$executeRaw`
        UPDATE "NotificationPushOutbox"
        SET
          "status" = 'QUEUED',
          "nextAttemptAt" = ${now},
          "expiredAt" = NULL,
          "attemptCount" = 0,
          "lastError" = NULL,
          "updatedAt" = ${now},
          "maxAttempts" = GREATEST("maxAttempts", 8)
        WHERE "id" = ${id}
          AND "status" IN ('FAILED', 'EXPIRED', 'QUEUED', 'PROCESSING')
      `;
      n += Number(r) || 0;
    }
    return n;
  }
  const status = opts.status ?? 'FAILED';
  const result = await prisma.$executeRaw`
    UPDATE "NotificationPushOutbox"
    SET
      "status" = 'QUEUED',
      "nextAttemptAt" = ${now},
      "expiredAt" = NULL,
      "attemptCount" = 0,
      "lastError" = NULL,
      "updatedAt" = ${now},
      "maxAttempts" = GREATEST("maxAttempts", 8)
    WHERE "id" IN (
      SELECT "id" FROM "NotificationPushOutbox"
      WHERE "status" = ${status}
      ORDER BY "updatedAt" DESC
      LIMIT ${limit}
    )
  `;
  return Number(result) || 0;
}

export async function getOutboxStats(): Promise<Record<string, number>> {
  await ensureNotificationPushOutboxTable();
  const rows = await prisma.$queryRaw<Array<{ status: string; c: bigint }>>`
    SELECT "status", COUNT(*)::bigint AS c
    FROM "NotificationPushOutbox"
    GROUP BY "status"
  `;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = Number(r.c);
  return out;
}

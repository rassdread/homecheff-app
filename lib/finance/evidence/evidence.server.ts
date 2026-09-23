/**
 * PHASE 8D — orchestration between the evidence metadata rows and the private
 * object store.
 *
 * Ordering rule for the whole module: the database is written first and the
 * store second. A row in `UPLOADING` with no object behind it is harmless and
 * self-healing; an object with no row behind it is a financial document nobody
 * can find or delete. So the failure that is allowed to happen is the harmless
 * one.
 *
 * Authorization rule: `ownerUserId` is always part of the WHERE clause, never a
 * value compared after a read. There is therefore no window in which a row
 * could change hands between the check and the operation, and a request for
 * another seller's evidence simply matches nothing.
 */
import { prisma } from '@/lib/prisma';
import type { SellerFinancialEvidence } from '@prisma/client';
import {
  MAX_EVIDENCE_PER_EXPENSE,
  purgeGraceMs,
  sanitizeDisplayFilename,
  type EvidenceKind,
} from './evidence-policy';
import { inspectEvidenceFile, type EvidenceRejectionCode } from './evidence-file';
import {
  deleteVaultObject,
  getVaultObject,
  newObjectKey,
  putVaultObject,
  type VaultObject,
} from './vault-store';

export type EvidenceSummary = {
  id: string;
  kind: EvidenceKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
  metadataStripped: boolean;
  uploadedAt: string;
  linkedExpenseId: string | null;
  /** True when this owner already holds identical bytes under another row. */
  duplicateOfExisting: boolean;
};

export type CreateEvidenceResult =
  | { ok: true; evidence: EvidenceSummary }
  | { ok: false; code: EvidenceRejectionCode | 'EXPENSE_NOT_FOUND' | 'TOO_MANY_FILES' | 'STORAGE_FAILED' };

function toSummary(
  row: SellerFinancialEvidence,
  opts: { duplicateOfExisting?: boolean } = {},
): EvidenceSummary {
  return {
    id: row.id,
    kind: row.kind as EvidenceKind,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    originalFilename: row.originalFilename,
    metadataStripped: row.metadataStripped,
    uploadedAt: row.uploadedAt.toISOString(),
    linkedExpenseId: row.linkedExpenseId,
    duplicateOfExisting: opts.duplicateOfExisting ?? false,
  };
}

/**
 * Stores one piece of evidence for `ownerUserId`.
 *
 * When `linkedExpenseId` is given the expense is resolved with the owner in the
 * WHERE clause, which is what makes cross-owner linking impossible: an expense
 * belonging to someone else does not match, and the upload is refused before a
 * single byte is written.
 */
export async function createEvidence(input: {
  ownerUserId: string;
  buffer: Buffer;
  declaredMimeType?: string | null;
  filename?: string | null;
  kind?: EvidenceKind;
  linkedExpenseId?: string | null;
}): Promise<CreateEvidenceResult> {
  const inspection = inspectEvidenceFile({
    buffer: input.buffer,
    declaredMimeType: input.declaredMimeType,
  });
  if (!inspection.ok) return { ok: false, code: inspection.code };

  let linkedExpenseId: string | null = null;
  if (input.linkedExpenseId) {
    const expense = await prisma.sellerExpense.findFirst({
      where: { id: input.linkedExpenseId, sellerUserId: input.ownerUserId, deletedAt: null },
      select: { id: true },
    });
    if (!expense) return { ok: false, code: 'EXPENSE_NOT_FOUND' };
    linkedExpenseId = expense.id;

    const attached = await prisma.sellerFinancialEvidence.count({
      where: { linkedExpenseId, ownerUserId: input.ownerUserId, status: { in: ['UPLOADING', 'STORED'] } },
    });
    if (attached >= MAX_EVIDENCE_PER_EXPENSE) return { ok: false, code: 'TOO_MANY_FILES' };
  }

  // Duplicate detection is scoped to this owner only. A global match would
  // reveal that some other seller holds the same document.
  const duplicateOfExisting =
    (await prisma.sellerFinancialEvidence.count({
      where: { ownerUserId: input.ownerUserId, sha256: inspection.sha256, status: 'STORED' },
    })) > 0;

  const objectKey = newObjectKey();

  // Intent first. If the process dies after this point the row is visible to
  // the sweeper and the object, if any, gets cleaned up.
  const row = await prisma.sellerFinancialEvidence.create({
    data: {
      ownerUserId: input.ownerUserId,
      kind: input.kind ?? 'RECEIPT',
      status: 'UPLOADING',
      objectKey,
      originalFilename: sanitizeDisplayFilename(input.filename),
      mimeType: inspection.mimeType,
      sizeBytes: inspection.sizeBytes,
      sha256: inspection.sha256,
      metadataStripped: inspection.metadataStripped,
      linkedExpenseId,
    },
  });

  try {
    await putVaultObject({
      objectKey,
      body: inspection.bytes,
      contentType: inspection.mimeType,
    });
  } catch (error) {
    // The upload failed, so the row must not become readable. It is queued for
    // purge rather than deleted, because a partial write may still have landed.
    await prisma.sellerFinancialEvidence
      .update({
        where: { id: row.id },
        data: {
          status: 'PENDING_PURGE',
          deletedAt: new Date(),
          purgeAfter: new Date(),
          lastPurgeError: error instanceof Error ? error.name : 'upload_failed',
        },
      })
      .catch(() => undefined);
    console.error('[evidence] upload failed', { evidenceId: row.id });
    return { ok: false, code: 'STORAGE_FAILED' };
  }

  const stored = await prisma.sellerFinancialEvidence.update({
    where: { id: row.id },
    data: { status: 'STORED' },
  });

  return { ok: true, evidence: toSummary(stored, { duplicateOfExisting }) };
}

/** Evidence attached to one expense, scoped to its owner. */
export async function listEvidenceForExpense(
  ownerUserId: string,
  expenseId: string,
): Promise<EvidenceSummary[]> {
  const rows = await prisma.sellerFinancialEvidence.findMany({
    where: { ownerUserId, linkedExpenseId: expenseId, status: 'STORED' },
    orderBy: { uploadedAt: 'asc' },
  });
  return rows.map((row) => toSummary(row));
}

/** Evidence counts per expense, for rendering a list without N+1 queries. */
export async function evidenceCountsByExpense(
  ownerUserId: string,
  expenseIds: readonly string[],
): Promise<Record<string, number>> {
  if (expenseIds.length === 0) return {};
  const grouped = await prisma.sellerFinancialEvidence.groupBy({
    by: ['linkedExpenseId'],
    where: { ownerUserId, linkedExpenseId: { in: [...expenseIds] }, status: 'STORED' },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const g of grouped) {
    if (g.linkedExpenseId) counts[g.linkedExpenseId] = g._count._all;
  }
  return counts;
}

export type ReadEvidenceResult =
  | { ok: true; object: VaultObject; row: SellerFinancialEvidence }
  | { ok: false; reason: 'NOT_FOUND' | 'OBJECT_MISSING' };

/**
 * Fetches the bytes of one evidence item for its owner.
 *
 * Anything that is not this owner's, not `STORED`, or not actually present in
 * the store is reported as NOT_FOUND / OBJECT_MISSING; callers answer 404 in
 * both cases so a response never confirms that a row exists for someone else.
 */
export async function readEvidence(
  ownerUserId: string,
  evidenceId: string,
): Promise<ReadEvidenceResult> {
  const row = await prisma.sellerFinancialEvidence.findFirst({
    where: { id: evidenceId, ownerUserId, status: 'STORED', deletedAt: null },
  });
  if (!row) return { ok: false, reason: 'NOT_FOUND' };

  const object = await getVaultObject(row.objectKey);
  if (!object) {
    // The row promised bytes the store does not have. Record it rather than
    // leaving the inconsistency invisible.
    await prisma.sellerFinancialEvidence
      .update({ where: { id: row.id }, data: { status: 'MISSING' } })
      .catch(() => undefined);
    console.error('[evidence] object missing for stored row', { evidenceId: row.id });
    return { ok: false, reason: 'OBJECT_MISSING' };
  }
  return { ok: true, object, row };
}

/**
 * Marks evidence for deletion and tries to remove the object immediately.
 *
 * The status change and the object removal are separate steps on purpose. After
 * the first step the bytes are already unreachable through every route in the
 * application, so a failure in the second step is a storage-cleanup problem,
 * never an access-control problem. The sweeper retries it.
 */
export async function deleteEvidence(
  ownerUserId: string,
  evidenceId: string,
): Promise<{ ok: boolean; purged: boolean }> {
  const now = new Date();
  const marked = await prisma.sellerFinancialEvidence.updateMany({
    where: { id: evidenceId, ownerUserId, status: { in: ['UPLOADING', 'STORED', 'MISSING'] } },
    data: {
      status: 'PENDING_PURGE',
      deletedAt: now,
      purgeAfter: new Date(now.getTime() + purgeGraceMs()),
    },
  });
  if (marked.count === 0) return { ok: false, purged: false };

  const purged = await purgeDueEvidence({ ids: [evidenceId] });
  return { ok: true, purged: purged.purged > 0 };
}

/**
 * Expense deletion policy: the expense is tombstoned by Phase 8C, and anything
 * attached to it stops being readable and enters the purge lifecycle here.
 *
 * `linkedExpenseId` is deliberately left in place. It is the only record of
 * what the object belonged to, and the row is on its way out anyway.
 */
export async function markExpenseEvidenceForPurge(
  ownerUserId: string,
  expenseId: string,
): Promise<number> {
  const now = new Date();
  const marked = await prisma.sellerFinancialEvidence.updateMany({
    where: {
      ownerUserId,
      linkedExpenseId: expenseId,
      status: { in: ['UPLOADING', 'STORED', 'MISSING'] },
    },
    data: {
      status: 'PENDING_PURGE',
      deletedAt: now,
      purgeAfter: new Date(now.getTime() + purgeGraceMs()),
    },
  });
  if (marked.count > 0) await purgeDueEvidence({ ownerUserId });
  return marked.count;
}

/**
 * Account deletion policy: every piece of evidence this user holds is queued
 * for purge, whatever it is linked to.
 *
 * HomeCheff is not the seller's administration, so it has no retention claim of
 * its own over their receipts; keeping them after the account is gone would be
 * storage without a purpose. Callers run this OUTSIDE their database
 * transaction, because purging talks to the network.
 */
export async function markAllOwnerEvidenceForPurge(ownerUserId: string): Promise<number> {
  const now = new Date();
  const marked = await prisma.sellerFinancialEvidence.updateMany({
    where: { ownerUserId, status: { in: ['UPLOADING', 'STORED', 'MISSING'] } },
    data: { status: 'PENDING_PURGE', deletedAt: now, purgeAfter: now },
  });
  return marked.count;
}

/**
 * Removes objects for rows already marked `PENDING_PURGE`.
 *
 * Safe to run repeatedly and concurrently: `deleteVaultObject` treats an
 * already-absent object as success, and each row is only advanced to `PURGED`
 * once its object is confirmed gone.
 */
export async function purgeDueEvidence(filter: {
  ids?: readonly string[];
  ownerUserId?: string;
  limit?: number;
} = {}): Promise<{ considered: number; purged: number; failed: number }> {
  const rows = await prisma.sellerFinancialEvidence.findMany({
    where: {
      status: 'PENDING_PURGE',
      ...(filter.ids ? { id: { in: [...filter.ids] } } : {}),
      ...(filter.ownerUserId ? { ownerUserId: filter.ownerUserId } : {}),
      OR: [{ purgeAfter: null }, { purgeAfter: { lte: new Date() } }],
    },
    select: { id: true, objectKey: true },
    take: filter.limit ?? 100,
  });

  let purged = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await deleteVaultObject(row.objectKey);
    if (result.ok) {
      await prisma.sellerFinancialEvidence.update({
        where: { id: row.id },
        data: { status: 'PURGED', purgedAt: new Date(), lastPurgeError: null },
      });
      purged += 1;
    } else {
      await prisma.sellerFinancialEvidence.update({
        where: { id: row.id },
        data: { purgeAttempts: { increment: 1 }, lastPurgeError: result.error ?? 'unknown' },
      });
      failed += 1;
      console.error('[evidence] purge failed', { evidenceId: row.id, attempts: 'incremented' });
    }
  }
  return { considered: rows.length, purged, failed };
}

/**
 * Destroys objects by key, for the one path that hard-deletes users.
 *
 * Admin bulk deletion removes the `User` rows outright, so the evidence rows —
 * and with them the only record of which objects exist — cascade away. That
 * caller reads the keys first and hands them here afterwards. Best effort by
 * necessity: once the rows are gone there is nothing left to retry from, which
 * is exactly why the keys are captured before the transaction rather than
 * after it.
 */
export async function deleteVaultObjectsByKey(objectKeys: readonly string[]): Promise<number> {
  let removed = 0;
  for (const objectKey of objectKeys) {
    const result = await deleteVaultObject(objectKey).catch(() => ({ ok: false }));
    if (result.ok) removed += 1;
    else console.error('[evidence] hard-delete object removal failed');
  }
  return removed;
}

/**
 * Sweeps uploads that never completed into the purge queue.
 *
 * This is what closes the "object written, row never confirmed" window: the row
 * always exists, so the object always becomes reachable for deletion again.
 */
export async function sweepStaleUploads(olderThanMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const swept = await prisma.sellerFinancialEvidence.updateMany({
    where: { status: 'UPLOADING', uploadedAt: { lt: cutoff } },
    data: { status: 'PENDING_PURGE', deletedAt: new Date(), purgeAfter: new Date() },
  });
  return swept.count;
}

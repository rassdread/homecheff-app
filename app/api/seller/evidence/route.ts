/**
 * PHASE 8D — upload and list private financial evidence.
 *
 * The owner is taken from the session on every request. No field of the request
 * body can name an owner, and the expense a file is attached to is resolved
 * with the owner in the WHERE clause, so a seller cannot attach a receipt to
 * anyone else's expense.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createEvidence,
  listEvidenceForExpense,
} from '@/lib/finance/evidence/evidence.server';
import {
  EVIDENCE_KINDS,
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_EXPENSE,
  EVIDENCE_MIME_TYPES,
  type EvidenceKind,
} from '@/lib/finance/evidence/evidence-policy';
import { isVaultConfigured } from '@/lib/finance/evidence/vault-store';
import {
  checkEvidenceUploadRateLimit,
  evidenceOwnerId,
  isSameOriginWrite,
} from '@/lib/finance/evidence/evidence-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Rejection code -> status. Nothing here reveals whether a row exists. */
const STATUS_BY_CODE: Record<string, number> = {
  EMPTY_FILE: 400,
  FILE_TOO_SMALL: 400,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  DECLARED_TYPE_MISMATCH: 415,
  ACTIVE_CONTENT: 415,
  MALFORMED_FILE: 415,
  EXPENSE_NOT_FOUND: 404,
  TOO_MANY_FILES: 409,
  STORAGE_FAILED: 502,
};

export async function GET(req: NextRequest) {
  try {
    const ownerUserId = await evidenceOwnerId();
    if (!ownerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expenseId = req.nextUrl.searchParams.get('expenseId');
    if (!expenseId) {
      return NextResponse.json({ error: 'expenseId is required' }, { status: 400 });
    }

    const evidence = await listEvidenceForExpense(ownerUserId, expenseId);
    return NextResponse.json(
      { evidence, limits: { maxBytes: MAX_EVIDENCE_BYTES, maxPerExpense: MAX_EVIDENCE_PER_EXPENSE } },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('evidence GET failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Failed to load evidence' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerUserId = await evidenceOwnerId();
    if (!ownerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isSameOriginWrite(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!isVaultConfigured()) {
      // Better to refuse than to let some other code path pick a fallback store.
      console.error('evidence POST refused: vault not configured');
      return NextResponse.json({ error: 'Evidence storage unavailable' }, { status: 503 });
    }

    const rate = checkEvidenceUploadRateLimit(ownerUserId);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    // Cheap guard before buffering the body.
    const declaredLength = Number(req.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_EVIDENCE_BYTES * 1.1) {
      return NextResponse.json(
        { error: 'File too large', code: 'FILE_TOO_LARGE', maxBytes: MAX_EVIDENCE_BYTES },
        { status: 413 },
      );
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!form || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required', code: 'EMPTY_FILE' }, { status: 400 });
    }

    const rawKind = form.get('kind');
    const kind: EvidenceKind =
      typeof rawKind === 'string' && (EVIDENCE_KINDS as readonly string[]).includes(rawKind)
        ? (rawKind as EvidenceKind)
        : 'RECEIPT';

    const rawExpenseId = form.get('expenseId');
    const linkedExpenseId = typeof rawExpenseId === 'string' && rawExpenseId ? rawExpenseId : null;

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await createEvidence({
      ownerUserId,
      buffer,
      declaredMimeType: file.type || null,
      filename: file.name || null,
      kind,
      linkedExpenseId,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Evidence rejected',
          code: result.code,
          maxBytes: MAX_EVIDENCE_BYTES,
          allowedTypes: EVIDENCE_MIME_TYPES,
        },
        { status: STATUS_BY_CODE[result.code] ?? 400 },
      );
    }

    return NextResponse.json(
      { evidence: result.evidence },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    // Only the error's name: a message could carry a key or a filename.
    console.error('evidence POST failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Failed to store evidence' }, { status: 500 });
  }
}

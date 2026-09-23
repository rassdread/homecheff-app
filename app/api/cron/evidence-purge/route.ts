/**
 * PHASE 8D — the sweeper that makes evidence deletion eventually consistent.
 *
 * Two jobs, both idempotent:
 *
 *  - uploads that never confirmed are queued for purge, which closes the
 *    window where bytes landed in the store but the request died before the
 *    row could be marked `STORED`;
 *  - rows already queued for purge have their objects removed, retrying the
 *    ones whose previous attempt failed.
 *
 * Nothing here can make a receipt readable again. Every row it touches is
 * already unreachable through the application; this is storage cleanup, not
 * access control.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/email/cron-auth';
import { purgeDueEvidence, sweepStaleUploads } from '@/lib/finance/evidence/evidence.server';
import { UPLOAD_STALE_AFTER_MS } from '@/lib/finance/evidence/evidence-policy';
import { isVaultConfigured } from '@/lib/finance/evidence/vault-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleCron(req: NextRequest) {
  if (!authorizeCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isVaultConfigured()) {
    return NextResponse.json({ error: 'vault_not_configured' }, { status: 503 });
  }

  try {
    const swept = await sweepStaleUploads(UPLOAD_STALE_AFTER_MS);
    const purge = await purgeDueEvidence({ limit: 200 });

    // Counts only — never an id, a key or a filename.
    return NextResponse.json({
      ok: true,
      staleUploadsQueued: swept,
      considered: purge.considered,
      purged: purge.purged,
      failed: purge.failed,
    });
  } catch (error) {
    console.error('evidence purge cron failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'purge_failed' }, { status: 500 });
  }
}

export const GET = handleCron;
export const POST = handleCron;

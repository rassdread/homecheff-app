/**
 * PHASE 8D — delete one piece of private financial evidence.
 *
 * Deleting evidence never touches the SellerExpense it was attached to: the
 * amount, the business share and the fiscal treatment are Phase 8C facts and
 * are unaffected by whether a supporting document exists.
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteEvidence } from '@/lib/finance/evidence/evidence.server';
import { evidenceOwnerId, isSameOriginWrite } from '@/lib/finance/evidence/evidence-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  try {
    const ownerUserId = await evidenceOwnerId();
    if (!ownerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSameOriginWrite(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { evidenceId } = await params;
    const result = await deleteEvidence(ownerUserId, evidenceId);

    // Someone else's evidence, or already deleted, reports the same 404: a 403
    // here would confirm that the id names a real document.
    if (!result.ok) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    // `purged` says whether the object is already gone. False means the row is
    // queued and the sweeper will retry; it does not mean the bytes are still
    // reachable, which they are not from this point on.
    return NextResponse.json(
      { id: evidenceId, deleted: true, purged: result.purged },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('evidence DELETE failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 });
  }
}

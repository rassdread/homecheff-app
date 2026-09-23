/**
 * PHASE 8D — authorized delivery of private financial evidence.
 *
 * This is the only way bytes leave the vault. There is no signed url, no
 * redirect to storage and no permanent address for the document: the request
 * is authenticated, the row is matched on `ownerUserId`, and the object is
 * streamed back through this function. A private blob url does exist inside the
 * store, but it never reaches a browser, so there is nothing to leak into a
 * history entry, a referrer or a shared link.
 *
 * Delivery is hostile to the bytes it serves: sniffing off, a null-source
 * sandbox, and PDFs handed over as a download rather than rendered inside
 * HomeCheff's origin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readEvidence } from '@/lib/finance/evidence/evidence.server';
import {
  downloadFilenameFor,
  evidenceDeliveryHeaders,
} from '@/lib/finance/evidence/evidence-policy';
import { evidenceReaderId } from '@/lib/finance/evidence/evidence-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NOT_FOUND_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  try {
    const ownerUserId = await evidenceReaderId(req);
    if (!ownerUserId) {
      return new NextResponse('Not found', { status: 404, headers: NOT_FOUND_HEADERS });
    }

    const { evidenceId } = await params;
    const result = await readEvidence(ownerUserId, evidenceId);

    // Logged out, wrong owner, deleted and genuinely absent all answer the same
    // 404. Distinguishing them would turn this route into an oracle for whether
    // a given evidence id exists.
    if (!result.ok) {
      return new NextResponse('Not found', { status: 404, headers: NOT_FOUND_HEADERS });
    }

    const { object, row } = result;
    return new NextResponse(object.stream, {
      status: 200,
      headers: evidenceDeliveryHeaders({
        mimeType: row.mimeType,
        downloadFilename: downloadFilenameFor({
          originalFilename: row.originalFilename,
          mimeType: row.mimeType,
          evidenceId: row.id,
        }),
        sizeBytes: object.size,
      }),
    });
  } catch (error) {
    console.error('evidence content GET failed:', error instanceof Error ? error.name : 'unknown');
    return new NextResponse('Not found', { status: 404, headers: NOT_FOUND_HEADERS });
  }
}

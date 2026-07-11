import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildGdprDataExport,
  buildSafeExportFilename,
  logGdprExportAudit,
} from '@/lib/profile/gdpr-data-export';
import { checkGdprExportRateLimit } from '@/lib/profile/gdpr-export-rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/export-data
 * Authenticated GDPR export — JSON download belonging to session user only.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountDeletedAt: true },
    });

    if (!user || user.accountDeletedAt) {
      return NextResponse.json({ error: 'Account unavailable' }, { status: 404 });
    }

    const rate = checkGdprExportRateLimit(userId);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'Export rate limit exceeded. Try again later.',
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        },
      );
    }

    const payload = await buildGdprDataExport(userId);
    const filename = buildSafeExportFilename(userId, new Date(payload.generatedAt));

    await logGdprExportAudit(userId, {
      filename,
      sections: Object.keys(payload.csvSummaries ?? {}),
    });

    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Export-Remaining': String(rate.remaining),
      },
    });
  } catch (error) {
    console.error('[gdpr-export]', error);
    return NextResponse.json(
      { error: 'Could not generate data export. Please try again later.' },
      { status: 500 },
    );
  }
}

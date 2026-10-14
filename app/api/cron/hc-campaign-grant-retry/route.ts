import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryPendingCampaignGrant } from '@/lib/hc/qualify-first-listing';
import { HC_CAMPAIGN_GRANT_RETRY_BACKOFF_MS, HC_CAMPAIGN_GRANT_RETRY_LIMIT } from '@/lib/hc/campaign-grant-retry';
import { isPreviewDeployment } from '@/lib/hc/preview-service-target';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) return false;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/** Bounded retry for listing rewards after a Growth outage. One failure does not stop the batch. */
export async function GET(req: NextRequest) {
  if (isPreviewDeployment()) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'PREVIEW_MUTATIONS_DISABLED' });
  }
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - HC_CAMPAIGN_GRANT_RETRY_BACKOFF_MS);
  const due = await prisma.user.findMany({
    where: {
      hcCampaignGrantPending: true,
      firstValidListingAt: { not: null },
      hcCampaignCode: { not: null },
      OR: [{ hcCampaignGrantAttemptAt: null }, { hcCampaignGrantAttemptAt: { lte: cutoff } }],
    },
    select: { id: true },
    orderBy: { hcCampaignGrantAttemptAt: { sort: 'asc', nulls: 'first' } },
    take: HC_CAMPAIGN_GRANT_RETRY_LIMIT,
  });
  let retried = 0;
  let failed = 0;
  for (const user of due) {
    try {
      await retryPendingCampaignGrant(user.id);
      retried += 1;
    } catch (error) {
      failed += 1;
      console.warn('[cron/hc-campaign-grant-retry]', error instanceof Error ? error.message : 'retry failed');
    }
  }
  return NextResponse.json({ ok: true, retried, failed, scanned: due.length });
}

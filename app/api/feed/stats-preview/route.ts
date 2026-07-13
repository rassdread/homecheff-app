import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { batchComputeUserStatsPreview } from '@/lib/userStatsBatchPreview';
import { parseFeedStatsPreviewSellerIds } from '@/lib/feed/feed-stats-preview';
import { isFeedApiTimingEnabled } from '@/lib/feed/feed-api-timing';
import { checkRateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: getCorsHeaders(req) },
    );
  }

  const started = performance.now();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers: getCorsHeaders(req) },
    );
  }

  const parsed = parseFeedStatsPreviewSellerIds(body);
  if ('error' in parsed) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: getCorsHeaders(req) },
    );
  }

  const statsPreview =
    parsed.sellerIds.length === 0
      ? {}
      : await batchComputeUserStatsPreview(parsed.sellerIds);
  const totalMs = Math.round(performance.now() - started);

  const headers: Record<string, string> = {
    ...getCorsHeaders(req),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  if (isFeedApiTimingEnabled()) {
    headers['Server-Timing'] = `stats-preview;dur=${totalMs}`;
    headers['Access-Control-Expose-Headers'] = 'Server-Timing';
  }

  return NextResponse.json(
    {
      statsPreview,
      ...(isFeedApiTimingEnabled() ? { timingMs: totalMs } : {}),
    },
    { headers },
  );
}

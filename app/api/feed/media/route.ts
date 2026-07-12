import { NextRequest, NextResponse } from 'next/server';
import { isInlineDataMediaUrl, sanitizeFeedMediaUrl } from '@/lib/feed/sanitize-feed-response-media';
import {
  feedMediaErrorHeaders,
  feedMediaResponseHeaders,
  parseFeedInlineDataUrl,
  parseFeedMediaQuery,
} from '@/lib/feed/feed-media-access';
import { loadVisibleFeedMediaUrl } from '@/lib/feed/feed-media-access.server';

export const dynamic = 'force-dynamic';

function notFound(): NextResponse {
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: feedMediaErrorHeaders() },
  );
}

function badRequest(): NextResponse {
  return NextResponse.json(
    { error: 'Invalid media request' },
    { status: 400, headers: feedMediaErrorHeaders() },
  );
}

export async function GET(req: NextRequest) {
  const parsedQuery = parseFeedMediaQuery(new URL(req.url).searchParams);
  if (!parsedQuery.ok) {
    return badRequest();
  }

  const { type, id, index } = parsedQuery;
  const rawUrl = await loadVisibleFeedMediaUrl(type, id, index);
  if (!rawUrl?.trim()) {
    return notFound();
  }

  const external = sanitizeFeedMediaUrl(rawUrl);
  if (external) {
    return NextResponse.redirect(external, {
      status: 302,
      headers: feedMediaErrorHeaders(),
    });
  }

  if (!isInlineDataMediaUrl(rawUrl)) {
    return notFound();
  }

  const parsed = parseFeedInlineDataUrl(rawUrl);
  if (!parsed.ok) {
    return notFound();
  }

  return new NextResponse(parsed.body, {
    status: 200,
    headers: feedMediaResponseHeaders(parsed.mime),
  });
}

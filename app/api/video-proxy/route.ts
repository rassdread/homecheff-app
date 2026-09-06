import { NextRequest, NextResponse } from 'next/server';
import { validateVideoProxyUrl } from '@/lib/video-proxy-url';

// Node.js runtime: grote video-body en streaming betrouwbaarder dan Edge Runtime
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

const FETCH_TIMEOUT_MS = 25_000;
const MAX_BUFFER_BYTES = 20 * 1024 * 1024;

/** Browsers waarbij we niet streamen maar altijd bufferen (200 + full body) voor betrouwbare playback. */
function shouldForceBuffer(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const safariOrMobile =
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('ipod') ||
    (ua.includes('safari') && !ua.includes('chrome')) ||
    ua.includes('mobile');
  const isEdge = ua.includes('edg/') || ua.includes('edge/');
  const isSamsung = ua.includes('samsungbrowser');
  return safariOrMobile || isEdge || isSamsung;
}

/**
 * Video Proxy Route — proxies only validated Vercel Blob https URLs.
 * Never forwards storage credentials to arbitrary destinations.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const validated = validateVideoProxyUrl(videoUrl);
    if (!validated.ok) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const rangeHeader = request.headers.get('range');
    const userAgent = request.headers.get('user-agent');
    const forceBuffer = shouldForceBuffer(userAgent);
    const passRange = !forceBuffer && rangeHeader;

    const headers: Record<string, string> = {
      'User-Agent': userAgent || 'Mozilla/5.0 (compatible; Homecheff-Video-Proxy/1.0)',
    };
    if (passRange) headers.Range = rangeHeader!;

    // Attach blob credential ONLY for trusted blob hostnames that require it.
    if (validated.mayAttachBlobCredential) {
      const blobToken =
        process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
        process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim();
      // Never use NEXT_PUBLIC_* write tokens here.
      if (blobToken && !blobToken.startsWith('vercel_blob_rw_public')) {
        headers.Authorization = `Bearer ${blobToken}`;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let videoResponse: Response;
    try {
      videoResponse = await fetch(validated.href, {
        headers,
        redirect: 'error', // never follow redirects (SSRF via open redirect)
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!videoResponse.ok) {
      console.error('[video-proxy] Blob fetch failed:', videoResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: videoResponse.status, headers: CORS_HEADERS }
      );
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('content-length');
    const contentRange = videoResponse.headers.get('content-range');
    const size = contentLength ? parseInt(contentLength, 10) : 0;
    const body = videoResponse.body;
    if (!body) {
      return NextResponse.json(
        { error: 'No video body' },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    if (size > MAX_BUFFER_BYTES && forceBuffer) {
      // Still stream large files when forced buffer would exceed memory
    }

    const bufferThreshold = forceBuffer ? MAX_BUFFER_BYTES : 8 * 1024 * 1024;
    const shouldBuffer = forceBuffer || (size > 0 && size <= bufferThreshold);
    if (shouldBuffer && size > 0 && size <= MAX_BUFFER_BYTES) {
      const buffer = await videoResponse.arrayBuffer();
      const bufLen = buffer.byteLength;
      if (bufLen > MAX_BUFFER_BYTES) {
        return NextResponse.json(
          { error: 'Video too large' },
          { status: 413, headers: CORS_HEADERS }
        );
      }
      const headersBuffered: Record<string, string> = {
        'Content-Type': contentType.split(';')[0].trim() || 'video/mp4',
        'Content-Length': String(bufLen),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline; filename="video.mp4"',
        ...CORS_HEADERS,
      };
      return new NextResponse(buffer, {
        status: 200,
        headers: headersBuffered,
      });
    }

    const outHeaders: Record<string, string> = {
      'Content-Type': (contentType || 'video/mp4').split(';')[0].trim(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ...CORS_HEADERS,
    };
    if (contentLength) outHeaders['Content-Length'] = contentLength;
    if (contentRange) outHeaders['Content-Range'] = contentRange;

    return new NextResponse(body, {
      status: videoResponse.status,
      headers: outHeaders,
    });
  } catch (error: any) {
    const msg = error?.name === 'AbortError' ? 'timeout' : 'Failed to proxy video';
    console.error('Video proxy error:', msg);
    return NextResponse.json(
      { error: 'Failed to proxy video' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}

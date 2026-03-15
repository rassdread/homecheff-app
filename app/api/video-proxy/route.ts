import { NextRequest, NextResponse } from 'next/server';

// Node.js runtime: grote video-body en streaming betrouwbaarder dan Edge Runtime
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

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
  // Edge (Chromium) heeft soms problemen met 206 Range via proxy; bufferen voorkomt dat
  const isEdge = ua.includes('edg/') || ua.includes('edge/');
  return safariOrMobile || isEdge;
}

/**
 * Video Proxy Route
 *
 * Proxies video from Vercel Blob with CORS and byte-range support for Safari iOS.
 * Safari sends Range requests (e.g. bytes=0-1) and needs 206 + Accept-Ranges for smooth playback.
 * Op Safari/iOS: altijd bufferen (geen stream) om MEDIA_ERR_SRC_NOT_SUPPORTED (code 4) te voorkomen.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const decodedUrl = decodeURIComponent(videoUrl);

    if (!decodedUrl.includes('blob.vercel-storage.com') && !decodedUrl.includes('vercel-storage.com')) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    const rangeHeader = request.headers.get('range');
    const userAgent = request.headers.get('user-agent');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    const forceBuffer = shouldForceBuffer(userAgent);
    // Bij forceBuffer: geen Range doorsturen → één volledige 200 response, dan bufferen.
    const passRange = !forceBuffer && rangeHeader;

    const videoResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': userAgent || 'Mozilla/5.0 (compatible; Homecheff-Video-Proxy/1.0)',
        ...(passRange ? { Range: rangeHeader } : {}),
        ...(blobToken ? { Authorization: `Bearer ${blobToken}` } : {}),
      },
    });

    if (!videoResponse.ok) {
      console.error('[video-proxy] Blob fetch failed:', videoResponse.status, decodedUrl.slice(0, 80));
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
      console.error('[video-proxy] No response body');
      return NextResponse.json(
        { error: 'No video body' },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // Bufferen: (1) Safari/iOS/Edge altijd (stream/206 geeft daar soms problemen), (2) anders alleen onder 8MB
    const bufferThreshold = forceBuffer ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
    const shouldBuffer = forceBuffer || (size > 0 && size <= bufferThreshold);
    if (shouldBuffer) {
      const buffer = await videoResponse.arrayBuffer();
      // Voor 200 full-body: geen Content-Range (alleen bij 206). Edge is strikt op headers.
      const bufLen = buffer.byteLength;
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

    const headers: Record<string, string> = {
      'Content-Type': (contentType || 'video/mp4').split(';')[0].trim(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ...CORS_HEADERS,
    };
    if (contentLength) headers['Content-Length'] = contentLength;
    if (contentRange) headers['Content-Range'] = contentRange;

    return new NextResponse(body, {
      status: videoResponse.status,
      headers,
    });
  } catch (error: any) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy video' },
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






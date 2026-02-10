import { NextRequest, NextResponse } from 'next/server';

/**
 * Video Proxy Route
 * 
 * Proxies video requests from Vercel Blob Storage with proper CORS headers
 * to fix CORS errors when loading videos in the browser.
 * 
 * Usage: /api/video-proxy?url=<encoded-video-url>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(videoUrl);

    // Validate that it's a Vercel Blob Storage URL
    if (!decodedUrl.includes('public.blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400 }
      );
    }

    // Fetch the video from Vercel Blob Storage
    const videoResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: videoResponse.status }
      );
    }

    // Get the video data
    const videoBuffer = await videoResponse.arrayBuffer();
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

    // Return the video with proper CORS headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': videoBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy video' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}






import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { canAccessPromoLibrary, getPromoActor } from '@/lib/affiliate-media/actor';
import {
  AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
  AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
} from '@/lib/affiliate-media/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PATH_RE = /^affiliate-media\/[a-z0-9-]+\/(image|video|poster)\.(jpg|jpeg|png|webp|mp4)$/i;

export async function POST(request: Request) {
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATH_RE.test(pathname)) {
          throw new Error('invalid_storage_key');
        }
        const isVideo = pathname.toLowerCase().endsWith('.mp4');
        return {
          allowedContentTypes: isVideo
            ? [...ALLOWED_VIDEO_MIMES]
            : [...ALLOWED_IMAGE_MIMES],
          maximumSizeInBytes: isVideo
            ? AFFILIATE_MEDIA_VIDEO_MAX_BYTES
            : AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ userId: actor.userId }),
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload_token_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

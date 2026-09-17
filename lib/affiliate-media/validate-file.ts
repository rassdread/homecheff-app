import {
  AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
  AFFILIATE_MEDIA_IMAGE_MAX_EDGE,
  AFFILIATE_MEDIA_POSTER_MAX_BYTES,
  AFFILIATE_MEDIA_VIDEO_DURATION_TOLERANCE_MS,
  AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
  AFFILIATE_MEDIA_VIDEO_MAX_DURATION_MS,
  AFFILIATE_MEDIA_VIDEO_MAX_EDGE,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
} from '@/lib/affiliate-media/constants';
import { inspectImage, stripJpegExif } from '@/lib/affiliate-media/image-inspect';
import { inspectMp4 } from '@/lib/affiliate-media/mp4-inspect';

export type ValidatedImage = {
  kind: 'IMAGE';
  buffer: Buffer;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
};

export type ValidatedVideo = {
  kind: 'VIDEO';
  buffer: Buffer;
  mimeType: 'video/mp4';
  byteSize: number;
  durationMs: number | null;
  hasH264Hint: boolean;
};

export function validatePromoImage(
  buffer: Buffer,
  declaredMime: string,
): { ok: true; value: ValidatedImage } | { ok: false; error: string } {
  if (buffer.length > AFFILIATE_MEDIA_IMAGE_MAX_BYTES) return { ok: false, error: 'image_too_large' };
  const mime = declaredMime.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    return { ok: false, error: 'unsupported_image_type' };
  }
  const inspected = inspectImage(buffer);
  if (!inspected.ok) return inspected;
  if (
    inspected.width &&
    inspected.height &&
    (inspected.width > AFFILIATE_MEDIA_IMAGE_MAX_EDGE || inspected.height > AFFILIATE_MEDIA_IMAGE_MAX_EDGE)
  ) {
    return { ok: false, error: 'image_dimensions_too_large' };
  }
  const stripped = inspected.kind === 'jpeg' ? stripJpegExif(buffer) : buffer;
  return {
    ok: true,
    value: {
      kind: 'IMAGE',
      buffer: stripped,
      mimeType: inspected.mime,
      byteSize: stripped.length,
      width: inspected.width,
      height: inspected.height,
    },
  };
}

export function validatePromoPoster(
  buffer: Buffer,
  declaredMime: string,
): { ok: true; value: ValidatedImage } | { ok: false; error: string } {
  if (buffer.length > AFFILIATE_MEDIA_POSTER_MAX_BYTES) return { ok: false, error: 'poster_too_large' };
  return validatePromoImage(buffer, declaredMime);
}

export function validatePromoVideo(
  buffer: Buffer,
  declaredMime: string,
  fileName: string,
): { ok: true; value: ValidatedVideo } | { ok: false; error: string } {
  if (buffer.length > AFFILIATE_MEDIA_VIDEO_MAX_BYTES) return { ok: false, error: 'video_too_large' };
  const mime = declaredMime.toLowerCase();
  const name = fileName.toLowerCase();
  if (!ALLOWED_VIDEO_MIMES.includes(mime as (typeof ALLOWED_VIDEO_MIMES)[number]) && !name.endsWith('.mp4')) {
    return { ok: false, error: 'video_mp4_only' };
  }
  if (name.endsWith('.mov') || name.endsWith('.webm') || mime.includes('quicktime') || mime.includes('webm')) {
    return { ok: false, error: 'video_mp4_only' };
  }
  const inspected = inspectMp4(buffer);
  if (!inspected.ok) return inspected;
  if (inspected.durationMs == null || inspected.durationMs <= 0) {
    return { ok: false, error: 'video_duration_unknown' };
  }
  if (inspected.durationMs > AFFILIATE_MEDIA_VIDEO_MAX_DURATION_MS + AFFILIATE_MEDIA_VIDEO_DURATION_TOLERANCE_MS) {
    return { ok: false, error: 'video_too_long' };
  }
  return {
    ok: true,
    value: {
      kind: 'VIDEO',
      buffer,
      mimeType: 'video/mp4',
      byteSize: buffer.length,
      durationMs: inspected.durationMs,
      hasH264Hint: inspected.hasH264Hint,
    },
  };
}

export function rejectOversizedVideoFrame(width: number | null, height: number | null): boolean {
  if (!width || !height) return false;
  return width > AFFILIATE_MEDIA_VIDEO_MAX_EDGE || height > AFFILIATE_MEDIA_VIDEO_MAX_EDGE;
}

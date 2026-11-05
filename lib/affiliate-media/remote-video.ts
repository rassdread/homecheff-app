import { AFFILIATE_MEDIA_VIDEO_MAX_BYTES } from '@/lib/affiliate-media/constants';
import { inspectMp4Source } from '@/lib/affiliate-media/mp4-inspect';
import { probeTrustedAffiliateMediaBlob, readTrustedBlobRange } from '@/lib/affiliate-media/trusted-blob';
import { assertPromoVideoMeta } from '@/lib/affiliate-media/validate-file';

/**
 * Validates a video that was already stored by the browser's direct Blob upload.
 * Only ftyp/moov windows are fetched, so a 55 MB MP4 never sits in the function body.
 */
export async function validateRemotePromoVideo(
  url: string,
  declaredMime: string,
  fileName: string,
): Promise<
  { ok: true; byteSize: number; durationMs: number; mimeType: 'video/mp4' } | { ok: false; error: string }
> {
  const probed = await probeTrustedAffiliateMediaBlob(url, AFFILIATE_MEDIA_VIDEO_MAX_BYTES);
  if (!probed.ok) return probed;
  try {
    const inspected = await inspectMp4Source({
      length: probed.byteSize,
      read: (offset, length) => readTrustedBlobRange(url, offset, length),
    });
    const meta = assertPromoVideoMeta({
      byteSize: probed.byteSize,
      declaredMime,
      fileName,
      inspected,
    });
    if (!meta.ok) return meta;
    return { ok: true, byteSize: probed.byteSize, durationMs: meta.durationMs, mimeType: 'video/mp4' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'blob_fetch_failed';
    if (message === 'untrusted_blob_url' || message === 'blob_fetch_failed') return { ok: false, error: message };
    return { ok: false, error: 'blob_fetch_failed' };
  }
}

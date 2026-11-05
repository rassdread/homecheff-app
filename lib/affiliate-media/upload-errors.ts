import {
  AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
  AFFILIATE_MEDIA_INLINE_MAX_BYTES,
  AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
} from '@/lib/affiliate-media/constants';

function megabytes(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

/** Files above the serverless body limit must use the direct Blob upload. */
export function affiliateMediaUploadTransport(byteSize: number): 'direct' | 'inline' {
  return byteSize > AFFILIATE_MEDIA_INLINE_MAX_BYTES ? 'direct' : 'inline';
}

export function classifyAffiliatePromoFile(
  fileName: string,
  mimeType: string,
): 'video' | 'image' | 'rejected' {
  const lower = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  const videoLike =
    mime.startsWith('video/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mkv');
  if (videoLike) {
    if (
      lower.endsWith('.mov') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mkv') ||
      mime.includes('quicktime') ||
      mime.includes('webm')
    ) {
      return 'rejected';
    }
    if (lower.endsWith('.mp4') || mime === 'video/mp4' || mime === 'video/mpeg4') return 'video';
    return 'rejected';
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png' || mime === 'image/webp') {
    return 'image';
  }
  if (/\.(jpe?g|png|webp)$/.test(lower)) return 'image';
  return 'rejected';
}

export function affiliateMediaUploadErrorMessage(code: string | null | undefined): string {
  const videoMax = megabytes(AFFILIATE_MEDIA_VIDEO_MAX_BYTES);
  const imageMax = megabytes(AFFILIATE_MEDIA_IMAGE_MAX_BYTES);
  switch (code) {
    case 'video_too_long':
      return 'Video mag maximaal 60 seconden duren.';
    case 'video_too_large':
    case 'file_too_large':
      return `Video is te groot. Maximaal ${videoMax} MB.`;
    case 'image_too_large':
      return `Afbeelding is te groot. Maximaal ${imageMax} MB.`;
    case 'poster_too_large':
      return 'Het voorbeeldbeeld van de video is te groot.';
    case 'video_mp4_only':
    case 'unsupported_video_codec':
    case 'unsupported_mp4_brand':
    case 'not_mp4_ftyp':
      return 'Alleen MP4 (H.264) video is toegestaan.';
    case 'video_duration_unknown':
    case 'video_load_failed':
      return 'De videoduur kon niet worden gecontroleerd. Gebruik een MP4 van maximaal 60 seconden.';
    case 'unsupported_image_type':
    case 'forbidden_type':
      return 'Alleen JPG, PNG of WebP is toegestaan.';
    case 'storage_unavailable':
    case 'BLOB_TOKEN_MISSING':
    case 'blob_fetch_failed':
    case 'upload_token_failed':
      return 'Opslag is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
    case 'reuse_consent_required':
      return 'Geef toestemming voor hergebruik door andere affiliates.';
    case 'rate_limited':
      return 'Te veel uploads. Probeer het later opnieuw.';
    case 'untrusted_blob_url':
      return 'Upload mislukt. Het bestand staat niet in de HomeCheff-opslag.';
    default: {
      if (code && /exceeds the maximum allowed size/i.test(code)) {
        return `Video is te groot. Maximaal ${videoMax} MB.`;
      }
      if (code && /Failed to\s+retrieve the client token/i.test(code)) {
        return 'Opslag is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
      }
      return 'Upload mislukt. Probeer het opnieuw.';
    }
  }
}

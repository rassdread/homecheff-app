/**
 * Share a promo MP4 as a real file.
 *
 * The link field is omitted on purpose. iOS and WhatsApp drop the file and
 * show a page preview when `url` is set next to `files`. The affiliate URL is
 * placed once in `text`, which some apps keep as a caption. A forwarded file
 * does not carry that caption, so this is not guaranteed click tracking.
 */

import { AFFILIATE_MEDIA_IMAGE_MAX_BYTES, AFFILIATE_MEDIA_VIDEO_MAX_BYTES } from '@/lib/affiliate-media/constants';
import { isTrustedAffiliateMediaBlobUrl } from '@/lib/affiliate-media/trusted-blob';
import {
  composeSingleUrlShareBody,
  countHttpUrls,
  isShareAbortError,
  stripUrlFromShareText,
} from '@/lib/share/exactly-once-share';

export const PROMO_VIDEO_SHARE_COPY = {
  sharing: 'Videobestand delen…',
  shared:
    'De video is gedeeld. Als de app de tekst meeneemt, staat je affiliatelink erbij. Een doorgestuurd bestand telt niet vanzelf als klik.',
  sharedWithoutCaption:
    'De video is gedeeld zonder tekst. Gebruik “Deel met mijn link” als je de affiliatelink wilt meesturen.',
  downloaded:
    'Deze browser kan de video niet als bestand delen. Het bestand is gedownload. Stuur het zelf via WhatsApp en gebruik “Deel met mijn link” voor je affiliatelink.',
  fetchFailed: 'De video kon niet worden opgehaald. Probeer het opnieuw.',
  notMp4: 'Dit bestand is geen MP4 en kan niet als video worden gedeeld.',
  tooLarge: 'Deze video is groter dan 80 MB en kan niet worden gedeeld.',
} as const;

export const PROMO_IMAGE_SHARE_COPY = {
  sharing: 'Afbeeldingsbestand delen…',
  shared:
    'De afbeelding is gedeeld. Als de app de tekst meeneemt, staat je affiliatelink erbij. Een doorgestuurd bestand telt niet vanzelf als klik.',
  sharedWithoutCaption:
    'De afbeelding is gedeeld zonder tekst. Gebruik “Bijschrift kopiëren” of “Deel met mijn link”.',
  downloaded:
    'Deze browser kan de afbeelding niet als bestand delen. Het bestand is gedownload. Kopieer het bijschrift en stuur beide zelf.',
  saved: 'Het bestand is gedownload. Kopieer het bijschrift als je je affiliatelink wilt meesturen.',
  fetchFailed: 'De afbeelding kon niet worden opgehaald. Probeer het opnieuw.',
  wrongType: 'Dit bestand is geen JPG, PNG of WebP en kan niet als afbeelding worden gedeeld.',
  tooLarge: 'Deze afbeelding is groter dan 8 MB en kan niet worden gedeeld.',
  captionCopied: 'Bijschrift gekopieerd. Plak het bij je bericht. Een doorgestuurd bestand bevat deze link niet vanzelf.',
} as const;

export const PROMO_CAPTION_INTRO = 'Ontdek HomeCheff — lokaal kopen, verkopen, bezorgen en verdienen.';

export function promoVideoFetchLabel(percent: number | null): string {
  if (percent == null) return 'Video ophalen…';
  return `Video ophalen… ${Math.max(0, Math.min(99, Math.round(percent)))}%`;
}

export function promoImageFetchLabel(percent: number | null): string {
  if (percent == null) return 'Afbeelding ophalen…';
  return `Afbeelding ophalen… ${Math.max(0, Math.min(99, Math.round(percent)))}%`;
}

/** One affiliate link, plus a short HomeCheff invitation. Forwarding the file does not keep this text. */
export function buildPromoAffiliateCaption(input: {
  title?: string | null;
  caption?: string | null;
  affiliateUrl: string;
}): string {
  const affiliateUrl = input.affiliateUrl.trim();
  const withoutOtherLinks = (value: string) =>
    stripUrlFromShareText(value, affiliateUrl)
      .replace(/https?:\/\/[^\s<>"'')\]]+/gi, '')
      .replace(/\?ref=[A-Za-z0-9_-]+/gi, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  const own = withoutOtherLinks((input.caption || '').trim());
  const title = withoutOtherLinks((input.title || '').trim());
  const lines = [PROMO_CAPTION_INTRO];
  if (own && own !== PROMO_CAPTION_INTRO) lines.push(own);
  else if (title && title !== 'HomeCheff' && title !== PROMO_CAPTION_INTRO) lines.push(title);
  return composeSingleUrlShareBody(lines.join('\n\n'), affiliateUrl, title || 'HomeCheff');
}

export function promoVideoShareFileName(title: string | null | undefined): string {
  const base = (title || 'homecheff-promo')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const stem = (base || 'homecheff-promo').replace(/\.mp4$/i, '');
  return `${stem || 'homecheff-promo'}.mp4`;
}

export type PromoVideoFileShareData = {
  files: File[];
  title: string;
  text: string;
};

/** File payload. There is no `url` field, so the page preview cannot replace the MP4. */
export function buildPromoVideoFileShareData(input: {
  title: string;
  caption?: string | null;
  affiliateUrl: string;
  file: File;
}): PromoVideoFileShareData {
  if (input.file.type !== 'video/mp4') {
    throw new Error('video_mp4_only');
  }
  const affiliateUrl = input.affiliateUrl.trim();
  const title = stripUrlFromShareText(input.title.trim() || 'HomeCheff', affiliateUrl) || 'HomeCheff';
  const text = buildPromoAffiliateCaption({
    title: input.title,
    caption: input.caption,
    affiliateUrl,
  });
  if (affiliateUrl && countHttpUrls(text) !== 1) {
    throw new Error('affiliate_url_not_once');
  }
  return { files: [input.file], title, text };
}

export type PromoImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function promoImageShareFileName(title: string | null | undefined, mime: PromoImageMime): string {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const base = (title || 'homecheff-promo')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/\.(mp4|jpe?g|png|webp)$/i, '');
  return `${base || 'homecheff-promo'}.${ext}`;
}

export function buildPromoImageFileShareData(input: {
  title: string;
  caption?: string | null;
  affiliateUrl: string;
  file: File;
}): PromoVideoFileShareData {
  if (input.file.type !== 'image/jpeg' && input.file.type !== 'image/png' && input.file.type !== 'image/webp') {
    throw new Error('unsupported_image_type');
  }
  const affiliateUrl = input.affiliateUrl.trim();
  const title = stripUrlFromShareText(input.title.trim() || 'HomeCheff', affiliateUrl) || 'HomeCheff';
  const text = buildPromoAffiliateCaption({
    title: input.title,
    caption: input.caption,
    affiliateUrl,
  });
  if (affiliateUrl && countHttpUrls(text) !== 1) {
    throw new Error('affiliate_url_not_once');
  }
  return { files: [input.file], title, text };
}

export type PromoVideoFetchResult =
  | { ok: true; file: File }
  | {
      ok: false;
      error: 'untrusted_blob_url' | 'video_too_large' | 'blob_fetch_failed' | 'unsupported_video_type' | 'aborted';
    };

function headerMime(contentType: string): string {
  return contentType.split(';')[0]?.trim().toLowerCase() || '';
}

function pathName(mediaUrl: string): string {
  try {
    return new URL(mediaUrl).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function acceptedMp4Type(contentType: string, mediaUrl: string): boolean {
  const mime = headerMime(contentType);
  if (mime === 'video/mp4' || mime === 'application/mp4') return true;
  const path = pathName(mediaUrl);
  if (!path.endsWith('.mp4')) return false;
  return mime === '' || mime === 'application/octet-stream' || mime === 'binary/octet-stream';
}

export function promoImageMime(contentType: string, mediaUrl: string): PromoImageMime | null {
  const mime = headerMime(contentType);
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'image/png') return 'image/png';
  if (mime === 'image/webp') return 'image/webp';
  const path = pathName(mediaUrl);
  const extensionMime: PromoImageMime | null = path.endsWith('.png')
    ? 'image/png'
    : path.endsWith('.webp')
      ? 'image/webp'
      : path.endsWith('.jpg') || path.endsWith('.jpeg')
        ? 'image/jpeg'
        : null;
  if (!extensionMime) return null;
  if (mime === '' || mime === 'application/octet-stream' || mime === 'binary/octet-stream') return extensionMime;
  return null;
}

type TrustedRead =
  | { ok: true; chunks: Uint8Array[]; mime: string }
  | { ok: false; error: 'untrusted_blob_url' | 'too_large' | 'blob_fetch_failed' | 'unsupported_type' | 'aborted' };

/**
 * One read of a trusted blob. Chunks are handed to a single File by the caller.
 * The read stops at maxBytes and does not decode or recompress the bytes.
 */
async function readTrustedPromoBlob(
  mediaUrl: string,
  options: {
    maxBytes: number;
    signal?: AbortSignal;
    onProgress?: (percent: number | null) => void;
    fetchImpl?: typeof fetch;
    accept: (contentType: string, url: string) => string | null;
  },
): Promise<TrustedRead> {
  if (!isTrustedAffiliateMediaBlobUrl(mediaUrl)) return { ok: false, error: 'untrusted_blob_url' };
  if (options.signal?.aborted) return { ok: false, error: 'aborted' };
  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(mediaUrl, {
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted || isShareAbortError(err)) return { ok: false, error: 'aborted' };
    return { ok: false, error: 'blob_fetch_failed' };
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    return { ok: false, error: 'blob_fetch_failed' };
  }
  const contentType = response.headers.get('content-type') || '';
  const mime = options.accept(contentType, mediaUrl);
  if (!mime) {
    await response.body.cancel().catch(() => undefined);
    return { ok: false, error: 'unsupported_type' };
  }
  const declared = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > options.maxBytes) {
    await response.body.cancel().catch(() => undefined);
    return { ok: false, error: 'too_large' };
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  const total = Number.isFinite(declared) && declared > 0 ? declared : null;
  try {
    while (true) {
      if (options.signal?.aborted) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: 'aborted' };
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      if (loaded + value.byteLength > options.maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: 'too_large' };
      }
      chunks.push(value);
      loaded += value.byteLength;
      options.onProgress?.(total ? Math.min(99, Math.round((loaded / total) * 100)) : null);
    }
  } catch (err) {
    await reader.cancel().catch(() => undefined);
    if (options.signal?.aborted || isShareAbortError(err)) return { ok: false, error: 'aborted' };
    return { ok: false, error: 'blob_fetch_failed' };
  }
  if (loaded <= 0) return { ok: false, error: 'blob_fetch_failed' };
  return { ok: true, chunks, mime };
}

function videoFetchError(error: Exclude<TrustedRead, { ok: true }>['error']): PromoVideoFetchResult {
  if (error === 'too_large') return { ok: false, error: 'video_too_large' };
  if (error === 'unsupported_type') return { ok: false, error: 'unsupported_video_type' };
  return { ok: false, error };
}

/**
 * Download one trusted promo MP4 into a single File.
 * Bytes are kept once as chunks and then handed to File. The read stops at 80 MiB.
 */
export async function fetchPromoVideoFile(
  mediaUrl: string,
  options: {
    maxBytes?: number;
    fileName?: string;
    signal?: AbortSignal;
    onProgress?: (percent: number | null) => void;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<PromoVideoFetchResult> {
  const read = await readTrustedPromoBlob(mediaUrl, {
    maxBytes: options.maxBytes ?? AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
    signal: options.signal,
    onProgress: options.onProgress,
    fetchImpl: options.fetchImpl,
    accept: (contentType, url) => (acceptedMp4Type(contentType, url) ? 'video/mp4' : null),
  });
  if (!read.ok) return videoFetchError(read.error);
  const file = new File(read.chunks as BlobPart[], promoVideoShareFileName(options.fileName), { type: 'video/mp4' });
  read.chunks.length = 0;
  return { ok: true, file };
}

export type PromoImageFetchResult =
  | { ok: true; file: File }
  | {
      ok: false;
      error: 'untrusted_blob_url' | 'image_too_large' | 'blob_fetch_failed' | 'unsupported_image_type' | 'aborted';
    };

/** Download one trusted JPG, PNG or WebP. The bytes are not recompressed. */
export async function fetchPromoImageFile(
  mediaUrl: string,
  options: {
    maxBytes?: number;
    fileName?: string;
    signal?: AbortSignal;
    onProgress?: (percent: number | null) => void;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<PromoImageFetchResult> {
  const read = await readTrustedPromoBlob(mediaUrl, {
    maxBytes: options.maxBytes ?? AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
    signal: options.signal,
    onProgress: options.onProgress,
    fetchImpl: options.fetchImpl,
    accept: (contentType, url) => promoImageMime(contentType, url),
  });
  if (!read.ok) {
    if (read.error === 'too_large') return { ok: false, error: 'image_too_large' };
    if (read.error === 'unsupported_type') return { ok: false, error: 'unsupported_image_type' };
    return { ok: false, error: read.error };
  }
  const mime = read.mime as PromoImageMime;
  const file = new File(read.chunks as BlobPart[], promoImageShareFileName(options.fileName, mime), { type: mime });
  read.chunks.length = 0;
  return { ok: true, file };
}

export function canShareVideoFile(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') {
    return false;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

let videoSharePending = false;

export type PromoVideoShareResult =
  | { ok: true; method: 'native'; captionIncluded: boolean }
  | { ok: false; method: 'cancelled' | 'busy' | 'unsupported' | 'failed' };

/**
 * One file share. Checks canShare({ files }) only, then shares the file and
 * caption without a url field. Cancellation does not fall back to a link.
 */
const SHAREABLE_FILE_TYPES = new Set(['video/mp4', 'image/jpeg', 'image/png', 'image/webp']);

/** Image or video file share. No url field. Cancel does not fall back to a link. */
export async function sharePromoMediaFile(data: PromoVideoFileShareData): Promise<PromoVideoShareResult> {
  const file = data.files[0];
  if (!file || !SHAREABLE_FILE_TYPES.has(file.type)) return { ok: false, method: 'failed' };
  if (!canShareVideoFile(file)) return { ok: false, method: 'unsupported' };
  if (videoSharePending) return { ok: false, method: 'busy' };
  videoSharePending = true;
  try {
    try {
      await navigator.share({ files: [file], title: data.title, text: data.text });
      return { ok: true, method: 'native', captionIncluded: true };
    } catch (err) {
      if (isShareAbortError(err)) return { ok: false, method: 'cancelled' };
    }
    try {
      await navigator.share({ files: [file] });
      return { ok: true, method: 'native', captionIncluded: false };
    } catch (err) {
      if (isShareAbortError(err)) return { ok: false, method: 'cancelled' };
      return { ok: false, method: 'failed' };
    }
  } finally {
    videoSharePending = false;
  }
}

export async function sharePromoVideoFile(data: PromoVideoFileShareData): Promise<PromoVideoShareResult> {
  if (data.files[0]?.type !== 'video/mp4') return { ok: false, method: 'failed' };
  return sharePromoMediaFile(data);
}

export async function sharePromoImageFile(data: PromoVideoFileShareData): Promise<PromoVideoShareResult> {
  const type = data.files[0]?.type;
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/webp') {
    return { ok: false, method: 'failed' };
  }
  return sharePromoMediaFile(data);
}

export function downloadPromoMediaFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadPromoVideoFile(file: File): void {
  downloadPromoMediaFile(file);
}

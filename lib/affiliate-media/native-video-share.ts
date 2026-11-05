/**
 * Share a promo MP4 as a real file.
 *
 * The link field is omitted on purpose. iOS and WhatsApp drop the file and
 * show a page preview when `url` is set next to `files`. The affiliate URL is
 * placed once in `text`, which some apps keep as a caption. A forwarded file
 * does not carry that caption, so this is not guaranteed click tracking.
 */

import { AFFILIATE_MEDIA_VIDEO_MAX_BYTES } from '@/lib/affiliate-media/constants';
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

export function promoVideoFetchLabel(percent: number | null): string {
  if (percent == null) return 'Video ophalen…';
  return `Video ophalen… ${Math.max(0, Math.min(99, Math.round(percent)))}%`;
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
  const caption = stripUrlFromShareText((input.caption || '').trim(), affiliateUrl);
  const lead = caption && caption !== title ? caption : title;
  const text = composeSingleUrlShareBody(lead, affiliateUrl, title);
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

function acceptedMp4Type(contentType: string, mediaUrl: string): boolean {
  const mime = contentType.split(';')[0]?.trim().toLowerCase() || '';
  if (mime === 'video/mp4' || mime === 'application/mp4') return true;
  let path = '';
  try {
    path = new URL(mediaUrl).pathname.toLowerCase();
  } catch {
    return false;
  }
  if (!path.endsWith('.mp4')) return false;
  return mime === '' || mime === 'application/octet-stream' || mime === 'binary/octet-stream';
}

/**
 * Download one trusted promo MP4 into a single File.
 * Bytes are kept once as chunks and then handed to File. Callers must drop
 * the File when the share finishes. The read stops at 80 MiB.
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
  if (!isTrustedAffiliateMediaBlobUrl(mediaUrl)) return { ok: false, error: 'untrusted_blob_url' };
  if (options.signal?.aborted) return { ok: false, error: 'aborted' };
  const maxBytes = options.maxBytes ?? AFFILIATE_MEDIA_VIDEO_MAX_BYTES;
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
  if (!acceptedMp4Type(contentType, mediaUrl)) {
    await response.body.cancel().catch(() => undefined);
    return { ok: false, error: 'unsupported_video_type' };
  }
  const declared = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body.cancel().catch(() => undefined);
    return { ok: false, error: 'video_too_large' };
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
      if (loaded + value.byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: 'video_too_large' };
      }
      chunks.push(value);
      loaded += value.byteLength;
      const percent = total ? Math.min(99, Math.round((loaded / total) * 100)) : null;
      options.onProgress?.(percent);
    }
  } catch (err) {
    await reader.cancel().catch(() => undefined);
    if (options.signal?.aborted || isShareAbortError(err)) return { ok: false, error: 'aborted' };
    return { ok: false, error: 'blob_fetch_failed' };
  }
  if (loaded <= 0) return { ok: false, error: 'blob_fetch_failed' };
  const file = new File(chunks as BlobPart[], promoVideoShareFileName(options.fileName), { type: 'video/mp4' });
  chunks.length = 0;
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
export async function sharePromoVideoFile(data: PromoVideoFileShareData): Promise<PromoVideoShareResult> {
  const file = data.files[0];
  if (!file || file.type !== 'video/mp4') return { ok: false, method: 'failed' };
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

export function downloadPromoVideoFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name.endsWith('.mp4') ? file.name : `${file.name}.mp4`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const BLOB_HOST_RE = /\.blob\.vercel-storage\.com$/i;

/** Prevent SSRF: only fetch our own Vercel Blob affiliate-media objects. */
export function isTrustedAffiliateMediaBlobUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    if (!BLOB_HOST_RE.test(u.hostname) && u.hostname !== 'blob.vercel-storage.com') return false;
    if (u.username || u.password) return false;
    if (u.search) return false;
    return /\/affiliate-media\//.test(u.pathname);
  } catch {
    return false;
  }
}

export function totalFromContentRange(header: string | null): number | null {
  if (!header) return null;
  const match = /\/(\d+)\s*$/.exec(header);
  if (!match) return null;
  const total = Number(match[1]);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

const MAX_RANGE_BYTES = 8 * 1024 * 1024;
const BLOB_READ_TIMEOUT_MS = 15_000;

async function readBodyCapped(res: Response, cap: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('blob_fetch_failed');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const room = cap - total;
      if (value.byteLength > room) {
        chunks.push(value.subarray(0, room));
        total += room;
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks);
}

/** Byte length via HEAD or a 1-byte range. Does not download the object. */
export async function probeTrustedAffiliateMediaBlob(
  url: string,
  maxBytes: number,
): Promise<{ ok: true; byteSize: number; contentType: string } | { ok: false; error: string }> {
  if (!isTrustedAffiliateMediaBlobUrl(url)) return { ok: false, error: 'untrusted_blob_url' };
  try {
    const head = await fetch(url, {
      method: 'HEAD',
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(BLOB_READ_TIMEOUT_MS),
    });
    if (head.status === 404) return { ok: false, error: 'blob_fetch_failed' };
    const headLen = Number(head.headers.get('content-length') || 0);
    if (head.ok && headLen > 0) {
      if (headLen > maxBytes) return { ok: false, error: 'video_too_large' };
      return { ok: true, byteSize: headLen, contentType: head.headers.get('content-type') || '' };
    }
    const ranged = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(BLOB_READ_TIMEOUT_MS),
    });
    const total = totalFromContentRange(ranged.headers.get('content-range'));
    await ranged.body?.cancel().catch(() => undefined);
    if (!ranged.ok && ranged.status !== 206) return { ok: false, error: 'blob_fetch_failed' };
    if (total == null) return { ok: false, error: 'blob_fetch_failed' };
    if (total > maxBytes) return { ok: false, error: 'video_too_large' };
    return { ok: true, byteSize: total, contentType: ranged.headers.get('content-type') || '' };
  } catch {
    return { ok: false, error: 'blob_fetch_failed' };
  }
}

/** Reads one window. A 200 response that ignores Range is capped so a 55 MB body is not buffered. */
export async function readTrustedBlobRange(url: string, offset: number, length: number): Promise<Buffer> {
  if (!isTrustedAffiliateMediaBlobUrl(url)) throw new Error('untrusted_blob_url');
  if (offset < 0 || length <= 0 || length > MAX_RANGE_BYTES) throw new Error('blob_fetch_failed');
  const res = await fetch(url, {
    headers: { Range: `bytes=${offset}-${offset + length - 1}` },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(BLOB_READ_TIMEOUT_MS),
  });
  if (res.status !== 206 && !(res.status === 200 && offset === 0)) {
    await res.body?.cancel().catch(() => undefined);
    throw new Error('blob_fetch_failed');
  }
  return readBodyCapped(res, length);
}

export async function fetchTrustedAffiliateMediaBlob(
  url: string,
  maxBytes: number,
): Promise<{ ok: true; buffer: Buffer; contentType: string } | { ok: false; error: string }> {
  if (!isTrustedAffiliateMediaBlobUrl(url)) return { ok: false, error: 'untrusted_blob_url' };
  const res = await fetch(url, {
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(BLOB_READ_TIMEOUT_MS),
  });
  if (!res.ok) return { ok: false, error: 'blob_fetch_failed' };
  const len = Number(res.headers.get('content-length') || 0);
  if (len > maxBytes) return { ok: false, error: 'file_too_large' };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) return { ok: false, error: 'file_too_large' };
  return {
    ok: true,
    buffer: buf,
    contentType: res.headers.get('content-type') || '',
  };
}

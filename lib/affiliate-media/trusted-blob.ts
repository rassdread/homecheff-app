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

export async function fetchTrustedAffiliateMediaBlob(
  url: string,
  maxBytes: number,
): Promise<{ ok: true; buffer: Buffer; contentType: string } | { ok: false; error: string }> {
  if (!isTrustedAffiliateMediaBlobUrl(url)) return { ok: false, error: 'untrusted_blob_url' };
  const res = await fetch(url, { redirect: 'error', cache: 'no-store' });
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

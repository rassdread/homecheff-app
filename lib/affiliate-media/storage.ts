import { configuredCredential } from '@/lib/runtime/configured-credential';

function blobToken(): string {
  return (
    configuredCredential(process.env.BLOB_READ_WRITE_TOKEN) ||
    configuredCredential(process.env.VERCEL_BLOB_READ_WRITE_TOKEN)
  );
}

export async function putAffiliateMediaBlob(input: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const token = blobToken();
  if (!token) {
    throw new Error('BLOB_TOKEN_MISSING');
  }
  const { put } = await import('@vercel/blob');
  const blob = await put(input.key, input.buffer, {
    access: 'public',
    token,
    contentType: input.contentType,
    addRandomSuffix: true,
  });
  return { url: blob.url, key: input.key };
}

export async function deleteAffiliateMediaBlob(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith('http')) return;
  const token = blobToken();
  if (!token) return;
  try {
    const { del } = await import('@vercel/blob');
    await del(url, { token });
  } catch {
    /* orphan GC later */
  }
}

export function affiliateMediaObjectKey(assetId: string, kind: 'image' | 'video' | 'poster'): string {
  const ext = kind === 'video' ? 'mp4' : kind === 'poster' ? 'jpg' : 'img';
  return `affiliate-media/${assetId}/${kind}.${ext}`;
}

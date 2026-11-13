/**
 * Private cargo photos. Same private blob token as the receipt vault, but a
 * different key prefix so cargo bytes never land in the financial namespace.
 * No URL is returned to the browser.
 */
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { del, get, put } from '@vercel/blob';
import { configuredCredential } from '@/lib/runtime/configured-credential';

const KEY_PREFIX = 'cargo';

function localPhotoDir(): string | null {
  const dir = process.env.CARGO_PHOTO_LOCAL_DIR?.trim();
  return dir || null;
}

function localPhotoPath(objectKey: string): string {
  return path.join(localPhotoDir() || '', objectKey);
}

export function cargoPhotoToken(): string | null {
  return configuredCredential(process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN) || null;
}

export function newCargoObjectKey(): string {
  return `${KEY_PREFIX}/${randomUUID()}`;
}

export function isCargoObjectKey(key: string): boolean {
  return /^cargo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key);
}

export async function putCargoObject(input: { objectKey: string; body: Buffer; contentType: string }): Promise<void> {
  if (!isCargoObjectKey(input.objectKey)) throw new Error('INVALID_KEY');
  const dir = localPhotoDir();
  if (dir) {
    const file = localPhotoPath(input.objectKey);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, input.body);
    await writeFile(`${file}.type`, input.contentType);
    return;
  }
  const token = cargoPhotoToken();
  if (!token) throw new Error('PRIVATE_STORAGE_UNAVAILABLE');
  if (!isCargoObjectKey(input.objectKey)) throw new Error('INVALID_KEY');
  await put(input.objectKey, input.body, {
    access: 'private',
    token,
    contentType: input.contentType,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 0,
  });
}

export async function readCargoObject(objectKey: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!isCargoObjectKey(objectKey)) return null;
  const dir = localPhotoDir();
  if (dir) {
    try {
      const file = localPhotoPath(objectKey);
      const [body, contentType] = await Promise.all([
        readFile(file),
        readFile(`${file}.type`, 'utf8'),
      ]);
      return {
        stream: new Blob([new Uint8Array(body)]).stream(),
        contentType: contentType.trim() || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
  const token = cargoPhotoToken();
  if (!token) return null;
  try {
    const result = await get(objectKey, { access: 'private', token, useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  } catch {
    return null;
  }
}

export async function deleteCargoObject(objectKey: string): Promise<void> {
  if (!isCargoObjectKey(objectKey)) return;
  const dir = localPhotoDir();
  if (dir) {
    await unlink(localPhotoPath(objectKey)).catch(() => undefined);
    await unlink(`${localPhotoPath(objectKey)}.type`).catch(() => undefined);
    return;
  }
  const token = cargoPhotoToken();
  if (!token) return;
  await del(objectKey, { token });
}

/**
 * Private cargo photos. Same private blob token as the receipt vault, but a
 * different key prefix so cargo bytes never land in the financial namespace.
 * No URL is returned to the browser.
 */
import { randomUUID } from 'crypto';
import { del, get, put } from '@vercel/blob';

const KEY_PREFIX = 'cargo';

export function cargoPhotoToken(): string | null {
  return process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export function newCargoObjectKey(): string {
  return `${KEY_PREFIX}/${randomUUID()}`;
}

export function isCargoObjectKey(key: string): boolean {
  return /^cargo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key);
}

export async function putCargoObject(input: { objectKey: string; body: Buffer; contentType: string }): Promise<void> {
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
  const token = cargoPhotoToken();
  if (!token || !isCargoObjectKey(objectKey)) return null;
  try {
    const result = await get(objectKey, { access: 'private', token, useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  } catch {
    return null;
  }
}

export async function deleteCargoObject(objectKey: string): Promise<void> {
  const token = cargoPhotoToken();
  if (!token || !isCargoObjectKey(objectKey)) return;
  await del(objectKey, { token });
}

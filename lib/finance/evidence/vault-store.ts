/**
 * PHASE 8D — the only module in this codebase allowed to touch the private
 * receipt-vault blob store.
 *
 * Two rules are enforced structurally rather than by convention:
 *
 *  1. Every call passes `access: 'private'` and the vault's own token. The
 *     token is read from `RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN` and nothing
 *     else — never `BLOB_READ_WRITE_TOKEN`, which addresses the public store
 *     that serves profile photos and listing media. A missing vault token is a
 *     hard failure, so a misconfiguration can never silently write a receipt
 *     into public storage.
 *
 *  2. No URL produced here is ever returned to a browser. Private blob URLs
 *     answer 403 without credentials, but handing one out would still be a
 *     permanent identifier for a financial document, so bytes are streamed
 *     through an authenticated route instead.
 */
import { randomUUID } from 'crypto';
import { del, get, head, put } from '@vercel/blob';

/** Namespace inside the dedicated private store. Carries no user information. */
const KEY_PREFIX = 'ev';

export class VaultNotConfiguredError extends Error {
  constructor() {
    super('RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN is not configured');
    this.name = 'VaultNotConfiguredError';
  }
}

export function vaultToken(): string {
  const token = process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new VaultNotConfiguredError();
  return token;
}

export function isVaultConfigured(): boolean {
  return Boolean(process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * An opaque object key.
 *
 * It contains no user id, no expense id, no filename and no extension, so the
 * key on its own reveals nothing about who owns the document or what it is —
 * and a caller cannot influence where bytes land by naming their file.
 */
export function newObjectKey(): string {
  return `${KEY_PREFIX}/${randomUUID()}`;
}

/** True only for keys this module generated, used to bound delete operations. */
export function isVaultObjectKey(key: string): boolean {
  return /^ev\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key);
}

export async function putVaultObject(input: {
  objectKey: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  if (!isVaultObjectKey(input.objectKey)) {
    throw new Error('refusing to write a key this module did not generate');
  }
  await put(input.objectKey, input.body, {
    access: 'private',
    token: vaultToken(),
    contentType: input.contentType,
    addRandomSuffix: false,
    allowOverwrite: false,
    // The CDN sits between the function and the store, not between the store
    // and the browser, but a financial document has no business lingering in
    // it either.
    cacheControlMaxAge: 0,
  });
}

export type VaultObject = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
};

/** Returns null when the object is absent, so callers can record MISSING. */
export async function getVaultObject(objectKey: string): Promise<VaultObject | null> {
  try {
    const result = await get(objectKey, {
      access: 'private',
      token: vaultToken(),
      // Read straight from the store: a receipt that was just replaced or
      // deleted must never be served from an intermediate cache.
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    return {
      stream: result.stream,
      contentType: result.blob.contentType,
      size: result.blob.size,
    };
  } catch {
    return null;
  }
}

export async function vaultObjectExists(objectKey: string): Promise<boolean> {
  try {
    await head(objectKey, { token: vaultToken() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes an object. Idempotent by design: a key that is already gone counts as
 * success, so a retried purge converges instead of looping forever.
 */
export async function deleteVaultObject(objectKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!isVaultObjectKey(objectKey)) {
    // Never hand an unrecognised key to `del` — it could address something in
    // another namespace.
    return { ok: false, error: 'invalid_key' };
  }
  try {
    await del(objectKey, { token: vaultToken() });
    return { ok: true };
  } catch (error) {
    if (!(await vaultObjectExists(objectKey))) return { ok: true };
    return { ok: false, error: error instanceof Error ? error.name : 'unknown' };
  }
}

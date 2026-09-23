/**
 * PHASE 8D — private financial evidence: policy constants and pure helpers.
 *
 * This module is deliberately free of Prisma, Blob and Next imports so the
 * rules below can be asserted directly by fixtures.
 *
 * The one invariant worth stating loudly: attaching evidence is an *evidence*
 * fact, never a *fiscal* fact. Nothing in this file may be read by
 * `resolveDeductible` or by anything else in `lib/finance/seller-expense.ts`.
 * Phase 8C stays the only authority on fiscal treatment.
 */

export const EVIDENCE_SCHEMA_VERSION = '8d.1';

/**
 * A Vercel Function receives at most 4.5 MB of request body. We upload through
 * our own route (rather than handing the browser a storage credential), so the
 * receipt has to fit in that budget with multipart overhead to spare.
 */
export const MAX_EVIDENCE_BYTES = 4 * 1024 * 1024;

/** Empty and near-empty files are never a receipt; they are a failed picker. */
export const MIN_EVIDENCE_BYTES = 64;

/** Enough for a multi-page invoice plus a front/back photo, not a file manager. */
export const MAX_EVIDENCE_PER_EXPENSE = 10;

export const EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
export type EvidenceMimeType = (typeof EVIDENCE_MIME_TYPES)[number];

export const EVIDENCE_KINDS = ['RECEIPT', 'INVOICE', 'OTHER_SUPPORTING_DOCUMENT'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/**
 * Lifecycle. The order matters: a row is created *before* any bytes are sent,
 * so a stored object can never exist without a row pointing at it. That is what
 * makes orphan objects structurally impossible rather than merely unlikely.
 *
 *   UPLOADING      intent recorded; bytes may or may not have landed yet
 *   STORED         bytes confirmed in the private store; owner may read
 *   PENDING_PURGE  no longer readable by anyone; object still needs removing
 *   PURGED         object removed; metadata tombstone kept for auditability
 *   MISSING        row says STORED but the store has no such object
 */
export const EVIDENCE_STATUSES = [
  'UPLOADING',
  'STORED',
  'PENDING_PURGE',
  'PURGED',
  'MISSING',
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

/** The only status whose bytes a request may ever receive. */
export function isReadableStatus(status: EvidenceStatus): boolean {
  return status === 'STORED';
}

/** An `UPLOADING` row older than this never completed and is swept for purge. */
export const UPLOAD_STALE_AFTER_MS = 15 * 60 * 1000;

/** Give up automatic retries after this many failed object deletions. */
export const MAX_PURGE_ATTEMPTS = 10;

/**
 * RETENTION.
 *
 * The Dutch `bewaarplicht` (art. 52 AWR, 7 years) binds the *entrepreneur*, not
 * a platform that happens to hold a convenience copy. HomeCheff is not the
 * seller's administration and does not file their return, so it has no
 * independent legal basis to keep a receipt the seller has asked it to delete —
 * and under AVG art. 5(1)(e) holding it anyway would be storage beyond purpose.
 *
 * Default is therefore immediate purge on user deletion. The delay is kept
 * configurable so a future legal decision can be applied without a schema
 * change; it is a *grace period before the object is destroyed*, never a
 * retention period during which the seller can still read it. Once deletion is
 * requested the bytes are unreadable immediately, whatever this value is.
 *
 * See docs/architecture/RECEIPT-VAULT-RETENTION.md — NEEDS_LEGAL_REVIEW.
 */
export function purgeGraceMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.RECEIPT_VAULT_PURGE_GRACE_HOURS;
  if (!raw) return 0;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0) return 0;
  // A grace period is for recovering from operator error, not for retention.
  return Math.min(hours, 24 * 30) * 60 * 60 * 1000;
}

/**
 * Delivery headers.
 *
 * PDFs are handed over as a download rather than rendered in our origin: a PDF
 * viewer is a scripting host, and no receipt has any business running in a
 * document that shares HomeCheff's origin. Images are inline so an `<img>` can
 * show them, with sniffing disabled and a null-source sandbox so the response
 * cannot become active content whatever the bytes turn out to be.
 */
export function evidenceDisposition(mimeType: string): 'inline' | 'attachment' {
  return mimeType === 'application/pdf' ? 'attachment' : 'inline';
}

export function evidenceDeliveryHeaders(input: {
  mimeType: string;
  downloadFilename: string;
  sizeBytes?: number | null;
}): Record<string, string> {
  const disposition = evidenceDisposition(input.mimeType);
  const headers: Record<string, string> = {
    'Content-Type': input.mimeType,
    'Content-Disposition': `${disposition}; filename="${asciiFilename(input.downloadFilename)}"; filename*=UTF-8''${encodeURIComponent(input.downloadFilename)}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-origin',
    // Financial documents must not sit in a shared cache, and must not survive
    // in the browser's back/forward cache once a different account signs in.
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Vary: 'Cookie',
  };
  if (typeof input.sizeBytes === 'number' && input.sizeBytes > 0) {
    headers['Content-Length'] = String(input.sizeBytes);
  }
  return headers;
}

/** Header value safe for the bare `filename=` parameter of Content-Disposition. */
function asciiFilename(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return ascii.trim() || 'bewijs';
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

/**
 * Display-only filename.
 *
 * The original name never reaches the object key, so this cannot be used to
 * control where bytes land. It is sanitised anyway because it is echoed back
 * into a page and into a Content-Disposition header: directory separators and
 * traversal segments are removed rather than escaped, so `../../etc/passwd`
 * becomes `etc_passwd` and nothing resembling a path survives.
 */
export function sanitizeDisplayFilename(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const withoutPaths = raw
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment !== '..' && segment !== '.' && segment !== '');
  const flattened = withoutPaths.join('_');
  const cleaned = flattened
    // Control characters, and characters that are special to a filesystem or
    // to a Content-Disposition header.
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[.\s]+/, '')
    .replace(/[\s.]+$/, '')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 120);
}

/** Name offered to the browser on download; never the stored key. */
export function downloadFilenameFor(input: {
  originalFilename: string | null;
  mimeType: string;
  evidenceId: string;
}): string {
  const ext = extensionForMime(input.mimeType);
  const original = input.originalFilename?.trim();
  if (original) {
    return original.toLowerCase().endsWith(`.${ext}`) ? original : `${original}.${ext}`;
  }
  return `bewijs-${input.evidenceId.slice(0, 8)}.${ext}`;
}

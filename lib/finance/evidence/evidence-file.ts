/**
 * PHASE 8D — byte-level inspection and normalisation of uploaded evidence.
 *
 * Nothing here trusts the browser. The declared MIME type and the filename
 * extension are treated as hints to be checked, never as facts: the accepted
 * type is decided by the file's own signature and the declared type has to
 * agree with it.
 */
import { createHash } from 'crypto';
import {
  MAX_EVIDENCE_BYTES,
  MIN_EVIDENCE_BYTES,
  type EvidenceMimeType,
} from './evidence-policy';

export type EvidenceRejectionCode =
  | 'EMPTY_FILE'
  | 'FILE_TOO_SMALL'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'DECLARED_TYPE_MISMATCH'
  | 'ACTIVE_CONTENT'
  | 'MALFORMED_FILE';

export type EvidenceInspection =
  | {
      ok: true;
      mimeType: EvidenceMimeType;
      /** Bytes as they will be stored: metadata-stripped for raster images. */
      bytes: Buffer;
      sha256: string;
      sizeBytes: number;
      metadataStripped: boolean;
    }
  | { ok: false; code: EvidenceRejectionCode };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf: Buffer): boolean {
  return buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  );
}

function isPdf(buf: Buffer): boolean {
  // %PDF- must be at offset 0. Readers tolerate a leading junk prefix, which is
  // exactly how a polyglot hides a second file type in front of a valid PDF.
  return buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-';
}

/**
 * Signatures of things a receipt is never allowed to be, checked before type
 * detection so a file that is *both* (a polyglot) is rejected rather than
 * accepted on the strength of its second identity.
 */
const FORBIDDEN_SIGNATURES: ReadonlyArray<{ code: EvidenceRejectionCode; test: (b: Buffer) => boolean }> = [
  { code: 'ACTIVE_CONTENT', test: (b) => b.subarray(0, 2).toString('ascii') === 'MZ' }, // DOS/PE executable
  { code: 'ACTIVE_CONTENT', test: (b) => b.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) }, // ELF
  { code: 'ACTIVE_CONTENT', test: (b) => b.subarray(0, 2).toString('ascii') === '#!' }, // shebang script
  { code: 'UNSUPPORTED_TYPE', test: (b) => b.subarray(0, 2).toString('ascii') === 'PK' }, // zip / office / jar
  { code: 'UNSUPPORTED_TYPE', test: (b) => b.subarray(0, 6).toString('ascii') === 'Rar!\x1a\x07' },
  { code: 'UNSUPPORTED_TYPE', test: (b) => b.subarray(0, 4).toString('ascii') === '\x1f\x8b\x08\x00'.slice(0, 4) },
];

/** Markup that a browser could be talked into executing if sniffing ever failed. */
const MARKUP_MARKERS = ['<svg', '<html', '<!doctype', '<?xml', '<script', '<body', '<iframe'];

/**
 * PDF name tokens that mean "run something on open". Receipts and invoices do
 * not need them; e-invoice attachments (`/EmbeddedFile`, used by ZUGFeRD and
 * Factur-X) are deliberately not in this list because they are legitimate.
 *
 * This is a best-effort scan of the uncompressed byte stream. A PDF can hide
 * these inside an object stream, so a pass here is NOT a clean bill of health —
 * it is one layer under the download-only delivery that does the real work.
 */
const PDF_ACTIVE_TOKENS = ['/JavaScript', '/Launch'];

/**
 * Only the very start of the file is considered.
 *
 * Scanning the whole head for these markers would reject legitimate PDFs, whose
 * XMP metadata packet routinely begins with `<?xml` within the first kilobyte.
 * What matters is what a sniffing parser would decide the file *is*, and that
 * is determined by its opening bytes — which is exactly where a markup-first
 * polyglot has to put its markup for the trick to work.
 */
function looksLikeMarkup(buf: Buffer): boolean {
  const head = buf.subarray(0, 512).toString('latin1').toLowerCase().trimStart();
  return MARKUP_MARKERS.some((marker) => head.startsWith(marker));
}

/**
 * Removes JPEG application and comment segments (EXIF, XMP, Photoshop IRB,
 * free-text comments). APP0/JFIF is kept because it carries the basic density
 * information some decoders expect. Image data is untouched, so what the
 * receipt *shows* is bit-for-bit what was uploaded.
 */
export function stripJpegMetadata(buffer: Buffer): Buffer {
  if (!isJpeg(buffer)) return buffer;
  const parts: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      parts.push(buffer.subarray(offset));
      return Buffer.concat(parts);
    }
    const marker = buffer[offset + 1]!;
    // Start of scan: everything from here on is entropy-coded image data.
    if (marker === 0xda) {
      parts.push(buffer.subarray(offset));
      return Buffer.concat(parts);
    }
    const size = buffer.readUInt16BE(offset + 2);
    if (size < 2) return buffer; // malformed; leave the file alone
    const next = offset + 2 + size;
    if (next > buffer.length) return buffer;
    const isAppSegment = marker >= 0xe1 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!isAppSegment && !isComment) {
      parts.push(buffer.subarray(offset, next));
    }
    offset = next;
  }
  return Buffer.concat(parts);
}

const PNG_METADATA_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

/** Removes PNG textual, EXIF and timestamp chunks; pixel chunks are preserved. */
export function stripPngMetadata(buffer: Buffer): Buffer {
  if (!isPng(buffer)) return buffer;
  const parts: Buffer[] = [buffer.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const next = offset + 12 + length;
    if (next > buffer.length) return buffer; // malformed; leave the file alone
    if (!PNG_METADATA_CHUNKS.has(type)) {
      parts.push(buffer.subarray(offset, next));
    }
    offset = next;
    if (type === 'IEND') break;
  }
  return Buffer.concat(parts);
}

/**
 * Removes WebP EXIF and XMP chunks and clears the matching VP8X feature bits,
 * then rewrites the RIFF length so the container stays internally consistent.
 */
export function stripWebpMetadata(buffer: Buffer): Buffer {
  if (!isWebp(buffer)) return buffer;
  const chunks: Buffer[] = [];
  let offset = 12;
  let removed = false;
  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const padded = size + (size % 2);
    const next = offset + 8 + padded;
    if (next > buffer.length) return buffer; // malformed; leave the file alone
    if (fourCC === 'EXIF' || fourCC === 'XMP ') {
      removed = true;
    } else {
      const chunk = Buffer.from(buffer.subarray(offset, next));
      if (fourCC === 'VP8X' && size >= 1) {
        // Clear the EXIF (0x08) and XMP (0x04) feature flags.
        chunk[8] = chunk[8]! & ~0x0c;
      }
      chunks.push(chunk);
    }
    offset = next;
  }
  if (!removed) return buffer;
  const body = Buffer.concat(chunks);
  const out = Buffer.alloc(12 + body.length);
  out.write('RIFF', 0, 'ascii');
  out.writeUInt32LE(4 + body.length, 4);
  out.write('WEBP', 8, 'ascii');
  body.copy(out, 12);
  return out;
}

function detectMime(buf: Buffer): EvidenceMimeType | null {
  if (isJpeg(buf)) return 'image/jpeg';
  if (isPng(buf)) return 'image/png';
  if (isWebp(buf)) return 'image/webp';
  if (isPdf(buf)) return 'application/pdf';
  return null;
}

/** Declared types the browser may plausibly send for each detected type. */
const DECLARED_ALIASES: Record<EvidenceMimeType, ReadonlySet<string>> = {
  'image/jpeg': new Set(['image/jpeg', 'image/jpg', 'image/pjpeg']),
  'image/png': new Set(['image/png', 'image/x-png']),
  'image/webp': new Set(['image/webp']),
  'application/pdf': new Set(['application/pdf', 'application/x-pdf']),
};

/**
 * Decides whether a buffer may be stored, and returns the exact bytes to store.
 *
 * `declaredMimeType` is compared against the detected type so a file renamed to
 * `.jpg` is rejected rather than silently reclassified. An empty or absent
 * declaration is tolerated — some mobile pickers send nothing — because the
 * signature is what actually decides.
 */
export function inspectEvidenceFile(input: {
  buffer: Buffer;
  declaredMimeType?: string | null;
}): EvidenceInspection {
  const { buffer } = input;

  if (buffer.length === 0) return { ok: false, code: 'EMPTY_FILE' };
  if (buffer.length < MIN_EVIDENCE_BYTES) return { ok: false, code: 'FILE_TOO_SMALL' };
  if (buffer.length > MAX_EVIDENCE_BYTES) return { ok: false, code: 'FILE_TOO_LARGE' };

  for (const { code, test } of FORBIDDEN_SIGNATURES) {
    if (test(buffer)) return { ok: false, code };
  }
  if (looksLikeMarkup(buffer)) return { ok: false, code: 'ACTIVE_CONTENT' };

  const mimeType = detectMime(buffer);
  if (!mimeType) return { ok: false, code: 'UNSUPPORTED_TYPE' };

  const declared = input.declaredMimeType?.trim().toLowerCase().split(';')[0];
  if (declared && declared !== 'application/octet-stream' && !DECLARED_ALIASES[mimeType].has(declared)) {
    return { ok: false, code: 'DECLARED_TYPE_MISMATCH' };
  }

  if (mimeType === 'application/pdf') {
    const text = buffer.toString('latin1');
    if (PDF_ACTIVE_TOKENS.some((token) => text.includes(token))) {
      return { ok: false, code: 'ACTIVE_CONTENT' };
    }
    if (!text.includes('%%EOF')) return { ok: false, code: 'MALFORMED_FILE' };
  }

  let bytes = buffer;
  if (mimeType === 'image/jpeg') bytes = stripJpegMetadata(buffer);
  else if (mimeType === 'image/png') bytes = stripPngMetadata(buffer);
  else if (mimeType === 'image/webp') bytes = stripWebpMetadata(buffer);

  // Stripping must never destroy the file it was meant to protect.
  if (detectMime(bytes) !== mimeType || bytes.length < MIN_EVIDENCE_BYTES) {
    bytes = buffer;
  }

  return {
    ok: true,
    mimeType,
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
    metadataStripped: mimeType !== 'application/pdf' && bytes.length !== buffer.length,
  };
}

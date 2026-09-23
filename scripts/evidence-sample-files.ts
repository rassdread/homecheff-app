/**
 * PHASE 8D — synthetic files for the evidence fixtures.
 *
 * Everything here is generated. No real receipt, no real merchant, no real
 * amount and no real personal data is ever used in a test or in production
 * certification.
 *
 * The raster samples deliberately carry metadata (EXIF, XMP, textual chunks,
 * GPS-shaped bytes) so the stripping tests have something real to remove.
 */
import { PNG } from 'pngjs';
import zlib from 'zlib';

/** Marker written into metadata so a stripping test can prove it is gone. */
export const METADATA_CANARY = 'HC8D-METADATA-CANARY';

// ---------------------------------------------------------------- JPEG ----

/** A 1x1 baseline JPEG, used as the carrier for the metadata tests. */
const BASE_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAHwAAAQUBAQEB' +
  'AQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh' +
  'ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZ' +
  'WmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG' +
  'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiigD//Z';

function jpegSegment(marker: number, payload: Buffer): Buffer {
  const header = Buffer.alloc(4);
  header[0] = 0xff;
  header[1] = marker;
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
}

/**
 * A JPEG carrying an EXIF APP1 block (with a GPS-shaped payload and the
 * canary), an XMP APP1 block and a free-text comment.
 */
export function makeJpegWithMetadata(): Buffer {
  const base = Buffer.from(BASE_JPEG_B64, 'base64');

  const exifPayload = Buffer.concat([
    Buffer.from('Exif\0\0', 'latin1'),
    Buffer.from('MM\0*\0\0\0\b', 'latin1'), // TIFF header, big-endian
    Buffer.from(`GPSLatitude=52.3676;GPSLongitude=4.9041;Make=${METADATA_CANARY}`, 'latin1'),
    Buffer.alloc(256, 0x20),
  ]);
  const xmpPayload = Buffer.concat([
    Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'),
    Buffer.from(`<x:xmpmeta><hc>${METADATA_CANARY}</hc></x:xmpmeta>`, 'latin1'),
  ]);
  const comment = Buffer.from(`comment ${METADATA_CANARY}`, 'latin1');

  // Segments go immediately after SOI so they precede the JFIF APP0.
  return Buffer.concat([
    base.subarray(0, 2),
    jpegSegment(0xe1, exifPayload),
    jpegSegment(0xe1, xmpPayload),
    jpegSegment(0xfe, comment),
    base.subarray(2),
  ]);
}

// ----------------------------------------------------------------- PNG ----

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * A 48x48 PNG carrying tEXt, iTXt and eXIf chunks.
 *
 * `seed` changes the pixels, so callers can produce genuinely distinct images
 * rather than accidental duplicates of one another.
 */
export function makePngWithMetadata(seed = 0): Buffer {
  const png = new PNG({ width: 48, height: 48 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = (i / 4 + seed * 37) % 256;
    png.data[i + 1] = (200 + seed * 11) % 256;
    png.data[i + 2] = 120;
    png.data[i + 3] = 255;
  }
  const base = PNG.sync.write(png);

  const text = pngChunk('tEXt', Buffer.from(`Comment\0${METADATA_CANARY}`, 'latin1'));
  const itxt = pngChunk('iTXt', Buffer.from(`Software\0\0\0\0\0${METADATA_CANARY}`, 'latin1'));
  const exif = pngChunk(
    'eXIf',
    Buffer.concat([
      Buffer.from('MM\0*\0\0\0\b', 'latin1'),
      Buffer.from(`GPS ${METADATA_CANARY}`, 'latin1'),
    ]),
  );

  // Insert after IHDR (8-byte signature + 25-byte IHDR chunk).
  const head = base.subarray(0, 33);
  const tail = base.subarray(33);
  return Buffer.concat([head, text, itxt, exif, tail]);
}

// ---------------------------------------------------------------- WebP ----

/** A minimal simple-format 1x1 lossy WebP; its VP8 chunk is reused below. */
const BASE_WEBP_B64 = 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

function riffChunk(fourCC: string, data: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.write(fourCC, 0, 'ascii');
  header.writeUInt32LE(data.length, 4);
  const pad = data.length % 2 === 1 ? Buffer.alloc(1) : Buffer.alloc(0);
  return Buffer.concat([header, data, pad]);
}

/**
 * An extended-format WebP with ICCP, EXIF and XMP chunks.
 *
 * ICCP is included on purpose: stripping must remove EXIF and XMP and leave
 * the colour profile and the image data alone.
 */
export function makeWebpWithMetadata(): Buffer {
  const base = Buffer.from(BASE_WEBP_B64, 'base64');
  const vp8Size = base.readUInt32LE(16);
  const vp8 = base.subarray(12, 12 + 8 + vp8Size + (vp8Size % 2));

  const vp8xPayload = Buffer.alloc(10);
  vp8xPayload[0] = 0x2c; // ICC (0x20) | EXIF (0x08) | XMP (0x04)
  vp8xPayload.writeUIntLE(0, 4, 3); // canvas width - 1
  vp8xPayload.writeUIntLE(0, 7, 3); // canvas height - 1

  const iccp = riffChunk('ICCP', Buffer.alloc(200, 0x01));
  const exif = riffChunk(
    'EXIF',
    Buffer.concat([
      Buffer.from('MM\0*\0\0\0\b', 'latin1'),
      Buffer.from(`GPS ${METADATA_CANARY}`, 'latin1'),
      Buffer.alloc(120, 0x20),
    ]),
  );
  const xmp = riffChunk('XMP ', Buffer.from(`<x:xmpmeta>${METADATA_CANARY}</x:xmpmeta>`, 'latin1'));

  const body = Buffer.concat([riffChunk('VP8X', vp8xPayload), iccp, vp8, exif, xmp]);
  const out = Buffer.alloc(12 + body.length);
  out.write('RIFF', 0, 'ascii');
  out.writeUInt32LE(4 + body.length, 4);
  out.write('WEBP', 8, 'ascii');
  body.copy(out, 12);
  return out;
}

// ----------------------------------------------------------------- PDF ----

function buildPdf(extraCatalogEntries = '', extraObjects = ''): Buffer {
  const content = `BT /F1 12 Tf 60 700 Td (SYNTHETIC TEST DOCUMENT - NO REAL DATA) Tj ET`;
  const body =
    `%PDF-1.4\n` +
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R${extraCatalogEntries} >>\nendobj\n` +
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n` +
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n` +
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n` +
    extraObjects +
    `trailer\n<< /Size 6 /Root 1 0 R >>\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

export function makePdf(): Buffer {
  return buildPdf();
}

/** A PDF that runs script on open; must be refused. */
export function makePdfWithJavaScript(): Buffer {
  return buildPdf(
    ' /OpenAction 6 0 R',
    `6 0 obj\n<< /S /JavaScript /JS (app.alert('x');) >>\nendobj\n`,
  );
}

/** A PDF without the trailing marker; must be refused as malformed. */
export function makeTruncatedPdf(): Buffer {
  const full = makePdf();
  return full.subarray(0, full.length - 40);
}

// ------------------------------------------------------- rejected types ----

export function makeHtml(): Buffer {
  return Buffer.from(
    `<!doctype html><html><body><script>alert(1)</script>${'<!-- pad -->'.repeat(20)}</body></html>`,
    'utf8',
  );
}

export function makeSvg(): Buffer {
  return Buffer.from(
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">` +
      `<script>alert(1)</script><rect width="100" height="100"/>${'<!-- pad -->'.repeat(20)}</svg>`,
    'utf8',
  );
}

export function makeZip(): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    zlib.gzipSync(Buffer.from('not a receipt')),
    Buffer.alloc(64, 0),
  ]);
}

export function makeExecutable(): Buffer {
  return Buffer.concat([Buffer.from('MZ', 'latin1'), Buffer.alloc(200, 0x90)]);
}

/** Valid JPEG bytes followed by enough padding to exceed the size limit. */
export function makeOversizeJpeg(totalBytes: number): Buffer {
  const base = makeJpegWithMetadata();
  return Buffer.concat([base, Buffer.alloc(Math.max(0, totalBytes - base.length), 0x00)]);
}

/**
 * A polyglot: HTML first, a JPEG signature later. Type detection must not be
 * fooled into accepting it because a valid signature appears somewhere.
 */
export function makeHtmlJpegPolyglot(): Buffer {
  return Buffer.concat([
    Buffer.from('<html><script>alert(1)</script>', 'utf8'),
    makeJpegWithMetadata(),
  ]);
}

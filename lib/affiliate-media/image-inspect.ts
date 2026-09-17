export type ImageKind = 'jpeg' | 'png' | 'webp';

export type ImageInspectResult =
  | { ok: true; kind: ImageKind; mime: string; width: number | null; height: number | null }
  | { ok: false; error: string };

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  );
}

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  );
}

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1]!;
    const size = buf.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + size;
  }
  return null;
}

function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Strip JPEG APP1 (EXIF/XMP) for privacy. Other image types returned unchanged. */
export function stripJpegExif(buffer: Buffer): Buffer {
  if (!isJpeg(buffer)) return buffer;
  const parts: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      parts.push(buffer.subarray(offset));
      break;
    }
    const marker = buffer[offset + 1]!;
    if (marker === 0xda) {
      parts.push(buffer.subarray(offset));
      break;
    }
    const size = buffer.readUInt16BE(offset + 2);
    const next = offset + 2 + size;
    if (marker !== 0xe1) {
      parts.push(buffer.subarray(offset, next));
    }
    offset = next;
  }
  return Buffer.concat(parts);
}

export function inspectImage(buffer: Buffer): ImageInspectResult {
  if (buffer.length < 12) return { ok: false, error: 'image_too_small' };
  const head = buffer.subarray(0, 256).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<html') || head.includes('%pdf')) {
    return { ok: false, error: 'forbidden_type' };
  }
  if (isJpeg(buffer)) {
    const dim = jpegSize(buffer);
    return { ok: true, kind: 'jpeg', mime: 'image/jpeg', width: dim?.width ?? null, height: dim?.height ?? null };
  }
  if (isPng(buffer)) {
    const dim = pngSize(buffer);
    return { ok: true, kind: 'png', mime: 'image/png', width: dim?.width ?? null, height: dim?.height ?? null };
  }
  if (isWebp(buffer)) {
    return { ok: true, kind: 'webp', mime: 'image/webp', width: null, height: null };
  }
  return { ok: false, error: 'unsupported_image_type' };
}

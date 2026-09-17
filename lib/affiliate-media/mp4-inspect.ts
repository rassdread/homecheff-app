function readU32(buf: Buffer, offset: number): number {
  if (offset + 4 > buf.length) return 0;
  return buf.readUInt32BE(offset);
}

function readU64(buf: Buffer, offset: number): bigint {
  if (offset + 8 > buf.length) return 0n;
  return buf.readBigUInt64BE(offset);
}

function fourcc(buf: Buffer, offset: number): string {
  if (offset + 4 > buf.length) return '';
  return buf.subarray(offset, offset + 4).toString('ascii');
}

type Box = { type: string; start: number; end: number; headerSize: number };

function readBox(buf: Buffer, offset: number): Box | null {
  if (offset + 8 > buf.length) return null;
  let size = readU32(buf, offset);
  const type = fourcc(buf, offset + 4);
  let headerSize = 8;
  if (size === 1) {
    if (offset + 16 > buf.length) return null;
    const large = readU64(buf, offset + 8);
    if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    size = Number(large);
    headerSize = 16;
  }
  if (size < headerSize) return null;
  const end = Math.min(offset + size, buf.length);
  return { type, start: offset, end, headerSize };
}

function walkBoxes(buf: Buffer, start: number, end: number, visit: (box: Box) => void): void {
  let offset = start;
  while (offset + 8 <= end) {
    const box = readBox(buf, offset);
    if (!box || box.end <= offset) break;
    visit(box);
    offset = box.end;
  }
}

function containsCodec(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

const HEVC_OR_UNSUPPORTED = ['hvc1', 'hev1', 'hvcc', 'av01', 'av1c', 'vp09', 'vp08', 'vp9'];
const H264_HINTS = ['avc1', 'avc3', 'avcc'];
const FTYP_OK = ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'm4v', 'dash', 'mp4'];

export type Mp4InspectResult =
  | {
      ok: true;
      durationMs: number | null;
      hasH264Hint: boolean;
      brands: string;
    }
  | { ok: false; error: string };

/**
 * LIMITED_VIDEO_V1: ISO-BMFF (MP4) container only.
 * Rejects HEVC/AV1/VP9 brands when present; requires ftyp + parseable boxes.
 */
export function inspectMp4(buffer: Buffer): Mp4InspectResult {
  if (buffer.length < 16) return { ok: false, error: 'video_too_small' };
  const first = readBox(buffer, 0);
  if (!first || first.type !== 'ftyp') return { ok: false, error: 'not_mp4_ftyp' };

  const brands = buffer.subarray(first.start + 8, first.end).toString('ascii');
  if (containsCodec(brands, HEVC_OR_UNSUPPORTED)) return { ok: false, error: 'unsupported_video_codec' };
  if (!containsCodec(brands, FTYP_OK)) {
    return { ok: false, error: 'unsupported_mp4_brand' };
  }

  const asciiScan = buffer.subarray(0, Math.min(buffer.length, 2_000_000)).toString('latin1');
  if (containsCodec(asciiScan, HEVC_OR_UNSUPPORTED)) return { ok: false, error: 'unsupported_video_codec' };

  let durationMs: number | null = null;
  const visit = (box: Box) => {
    if (box.type === 'moov') {
      walkBoxes(buffer, box.start + box.headerSize, box.end, visit);
      return;
    }
    if (box.type !== 'mvhd' || durationMs != null) return;
    const body = box.start + box.headerSize;
    if (body + 1 >= buffer.length) return;
    const version = buffer[body] ?? 0;
    if (version === 1) {
      const timescale = readU32(buffer, body + 4 + 16);
      const duration = readU64(buffer, body + 4 + 16 + 4);
      if (timescale > 0) durationMs = Number((duration * 1000n) / BigInt(timescale));
    } else {
      const timescale = readU32(buffer, body + 4 + 8);
      const duration = readU32(buffer, body + 4 + 8 + 4);
      if (timescale > 0) durationMs = Math.round((duration * 1000) / timescale);
    }
  };
  walkBoxes(buffer, 0, buffer.length, visit);

  return {
    ok: true,
    durationMs,
    hasH264Hint: containsCodec(asciiScan, H264_HINTS) || containsCodec(brands, H264_HINTS),
    brands: brands.replace(/[^\w ]/g, ' ').trim(),
  };
}

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
function ftypVerdict(buffer: Buffer): { ok: true; brands: string } | { ok: false; error: string } {
  if (buffer.length < 16) return { ok: false, error: 'video_too_small' };
  const first = readBox(buffer, 0);
  if (!first || first.type !== 'ftyp') return { ok: false, error: 'not_mp4_ftyp' };
  const brands = buffer.subarray(first.start + 8, first.end).toString('ascii');
  if (containsCodec(brands, HEVC_OR_UNSUPPORTED)) return { ok: false, error: 'unsupported_video_codec' };
  if (!containsCodec(brands, FTYP_OK)) return { ok: false, error: 'unsupported_mp4_brand' };
  return { ok: true, brands };
}

function durationFromMvhd(buffer: Buffer, body: number): number | null {
  if (body >= buffer.length) return null;
  const version = buffer[body] ?? 0;
  if (version === 1) {
    const timescale = readU32(buffer, body + 4 + 16);
    const duration = readU64(buffer, body + 4 + 16 + 4);
    if (timescale > 0) return Number((duration * 1000n) / BigInt(timescale));
    return null;
  }
  const timescale = readU32(buffer, body + 4 + 8);
  const duration = readU32(buffer, body + 4 + 8 + 4);
  if (timescale > 0) return Math.round((duration * 1000) / timescale);
  return null;
}

function durationInside(buffer: Buffer, start: number, end: number): number | null {
  let durationMs: number | null = null;
  const visit = (box: Box) => {
    if (box.type === 'moov') {
      const nested = durationInside(buffer, box.start + box.headerSize, box.end);
      if (nested != null) durationMs = nested;
      return;
    }
    if (box.type !== 'mvhd' || durationMs != null) return;
    const parsed = durationFromMvhd(buffer, box.start + box.headerSize);
    if (parsed != null) durationMs = parsed;
  };
  walkBoxes(buffer, start, end, visit);
  return durationMs;
}

export function inspectMp4(buffer: Buffer): Mp4InspectResult {
  const ftyp = ftypVerdict(buffer);
  if (!ftyp.ok) return ftyp;

  const asciiScan = buffer.subarray(0, Math.min(buffer.length, 2_000_000)).toString('latin1');
  if (containsCodec(asciiScan, HEVC_OR_UNSUPPORTED)) return { ok: false, error: 'unsupported_video_codec' };

  return {
    ok: true,
    durationMs: durationInside(buffer, 0, buffer.length),
    hasH264Hint: containsCodec(asciiScan, H264_HINTS) || containsCodec(ftyp.brands, H264_HINTS),
    brands: ftyp.brands.replace(/[^\w ]/g, ' ').trim(),
  };
}

export type Mp4ByteSource = {
  length: number;
  read: (offset: number, length: number) => Promise<Buffer>;
};

const REMOTE_HEAD_BYTES = 2_000_000;
const REMOTE_MOOV_MAX_BYTES = 8 * 1024 * 1024;

function parseBoxHeader(header: Buffer, fileOffset: number, fileSize: number): Box | null {
  if (header.length < 8) return null;
  let size = readU32(header, 0);
  const type = fourcc(header, 4);
  let headerSize = 8;
  if (size === 1) {
    if (header.length < 16) return null;
    const large = readU64(header, 8);
    if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    size = Number(large);
    headerSize = 16;
  } else if (size === 0) {
    size = fileSize - fileOffset;
  }
  if (size < headerSize) return null;
  const end = Math.min(fileOffset + size, fileSize);
  if (end <= fileOffset) return null;
  return { type, start: fileOffset, end, headerSize };
}

/**
 * Same MP4 rules as inspectMp4, but only reads box headers plus ftyp/moov.
 * A large mdat payload is skipped so a 55 MB promo video is not buffered
 * inside the serverless function.
 */
export async function inspectMp4Source(source: Mp4ByteSource): Promise<Mp4InspectResult> {
  if (source.length < 16) return { ok: false, error: 'video_too_small' };
  const headLen = Math.min(source.length, REMOTE_HEAD_BYTES);
  const head = await source.read(0, headLen);
  const ftyp = ftypVerdict(head);
  if (!ftyp.ok) return ftyp;

  const readWindow = async (offset: number, length: number): Promise<Buffer> => {
    if (offset < 0 || length <= 0) throw new Error('blob_fetch_failed');
    if (offset + length <= head.length) return head.subarray(offset, offset + length);
    return source.read(offset, length);
  };

  let offset = 0;
  let moov: Buffer | null = null;
  for (let guard = 0; guard < 64 && offset + 8 <= source.length; guard += 1) {
    const headerLen = Math.min(16, source.length - offset);
    const header = await readWindow(offset, headerLen);
    const box = parseBoxHeader(header, offset, source.length);
    if (!box) break;
    if (box.type === 'moov') {
      const moovLen = box.end - box.start;
      if (moovLen > REMOTE_MOOV_MAX_BYTES) return { ok: false, error: 'video_duration_unknown' };
      moov = await readWindow(box.start, moovLen);
      break;
    }
    offset = box.end;
  }

  if (moov && containsCodec(moov.toString('latin1'), HEVC_OR_UNSUPPORTED)) {
    return { ok: false, error: 'unsupported_video_codec' };
  }

  const moovHeader = moov ? readBox(moov, 0) : null;
  const durationMs =
    moov && moovHeader ? durationInside(moov, moovHeader.headerSize, moov.length) : null;
  const moovText = moov ? moov.toString('latin1') : '';
  return {
    ok: true,
    durationMs,
    hasH264Hint: containsCodec(moovText, H264_HINTS) || containsCodec(ftyp.brands, H264_HINTS),
    brands: ftyp.brands.replace(/[^\w ]/g, ' ').trim(),
  };
}

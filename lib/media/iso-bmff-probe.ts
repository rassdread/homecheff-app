/**
 * Read duration and elementary-stream types from an ISO BMFF file (MP4/MOV).
 * This looks at container boxes only. It does not decode pictures or trust a filename.
 */

export type IsoBmffProbe =
  | {
      ok: true;
      durationSeconds: number;
      videoCodec: string | null;
      audioCodec: string | null;
      width: number | null;
      height: number | null;
    }
  | { ok: false; reason: "malformed" | "unsupported" | "unknown_duration" };

const MAX_BOXES = 8000;

export function probeIsoBmff(bytes: Uint8Array): IsoBmffProbe {
  if (bytes.byteLength < 16) return { ok: false, reason: "malformed" };
  const moov = findChild(bytes, 0, bytes.byteLength, "moov");
  if (!moov) return { ok: false, reason: "unsupported" };
  const mvhd = findChild(bytes, moov.start, moov.end, "mvhd");
  if (!mvhd) return { ok: false, reason: "malformed" };
  const movie = readDuration(bytes, mvhd.start, mvhd.end);
  if (!movie) return { ok: false, reason: "malformed" };

  let duration = movie.seconds;
  let videoCodec: string | null = null;
  let audioCodec: string | null = null;
  let width: number | null = null;
  let height: number | null = null;
  const timescales = new Map<number, number>();

  let offset = moov.start;
  let boxes = 0;
  while (offset + 8 <= moov.end && boxes < MAX_BOXES) {
    const box = readBox(bytes, offset, moov.end);
    if (!box) return { ok: false, reason: "malformed" };
    boxes += 1;
    if (box.type === "trak") {
      const track = readTrack(bytes, box.start, box.end);
      if (track.durationSeconds && track.durationSeconds > duration) {
        duration = track.durationSeconds;
      }
      if (track.id && track.timescale) timescales.set(track.id, track.timescale);
      if (track.handler === "vide") {
        videoCodec = track.codec;
        width = track.width;
        height = track.height;
      } else if (track.handler === "soun") {
        audioCodec = track.codec;
      }
    }
    offset = box.end;
  }

  const fragmented = fragmentDurationSeconds(bytes, timescales);
  if (fragmented > duration) duration = fragmented;

  if (!Number.isFinite(duration) || duration <= 0) {
    return { ok: false, reason: "unknown_duration" };
  }
  return { ok: true, durationSeconds: duration, videoCodec, audioCodec, width, height };
}

type Box = { type: string; start: number; end: number };

function readBox(bytes: Uint8Array, offset: number, limit: number): Box | null {
  if (offset + 8 > limit) return null;
  const size32 = readU32(bytes, offset);
  const type = ascii(bytes, offset + 4, 4);
  let header = 8;
  let size = size32;
  if (size32 === 1) {
    if (offset + 16 > limit) return null;
    size = readU64(bytes, offset + 8);
    header = 16;
  } else if (size32 === 0) {
    size = limit - offset;
  }
  if (size < header || offset + size > limit) return null;
  return { type, start: offset + header, end: offset + size };
}

function findChild(bytes: Uint8Array, start: number, end: number, type: string): Box | null {
  let offset = start;
  let boxes = 0;
  while (offset + 8 <= end && boxes < MAX_BOXES) {
    const box = readBox(bytes, offset, end);
    if (!box) return null;
    boxes += 1;
    if (box.type === type) return box;
    offset = box.end;
  }
  return null;
}

function readMediaHeader(
  bytes: Uint8Array,
  start: number,
  end: number,
): { seconds: number; timescale: number } | null {
  if (start + 4 > end) return null;
  const version = bytes[start];
  if (version === 0) {
    if (start + 20 > end) return null;
    const timescale = readU32(bytes, start + 12);
    const duration = readU32(bytes, start + 16);
    if (timescale === 0) return null;
    return { seconds: duration / timescale, timescale };
  }
  if (version === 1) {
    if (start + 32 > end) return null;
    const timescale = readU32(bytes, start + 20);
    const duration = readU64(bytes, start + 24);
    if (timescale === 0) return null;
    return { seconds: duration / timescale, timescale };
  }
  return null;
}

function readDuration(
  bytes: Uint8Array,
  start: number,
  end: number,
): { seconds: number } | null {
  const header = readMediaHeader(bytes, start, end);
  return header ? { seconds: header.seconds } : null;
}

function readTrack(bytes: Uint8Array, start: number, end: number): {
  id: number | null;
  timescale: number | null;
  handler: string | null;
  codec: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
} {
  const mdia = findChild(bytes, start, end, "mdia");
  const hdlr = mdia ? findChild(bytes, mdia.start, mdia.end, "hdlr") : null;
  let handler: string | null = null;
  if (hdlr && hdlr.start + 12 <= hdlr.end) {
    handler = ascii(bytes, hdlr.start + 8, 4);
  }
  const mdhd = mdia ? findChild(bytes, mdia.start, mdia.end, "mdhd") : null;
  const header = mdhd ? readMediaHeader(bytes, mdhd.start, mdhd.end) : null;
  const duration = header ? { seconds: header.seconds } : null;
  const minf = mdia ? findChild(bytes, mdia.start, mdia.end, "minf") : null;
  const stbl = minf ? findChild(bytes, minf.start, minf.end, "stbl") : null;
  const stts = stbl ? findChild(bytes, stbl.start, stbl.end, "stts") : null;
  const sampleSeconds =
    stts && header ? readSampleDuration(bytes, stts.start, stts.end, header.timescale) : null;
  const stsd = stbl ? findChild(bytes, stbl.start, stbl.end, "stsd") : null;
  let codec: string | null = null;
  if (stsd && stsd.start + 16 <= stsd.end) {
    codec = ascii(bytes, stsd.start + 12, 4);
  }
  const tkhd = findChild(bytes, start, end, "tkhd");
  const visual = tkhd ? readTkhdSize(bytes, tkhd.start, tkhd.end) : null;
  const id = tkhd ? readTrackId(bytes, tkhd.start, tkhd.end) : null;
  return {
    id,
    timescale: header?.timescale ?? null,
    handler,
    codec,
    durationSeconds: Math.max(duration?.seconds ?? 0, sampleSeconds ?? 0) || null,
    width: handler === "vide" ? visual?.width ?? null : null,
    height: handler === "vide" ? visual?.height ?? null : null,
  };
}

function readTrackId(bytes: Uint8Array, start: number, end: number): number | null {
  if (start >= end) return null;
  const offset = bytes[start] === 1 ? 20 : 12;
  if (start + offset + 4 > end) return null;
  const id = readU32(bytes, start + offset);
  return id > 0 ? id : null;
}

function fragmentDurationSeconds(bytes: Uint8Array, timescales: Map<number, number>): number {
  const ends = new Map<number, number>();
  let offset = 0;
  let boxes = 0;
  while (offset + 8 <= bytes.byteLength && boxes < MAX_BOXES) {
    const box = readBox(bytes, offset, bytes.byteLength);
    if (!box) break;
    boxes += 1;
    if (box.type === "moof") {
      let child = box.start;
      while (child + 8 <= box.end) {
        const traf = readBox(bytes, child, box.end);
        if (!traf) break;
        if (traf.type === "traf") noteFragment(bytes, traf.start, traf.end, ends);
        child = traf.end;
      }
    }
    offset = box.end;
  }
  let longest = 0;
  for (const [trackId, ticks] of ends) {
    const timescale = timescales.get(trackId);
    if (!timescale) continue;
    longest = Math.max(longest, ticks / timescale);
  }
  return longest;
}

function noteFragment(
  bytes: Uint8Array,
  start: number,
  end: number,
  ends: Map<number, number>,
): void {
  let trackId = 0;
  let defaultDuration = 0;
  let base = 0;
  let samples = 0;
  let offset = start;
  while (offset + 8 <= end) {
    const box = readBox(bytes, offset, end);
    if (!box) return;
    if (box.type === "tfhd" && box.start + 8 <= box.end) {
      const flags = readU32(bytes, box.start) & 0xffffff;
      let pos = box.start + 4;
      trackId = readU32(bytes, pos);
      pos += 4;
      if (flags & 0x1) pos += 8;
      if (flags & 0x2) pos += 4;
      if ((flags & 0x8) && pos + 4 <= box.end) defaultDuration = readU32(bytes, pos);
    } else if (box.type === "tfdt" && box.start + 8 <= box.end) {
      base = bytes[box.start] === 1 ? readU64(bytes, box.start + 4) : readU32(bytes, box.start + 4);
    } else if (box.type === "trun") {
      samples += readTrunTicks(bytes, box.start, box.end, defaultDuration);
    }
    offset = box.end;
  }
  if (trackId > 0) {
    ends.set(trackId, Math.max(ends.get(trackId) ?? 0, base + samples));
  }
}

function readTrunTicks(
  bytes: Uint8Array,
  start: number,
  end: number,
  defaultDuration: number,
): number {
  if (start + 8 > end) return 0;
  const flags = readU32(bytes, start) & 0xffffff;
  const count = readU32(bytes, start + 4);
  if (count > 200_000) return 0;
  let pos = start + 8;
  if (flags & 0x1) pos += 4;
  if (flags & 0x4) pos += 4;
  if ((flags & 0x100) === 0) return count * defaultDuration;
  let ticks = 0;
  const step = 4 + ((flags & 0x200) ? 4 : 0) + ((flags & 0x400) ? 4 : 0) + ((flags & 0x800) ? 4 : 0);
  for (let i = 0; i < count; i += 1) {
    if (pos + 4 > end) return ticks;
    ticks += readU32(bytes, pos);
    pos += step;
  }
  return ticks;
}

function readSampleDuration(
  bytes: Uint8Array,
  start: number,
  end: number,
  timescale: number,
): number | null {
  if (timescale <= 0 || start + 8 > end) return null;
  const count = readU32(bytes, start + 4);
  if (count > 200_000) return null;
  let ticks = 0;
  let offset = start + 8;
  for (let i = 0; i < count; i += 1) {
    if (offset + 8 > end) return null;
    ticks += readU32(bytes, offset) * readU32(bytes, offset + 4);
    offset += 8;
  }
  return ticks > 0 ? ticks / timescale : null;
}

function readTkhdSize(
  bytes: Uint8Array,
  start: number,
  end: number,
): { width: number; height: number } | null {
  if (start >= end) return null;
  const version = bytes[start];
  const widthOffset = version === 1 ? 88 : 76;
  if (start + widthOffset + 8 > end) return null;
  const width = readU32(bytes, start + widthOffset) / 65536;
  const height = readU32(bytes, start + widthOffset + 4) / 65536;
  if (width <= 0 || height <= 0) return null;
  return { width: Math.round(width), height: Math.round(height) };
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    bytes[offset + 1] * 0x10000 +
    bytes[offset + 2] * 0x100 +
    bytes[offset + 3]
  );
}

function readU64(bytes: Uint8Array, offset: number): number {
  const hi = readU32(bytes, offset);
  const lo = readU32(bytes, offset + 4);
  return hi * 0x100000000 + lo;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += String.fromCharCode(bytes[offset + i] ?? 0);
  return out;
}

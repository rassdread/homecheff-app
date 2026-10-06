/**
 * Local dry-run only. Downloads copies into the OS temp directory, encodes them there,
 * and deletes them. Does not upload blobs or update the database.
 */
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

async function probe(file) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=size,duration:stream=codec_name,codec_type,width,height", "-of", "json", file],
    { timeout: 30_000, maxBuffer: 1_000_000 },
  );
  const parsed = JSON.parse(stdout);
  const video = (parsed.streams || []).find((stream) => stream.codec_type === "video");
  const audio = (parsed.streams || []).find((stream) => stream.codec_type === "audio");
  return {
    size: Number(parsed.format?.size || 0),
    duration: Number(parsed.format?.duration || 0),
    codec: video?.codec_name || "unknown",
    audio: audio?.codec_name || null,
    width: video?.width || 0,
    height: video?.height || 0,
  };
}

async function encode(input, output, crf) {
  const started = Date.now();
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vf",
      "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      String(crf),
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      output,
    ],
    { timeout: 180_000, maxBuffer: 2_000_000 },
  );
  return Date.now() - started;
}

function recommend(before, after) {
  const compatible = before.codec === "h264";
  const reduction = before.size > 0 ? (before.size - after.size) / before.size : 0;
  if (after.size <= 0) return "FAILED_PROCESSING";
  if (!compatible) return "MIGRATE_COMPATIBILITY";
  if (reduction >= 0.15) return "MIGRATE_SIZE";
  return "KEEP_ORIGINAL";
}

async function synthetic(dir, label, size, seconds) {
  const output = join(dir, `${label}.mp4`);
  const started = Date.now();
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `testsrc2=size=${size}:rate=30:duration=${seconds}`,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=440:sample_rate=48000:duration=${seconds}`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "23",
      "-preset",
      "veryfast",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      "-movflags",
      "+faststart",
      output,
    ],
    { timeout: 300_000, maxBuffer: 2_000_000 },
  );
  const info = await probe(output);
  return { label, seconds, size, ms: Date.now() - started, bytes: info.size, codec: info.codec, audio: info.audio };
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "hc-video-v2-"));
  const files = await prisma.$queryRaw`SELECT url FROM "DishVideo" UNION ALL SELECT url FROM "ProductVideo"`;
  const results = [];
  let index = 0;
  for (const file of files) {
    index += 1;
    const input = join(dir, `in-${index}.bin`);
    const output = join(dir, `out-${index}.mp4`);
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error("download");
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(input, bytes);
      const before = await probe(input);
      const ms = await encode(input, output, 23);
      const after = await probe(output);
      results.push({
        index,
        before: before.size,
        after: after.size,
        reduction: before.size ? Math.round((1 - after.size / before.size) * 1000) / 10 : null,
        ms,
        beforeCodec: before.codec,
        afterCodec: after.codec,
        beforeAudio: before.audio,
        afterAudio: after.audio,
        beforeResolution: `${before.width}x${before.height}`,
        afterResolution: `${after.width}x${after.height}`,
        beforeDuration: Math.round(before.duration),
        afterDuration: Math.round(after.duration),
        recommendation: recommend(before, after),
      });
    } catch {
      results.push({ index, recommendation: "FAILED_PROCESSING" });
    }
  }
  const syntheticResults = [];
  for (const job of [
    ["720p-30s", "1280x720", 30],
    ["720p-90s", "1280x720", 90],
    ["1080p-90s", "1920x1080", 90],
    ["720p-120s", "1280x720", 120],
    ["1080p-120s", "1920x1080", 120],
    ["4k-120s", "3840x2160", 120],
  ]) {
    try {
      syntheticResults.push(await synthetic(dir, job[0], job[1], job[2]));
    } catch {
      syntheticResults.push({ label: job[0], success: false });
    }
  }
  const counts = results.reduce((acc, item) => {
    acc[item.recommendation] = (acc[item.recommendation] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ dirKept: false, counts, results, syntheticResults }));
  await rm(dir, { recursive: true, force: true });
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ error: error instanceof Error ? error.name : "error" }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

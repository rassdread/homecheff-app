/**
 * Local visual comparison only. Does not upload or update listings.
 * Writes frames under the OS temp directory and prints paths plus measurements.
 */
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

async function probe(file: string) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_name,codec_type,width,height,color_transfer,color_primaries,avg_frame_rate",
      "-of",
      "json",
      file,
    ],
    { timeout: 30_000 },
  );
  return JSON.parse(stdout) as {
    format?: { duration?: string; size?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      color_transfer?: string;
      color_primaries?: string;
    }>;
  };
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "hc-v21-frames-"));
  const files = await prisma.$queryRaw<Array<{ url: string }>>`
    SELECT url FROM "DishVideo"
    UNION ALL
    SELECT url FROM "ProductVideo"
  `;
  const rows = [];
  let index = 0;
  for (const file of files) {
    index += 1;
    const input = join(dir, `in-${index}.mp4`);
    const output = join(dir, `out-${index}.mp4`);
    const response = await fetch(file.url);
    if (!response.ok) {
      rows.push({ index, error: "download" });
      continue;
    }
    await writeFile(input, Buffer.from(await response.arrayBuffer()));
    const before = await probe(input);
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
        "23",
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
      { timeout: 120_000 },
    );
    const after = await probe(output);
    const duration = Number(before.format?.duration || 0);
    const frames: string[] = [];
    for (const point of [0.12, 0.5, 0.82]) {
      const stamp = Math.max(0.2, duration * point);
      for (const [label, source] of [
        ["orig", input],
        ["cand", output],
      ] as const) {
        const frame = join(dir, `v${index}-${label}-${point}.jpg`);
        await execFileAsync(
          "ffmpeg",
          ["-y", "-ss", String(stamp), "-i", source, "-frames:v", "1", "-q:v", "3", frame],
          { timeout: 20_000 },
        );
        frames.push(frame);
      }
    }
    const video = before.streams?.find((stream) => stream.codec_type === "video");
    const audio = before.streams?.find((stream) => stream.codec_type === "audio");
    const outVideo = after.streams?.find((stream) => stream.codec_type === "video");
    const outAudio = after.streams?.find((stream) => stream.codec_type === "audio");
    rows.push({
      index,
      beforeBytes: Number(before.format?.size || 0),
      afterBytes: Number(after.format?.size || 0),
      beforeResolution: `${video?.width}x${video?.height}`,
      afterResolution: `${outVideo?.width}x${outVideo?.height}`,
      duration: Math.round(duration),
      beforeAudio: audio?.codec_name ?? null,
      afterAudio: outAudio?.codec_name ?? null,
      colorTransfer: video?.color_transfer ?? null,
      colorPrimaries: video?.color_primaries ?? null,
      encodeMs: Date.now() - started,
      frames,
    });
  }
  console.log(JSON.stringify({ dir, rows }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

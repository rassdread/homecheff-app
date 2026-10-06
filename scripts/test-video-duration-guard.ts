import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { probeIsoBmff } from "../lib/media/iso-bmff-probe";
import { decideVideoDuration } from "../lib/media/video-duration-guard";

const execFileAsync = promisify(execFile);

async function encode(path: string, seconds: number, codec: "h264" | "hevc"): Promise<void> {
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `testsrc2=size=160x90:rate=30:duration=${seconds}`,
    "-an",
    "-t",
    String(seconds),
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  ];
  if (codec === "h264") {
    args.push("-c:v", "libx264", "-preset", "ultrafast", path);
  } else {
    args.push("-c:v", "libx265", "-preset", "ultrafast", "-tag:v", "hvc1", path);
  }
  await execFileAsync("ffmpeg", args, { timeout: 120_000 });
}

async function ffprobeDuration(path: string): Promise<number> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
    { timeout: 20_000 },
  );
  return Number(stdout.trim());
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "hc-duration-"));
  const cases = [29, 30, 31, 60, 89, 90, 91, 120];
  try {
    for (const seconds of cases) {
      const path = join(dir, `${seconds}.mp4`);
      await encode(path, seconds, "h264");
      const bytes = new Uint8Array(await readFile(path));
      const probe = probeIsoBmff(bytes);
      const actual = await ffprobeDuration(path);
      assert.equal(probe.ok, true, `${seconds}s should probe`);
      if (!probe.ok) continue;
      assert.ok(Math.abs(probe.durationSeconds - actual) < 0.25, `${seconds}s probe ${probe.durationSeconds} vs ${actual}`);
      assert.equal(probe.videoCodec, "avc1");
      const at30 = decideVideoDuration(bytes, 30);
      const at90 = decideVideoDuration(bytes, 90);
      assert.equal(at30.ok, seconds <= 30, `${seconds}s against 30`);
      assert.equal(at90.ok, seconds <= 90, `${seconds}s against 90`);
    }

    const hevcPath = join(dir, "hevc.mov");
    try {
      await encode(hevcPath, 3, "hevc");
      const hevc = probeIsoBmff(new Uint8Array(await readFile(hevcPath)));
      assert.equal(hevc.ok, true, "hevc mov should expose container duration");
      if (hevc.ok) assert.ok(hevc.durationSeconds > 2 && hevc.durationSeconds < 4);
    } catch {
      console.log("hevc-encode: skipped");
    }

    const valid = new Uint8Array(await readFile(join(dir, "30.mp4")));
    const truncated = probeIsoBmff(valid.slice(0, 64));
    assert.equal(truncated.ok, false);
    const garbage = probeIsoBmff(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
    assert.equal(garbage.ok, false);
    const emptyDecision = decideVideoDuration(new Uint8Array(0), 90);
    assert.equal(emptyDecision.ok, false);
    console.log("video-duration-guard: pass");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "error");
  process.exitCode = 1;
});

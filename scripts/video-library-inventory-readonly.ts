/**
 * Read-only video library totals. Prints aggregates only. Does not update rows or blobs.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);

config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    Array<{
      listings: number;
      dishRows: number;
      productRows: number;
      bytes: number | null;
      sized: number;
      unsized: number;
      averageSized: number | null;
      median: number | null;
      p95: number | null;
      largest: number | null;
      mp4: number;
      mov: number;
      webm: number;
      otherExtension: number;
      under2: number;
      b2to5: number;
      b5to10: number;
      b10to20: number;
      b20to50: number;
      over50: number;
      d0_30: number;
      d31_60: number;
      d61_90: number;
      d91_120: number;
      dOver120: number;
      durationUnknown: number;
    }>
  >`
    WITH videos AS (
      SELECT url, "fileSize", duration, 'dish' AS kind FROM "DishVideo"
      UNION ALL
      SELECT url, "fileSize", duration, 'product' AS kind FROM "ProductVideo"
    )
    SELECT
      COUNT(*)::int AS listings,
      COUNT(*) FILTER (WHERE kind = 'dish')::int AS "dishRows",
      COUNT(*) FILTER (WHERE kind = 'product')::int AS "productRows",
      COALESCE(SUM("fileSize"), 0)::float AS bytes,
      COUNT("fileSize")::int AS sized,
      COUNT(*) FILTER (WHERE "fileSize" IS NULL)::int AS unsized,
      AVG("fileSize")::float AS "averageSized",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "fileSize")::float AS median,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "fileSize")::float AS p95,
      MAX("fileSize")::float AS largest,
      COUNT(*) FILTER (WHERE lower(url) LIKE '%.mp4%' OR lower(url) LIKE '%.m4v%')::int AS mp4,
      COUNT(*) FILTER (WHERE lower(url) LIKE '%.mov%' OR lower(url) LIKE '%quicktime%')::int AS mov,
      COUNT(*) FILTER (WHERE lower(url) LIKE '%.webm%')::int AS webm,
      COUNT(*) FILTER (
        WHERE lower(url) NOT LIKE '%.mp4%'
          AND lower(url) NOT LIKE '%.m4v%'
          AND lower(url) NOT LIKE '%.mov%'
          AND lower(url) NOT LIKE '%quicktime%'
          AND lower(url) NOT LIKE '%.webm%'
      )::int AS "otherExtension",
      COUNT(*) FILTER (WHERE "fileSize" IS NOT NULL AND "fileSize" < 2097152)::int AS under2,
      COUNT(*) FILTER (WHERE "fileSize" >= 2097152 AND "fileSize" < 5242880)::int AS b2to5,
      COUNT(*) FILTER (WHERE "fileSize" >= 5242880 AND "fileSize" < 10485760)::int AS b5to10,
      COUNT(*) FILTER (WHERE "fileSize" >= 10485760 AND "fileSize" < 20971520)::int AS b10to20,
      COUNT(*) FILTER (WHERE "fileSize" >= 20971520 AND "fileSize" < 52428800)::int AS b20to50,
      COUNT(*) FILTER (WHERE "fileSize" >= 52428800)::int AS over50,
      COUNT(*) FILTER (WHERE duration IS NOT NULL AND duration <= 30)::int AS d0_30,
      COUNT(*) FILTER (WHERE duration > 30 AND duration <= 60)::int AS d31_60,
      COUNT(*) FILTER (WHERE duration > 60 AND duration <= 90)::int AS d61_90,
      COUNT(*) FILTER (WHERE duration > 90 AND duration <= 120)::int AS d91_120,
      COUNT(*) FILTER (WHERE duration > 120)::int AS "dOver120",
      COUNT(*) FILTER (WHERE duration IS NULL)::int AS "durationUnknown"
    FROM videos
  `;
  const row = rows[0];
  const files = await prisma.$queryRaw<Array<{ url: string; duration: number | null }>>`
    SELECT url, duration FROM "DishVideo"
    UNION ALL
    SELECT url, duration FROM "ProductVideo"
  `;
  const probe = {
    h264: 0,
    hevc: 0,
    otherCodec: 0,
    unknownCodec: 0,
    p720OrLower: 0,
    p1080: 0,
    above1080: 0,
    unknownResolution: 0,
    bytes: 0,
    sized: 0,
    under2: 0,
    b2to5: 0,
    b5to10: 0,
    b10to20: 0,
    b20to50: 0,
    over50: 0,
    sizes: [] as number[],
  };
  for (const file of files) {
    try {
      const { stdout } = await execFileAsync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=size:stream=codec_name,codec_type,width,height",
          "-of",
          "json",
          file.url,
        ],
        { timeout: 25_000, maxBuffer: 1_000_000 },
      );
      const parsed = JSON.parse(stdout) as {
        format?: { size?: string };
        streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
      };
      const size = Number(parsed.format?.size);
      if (Number.isFinite(size) && size > 0) {
        probe.bytes += size;
        probe.sized += 1;
        probe.sizes.push(size);
        if (size < 2_097_152) probe.under2 += 1;
        else if (size < 5_242_880) probe.b2to5 += 1;
        else if (size < 10_485_760) probe.b5to10 += 1;
        else if (size < 20_971_520) probe.b10to20 += 1;
        else if (size < 52_428_800) probe.b20to50 += 1;
        else probe.over50 += 1;
      }
      const video = parsed.streams?.find((stream) => stream.codec_type === "video");
      const codec = video?.codec_name ?? "";
      if (codec === "h264") probe.h264 += 1;
      else if (codec === "hevc" || codec === "h265") probe.hevc += 1;
      else if (codec) probe.otherCodec += 1;
      else probe.unknownCodec += 1;
      const height = video?.height ?? 0;
      const width = video?.width ?? 0;
      const longEdge = Math.max(height, width);
      if (!longEdge) probe.unknownResolution += 1;
      else if (longEdge <= 1280) probe.p720OrLower += 1;
      else if (longEdge <= 1920) probe.p1080 += 1;
      else probe.above1080 += 1;
    } catch {
      probe.unknownCodec += 1;
      probe.unknownResolution += 1;
    }
  }
  probe.sizes.sort((a, b) => a - b);
  const mid = probe.sizes.length ? probe.sizes[Math.floor((probe.sizes.length - 1) / 2)] : null;
  const p95Index = probe.sizes.length ? Math.min(probe.sizes.length - 1, Math.ceil(probe.sizes.length * 0.95) - 1) : -1;

  const probed = probe.sized > 0;
  console.log(
    JSON.stringify({
      listings: row?.listings ?? files.length,
      dishRows: row?.dishRows ?? null,
      productRows: row?.productRows ?? null,
      dbFileSizeKnown: row?.sized ?? 0,
      bytes: probed ? probe.bytes : null,
      averageSized: probed ? Math.round(probe.bytes / probe.sized) : null,
      median: mid,
      p95: p95Index >= 0 ? probe.sizes[p95Index] : null,
      largest: probe.sizes.length ? probe.sizes[probe.sizes.length - 1] : null,
      mp4: row?.mp4 ?? null,
      mov: row?.mov ?? null,
      webm: row?.webm ?? null,
      otherExtension: row?.otherExtension ?? null,
      h264: probe.h264,
      hevc: probe.hevc,
      otherCodec: probe.otherCodec,
      unknownCodec: probe.unknownCodec,
      p720OrLower: probe.p720OrLower,
      p1080: probe.p1080,
      above1080: probe.above1080,
      unknownResolution: probe.unknownResolution,
      under2: probed ? probe.under2 : null,
      b2to5: probed ? probe.b2to5 : null,
      b5to10: probed ? probe.b5to10 : null,
      b10to20: probed ? probe.b10to20 : null,
      b20to50: probed ? probe.b20to50 : null,
      over50: probed ? probe.over50 : null,
      d0_30: row?.d0_30 ?? null,
      d31_60: row?.d31_60 ?? null,
      d61_90: row?.d61_90 ?? null,
      d91_120: row?.d91_120 ?? null,
      dOver120: row?.dOver120 ?? null,
      durationUnknown: row?.durationUnknown ?? null,
      probedFiles: probe.sized,
    }),
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.name : "error";
    console.error(JSON.stringify({ error: message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { MAX_VIDEO_DURATION, MAX_VIDEO_SIZE } from "@/lib/videoUtils";

export const MARKETPLACE_VIDEO_NAMESPACE = "MARKETPLACE_VIDEO";
export const MARKETPLACE_VIDEO_PROFILE = "marketplace-h264-v1";

/** Public product policy. The worker is certified up to 90 seconds, but this stays authoritative. */
export const MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS = MAX_VIDEO_DURATION;

export const MARKETPLACE_SOURCE_MAX_BYTES = MAX_VIDEO_SIZE;
export const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;

const PROCESSING_BLOB_HOST = ".blob.vercel-storage.com";

export function marketplaceVideoWorkerEnabled(): boolean {
  return (
    process.env.MARKETPLACE_VIDEO_WORKER === "1" &&
    Boolean(process.env.VIDEO_WORKER_BASE_URL?.trim()) &&
    Boolean(process.env.VIDEO_WORKER_SECRET?.trim())
  );
}

/** Browser-supplied maxima are ignored. */
export function authoritativeMaxDuration(_requested: unknown): number {
  return MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS;
}

export function isMarketplaceProcessingBlobUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.endsWith(PROCESSING_BLOB_HOST)) return false;
    const path = decodeURIComponent(url.pathname);
    if (path.includes("..")) return false;
    return path.includes("/marketplace-video-sources/") || path.includes("/marketplace-video/");
  } catch {
    return false;
  }
}

export function cleanupTargetsForFailedJob(job: {
  status: string;
  sourceUrl: string;
  canonicalUrl: string | null;
  posterUrl: string | null;
}): string[] {
  if (job.status !== "FAILED") return [];
  return [job.sourceUrl, job.canonicalUrl, job.posterUrl].filter((value): value is string =>
    isMarketplaceProcessingBlobUrl(value),
  );
}

export function marketplaceVideoUserMessage(code: string | null): string {
  if (code === "DURATION") {
    return `Video is te lang. Maximum ${MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS} seconden.`;
  }
  if (code === "OVERSIZE") {
    return "Dit bestand is te groot voor een Marketplace-video.";
  }
  if (code === "HDR_UNSUPPORTED") {
    return "HDR-video wordt nog niet veilig verwerkt. Gebruik een gewone video.";
  }
  if (code === "BUSY") {
    return "Video verwerken is even bezet. Probeer het zo opnieuw.";
  }
  return "De video kon niet worden verwerkt. Probeer het opnieuw.";
}

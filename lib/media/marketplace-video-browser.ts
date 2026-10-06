export type MarketplaceProcessedVideo = {
  url: string;
  thumbnail: string | null;
  duration: number | null;
};

type JobView = {
  jobId?: string;
  status?: string;
  url?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  error?: string | null;
};

/**
 * Browser uploads the source straight to Blob, then HomeCheff asks the
 * existing Render worker to read that Blob. The video body does not pass
 * through a Vercel function.
 */
export async function uploadMarketplaceVideo(file: File, signal: AbortSignal): Promise<MarketplaceProcessedVideo> {
  const { upload } = await import("@vercel/blob/client");
  const id = crypto.randomUUID();
  const extension = file.name.toLowerCase().endsWith(".mov") ? "mov" : "mp4";
  const blob = await upload(`marketplace-video-sources/${id}.${extension}`, file, {
    access: "public",
    handleUploadUrl: "/api/media/marketplace-video/upload",
    multipart: file.size > 3 * 1024 * 1024,
    contentType: file.type || (extension === "mov" ? "video/quicktime" : "video/mp4"),
  });
  const started = await fetch("/api/media/marketplace-video", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: id, sourceUrl: blob.url }),
    signal,
  });
  const startedBody = (await started.json().catch(() => ({}))) as JobView;
  if (!started.ok) {
    throw new Error(startedBody.error || "De video kon niet worden verwerkt. Probeer het opnieuw.");
  }
  if (startedBody.status === "READY" && startedBody.url) {
    return {
      url: startedBody.url,
      thumbnail: startedBody.thumbnail ?? null,
      duration: startedBody.duration ?? null,
    };
  }
  const deadline = Date.now() + 4 * 60 * 1000;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error("Upload geannuleerd");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusResponse = await fetch(`/api/media/marketplace-video?jobId=${id}`, { signal });
    const statusBody = (await statusResponse.json().catch(() => ({}))) as JobView;
    if (statusBody.status === "READY" && statusBody.url) {
      return {
        url: statusBody.url,
        thumbnail: statusBody.thumbnail ?? null,
        duration: statusBody.duration ?? null,
      };
    }
    if (statusBody.status === "FAILED" || !statusResponse.ok) {
      throw new Error(statusBody.error || "De video kon niet worden verwerkt. Probeer het opnieuw.");
    }
  }
  throw new Error("De video kon niet worden verwerkt. Probeer het opnieuw.");
}

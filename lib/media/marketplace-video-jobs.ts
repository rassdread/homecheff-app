import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS,
  MARKETPLACE_VIDEO_NAMESPACE,
  MARKETPLACE_VIDEO_PROFILE,
  PROCESSING_TIMEOUT_MS,
  authoritativeMaxDuration,
  isMarketplaceProcessingBlobUrl,
  marketplaceVideoWorkerEnabled,
} from "@/lib/media/marketplace-video-policy";

const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MarketplaceJobRecord = {
  id: string;
  ownerUserId: string;
  status: string;
  failureCode: string | null;
  canonicalUrl: string | null;
  posterUrl: string | null;
  sourceUrl: string;
  maxDurationSeconds: number;
  updatedAt: Date;
  probeJson: unknown;
};

function workerBaseUrl(): string {
  return (process.env.VIDEO_WORKER_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

function workerSecret(): string {
  return (process.env.VIDEO_WORKER_SECRET ?? "").trim();
}

export function isJobId(value: string): boolean {
  return JOB_ID_RE.test(value);
}

export function isSourceUploadUrl(value: string): boolean {
  if (!isMarketplaceProcessingBlobUrl(value)) return false;
  return new URL(value).pathname.includes("/marketplace-video-sources/");
}

function isStale(job: { status: string; updatedAt: Date }): boolean {
  return job.status === "PROCESSING" && Date.now() - job.updatedAt.getTime() > PROCESSING_TIMEOUT_MS;
}

async function markFailed(id: string, failureCode: string): Promise<void> {
  await prisma.marketplaceVideoJob.update({
    where: { id },
    data: { status: "FAILED", failureCode },
  });
}

export async function startMarketplaceVideoJob(input: {
  jobId: string;
  ownerUserId: string;
  listingId?: string | null;
  sourceUrl: string;
}): Promise<{ ok: true; job: MarketplaceJobRecord } | { ok: false; status: number; error: string }> {
  if (!marketplaceVideoWorkerEnabled()) {
    return { ok: false, status: 409, error: "Video verwerken staat uit." };
  }
  if (!isJobId(input.jobId) || !isSourceUploadUrl(input.sourceUrl)) {
    return { ok: false, status: 400, error: "De video-upload is ongeldig." };
  }
  const maxDurationSeconds = authoritativeMaxDuration(null);
  const existing = await prisma.marketplaceVideoJob.findUnique({ where: { id: input.jobId } });
  if (existing && existing.ownerUserId !== input.ownerUserId) {
    return { ok: false, status: 404, error: "Video niet gevonden." };
  }
  if (existing?.status === "READY" && existing.canonicalUrl && existing.posterUrl) {
    return { ok: true, job: existing };
  }
  if (existing && existing.status === "PROCESSING" && !isStale(existing)) {
    return { ok: true, job: existing };
  }
  const job = existing
    ? await prisma.marketplaceVideoJob.update({
        where: { id: input.jobId },
        data: {
          status: "PROCESSING",
          failureCode: null,
          sourceUrl: input.sourceUrl,
          maxDurationSeconds,
          listingId: input.listingId ?? existing.listingId,
        },
      })
    : await prisma.marketplaceVideoJob.create({
        data: {
          id: input.jobId,
          ownerUserId: input.ownerUserId,
          listingId: input.listingId ?? null,
          sourceUrl: input.sourceUrl,
          status: "PROCESSING",
          maxDurationSeconds,
        },
      });

  const callbackUrl = "https://homecheff.eu/api/media/marketplace-video/callback";
  let response: Response;
  try {
    response = await fetch(`${workerBaseUrl()}/jobs/marketplace-video/${input.jobId}/process`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${workerSecret()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sourceUrl: input.sourceUrl,
        maxDurationSeconds,
        profile: MARKETPLACE_VIDEO_PROFILE,
        callbackUrl,
        namespace: MARKETPLACE_VIDEO_NAMESPACE,
      }),
    });
  } catch {
    await markFailed(input.jobId, "RENDER_UNAVAILABLE");
    return { ok: false, status: 503, error: "De video kon niet worden verwerkt. Probeer het opnieuw." };
  }
  if (response.status === 429) {
    await markFailed(input.jobId, "BUSY");
    return { ok: false, status: 429, error: "Video verwerken is even bezet. Probeer het zo opnieuw." };
  }
  if (!response.ok && response.status !== 202) {
    await markFailed(input.jobId, "RENDER_UNAVAILABLE");
    return { ok: false, status: 502, error: "De video kon niet worden verwerkt. Probeer het opnieuw." };
  }
  return { ok: true, job };
}

export async function readMarketplaceVideoJob(input: {
  jobId: string;
  ownerUserId: string;
}): Promise<MarketplaceJobRecord | null> {
  const job = await prisma.marketplaceVideoJob.findUnique({ where: { id: input.jobId } });
  if (!job || job.ownerUserId !== input.ownerUserId) return null;
  if (isStale(job)) {
    return prisma.marketplaceVideoJob.update({
      where: { id: job.id },
      data: { status: "FAILED", failureCode: "TIMEOUT" },
    });
  }
  return job;
}

export async function applyMarketplaceCallback(input: {
  jobId: string;
  status: "READY" | "FAILED";
  failureCode: string | null;
  canonicalUrl: string | null;
  posterUrl: string | null;
  probe: unknown;
}): Promise<boolean> {
  const job = await prisma.marketplaceVideoJob.findUnique({ where: { id: input.jobId } });
  if (!job) return false;
  if (job.status === "READY") return true;
  if (input.status === "READY") {
    if (!isMarketplaceProcessingBlobUrl(input.canonicalUrl) || !input.canonicalUrl?.includes("/marketplace-video/")) {
      await markFailed(input.jobId, "BLOB_WRITE");
      return true;
    }
    if (!isMarketplaceProcessingBlobUrl(input.posterUrl)) {
      await markFailed(input.jobId, "BLOB_WRITE");
      return true;
    }
    await prisma.marketplaceVideoJob.update({
      where: { id: input.jobId },
      data: {
        status: "READY",
        failureCode: null,
        canonicalUrl: input.canonicalUrl,
        posterUrl: input.posterUrl,
        probeJson:
          input.probe && typeof input.probe === "object"
            ? (input.probe as Prisma.InputJsonValue)
            : undefined,
      },
    });
    return true;
  }
  await prisma.marketplaceVideoJob.update({
    where: { id: input.jobId },
    data: {
      status: "FAILED",
      failureCode: input.failureCode || "FAILED",
      canonicalUrl: null,
      posterUrl: null,
    },
  });
  return true;
}

export function publicJobView(job: MarketplaceJobRecord): {
  jobId: string;
  status: string;
  url: string | null;
  thumbnail: string | null;
  duration: number | null;
  error: string | null;
} {
  const probe = job.probeJson && typeof job.probeJson === "object" ? (job.probeJson as { durationSeconds?: number }) : null;
  const duration = probe?.durationSeconds ? Math.round(probe.durationSeconds) : null;
  return {
    jobId: job.id,
    status: job.status,
    url: job.status === "READY" ? job.canonicalUrl : null,
    thumbnail: job.status === "READY" ? job.posterUrl : null,
    duration: job.status === "READY" ? duration : null,
    error: job.status === "FAILED" ? job.failureCode : null,
  };
}

export const expectedPublicMaxDuration = MARKETPLACE_PUBLIC_MAX_DURATION_SECONDS;

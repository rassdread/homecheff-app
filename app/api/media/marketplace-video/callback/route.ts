import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MARKETPLACE_VIDEO_NAMESPACE } from "@/lib/media/marketplace-video-policy";
import { applyMarketplaceCallback, isJobId } from "@/lib/media/marketplace-video-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function secretMatches(header: string | null): boolean {
  const secret = process.env.VIDEO_WORKER_SECRET?.trim() ?? "";
  const presented = header?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!secret || !presented || secret.length !== presented.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(presented));
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    namespace?: string;
    status?: string;
    failureCode?: string | null;
    canonicalUrl?: string | null;
    posterUrl?: string | null;
    probe?: unknown;
  } | null;
  if (!body?.jobId || !isJobId(body.jobId) || body.namespace !== MARKETPLACE_VIDEO_NAMESPACE) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (body.status !== "READY" && body.status !== "FAILED") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const updated = await applyMarketplaceCallback({
      jobId: body.jobId,
      status: body.status,
      failureCode: body.failureCode ?? null,
      canonicalUrl: body.canonicalUrl ?? null,
      posterUrl: body.posterUrl ?? null,
      probe: body.probe ?? null,
    });
    return NextResponse.json({ ok: updated });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

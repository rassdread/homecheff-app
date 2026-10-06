import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marketplaceVideoUserMessage } from "@/lib/media/marketplace-video-policy";
import {
  isJobId,
  publicJobView,
  readMarketplaceVideoJob,
  startMarketplaceVideoJob,
} from "@/lib/media/marketplace-video-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

async function ownerId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function POST(request: NextRequest) {
  const userId = await ownerId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    sourceUrl?: string;
    listingId?: string;
    maxDurationSeconds?: number;
  } | null;
  if (!body?.jobId || !body.sourceUrl) {
    return NextResponse.json({ error: "De video-upload is ongeldig." }, { status: 400 });
  }
  try {
    const result = await startMarketplaceVideoJob({
      jobId: body.jobId,
      ownerUserId: userId,
      listingId: body.listingId ?? null,
      sourceUrl: body.sourceUrl,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const view = publicJobView(result.job);
    if (view.error) view.error = marketplaceVideoUserMessage(view.error);
    return NextResponse.json(view);
  } catch {
    return NextResponse.json(
      { error: "De video kon niet worden verwerkt. Probeer het opnieuw." },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = await ownerId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobId = request.nextUrl.searchParams.get("jobId") ?? "";
  if (!isJobId(jobId)) return NextResponse.json({ error: "Video niet gevonden." }, { status: 404 });
  try {
    const job = await readMarketplaceVideoJob({ jobId, ownerUserId: userId });
    if (!job) return NextResponse.json({ error: "Video niet gevonden." }, { status: 404 });
    const view = publicJobView(job);
    if (view.error) view.error = marketplaceVideoUserMessage(view.error);
    return NextResponse.json(view);
  } catch {
    return NextResponse.json(
      { error: "De video kon niet worden verwerkt. Probeer het opnieuw." },
      { status: 503 },
    );
  }
}

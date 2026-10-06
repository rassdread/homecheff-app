import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marketplaceVideoWorkerEnabled } from "@/lib/media/marketplace-video-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ enabled: false }, { status: 401 });
  }
  return NextResponse.json({
    enabled: marketplaceVideoWorkerEnabled(),
    namespace: "MARKETPLACE_VIDEO",
  });
}

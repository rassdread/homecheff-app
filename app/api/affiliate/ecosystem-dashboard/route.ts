import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HomeCheff-native proxy to Growth ecosystem affiliate dashboard (central ledger).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, centralUserId: true },
  });
  const centralUserId = user?.centralUserId?.trim() || user?.id;
  if (!centralUserId) {
    return NextResponse.json({ ok: false, code: "NO_IDENTITY" }, { status: 422 });
  }

  const origin = (
    process.env.GROWTH_HC_QUOTE_BASE_URL ??
    process.env.GROWTH_API_BASE_URL ??
    "https://growth.homecheff.eu"
  ).replace(/\/$/, "");
  const secret =
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    process.env.HC_INTERNAL_PROBE_SECRET?.trim() ||
    process.env.GROWTH_INTERNAL_SECRET?.trim() ||
    "";
  const url = new URL(req.url);
  const source = url.searchParams.get("source") ?? "marketplace";
  const growthUrl = `${origin}/api/ecosystem/affiliate/dashboard?source=${encodeURIComponent(source)}`;

  const res = await fetch(growthUrl, {
    headers: {
      "x-studio-hc-internal-secret": secret,
      "x-studio-central-user-id": centralUserId,
      "x-ecosystem-affiliate-central-user-id": centralUserId,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ ok: false, code: "GROWTH_DASHBOARD_FAILED" }));
  return NextResponse.json(json, { status: res.status });
}

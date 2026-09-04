import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * HomeCheff-native proxy to Growth ecosystem affiliate dashboard (central ledger).
 * Never hard-fail the Marketplace shell — return a degraded payload when Growth is unavailable.
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
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET?.trim() ||
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    process.env.HC_INTERNAL_PROBE_SECRET?.trim() ||
    process.env.GROWTH_INTERNAL_SECRET?.trim() ||
    "";
  const url = new URL(req.url);
  const source = url.searchParams.get("source") ?? "marketplace";
  const growthUrl = `${origin}/api/ecosystem/affiliate/dashboard?source=${encodeURIComponent(source)}`;

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        degraded: true,
        code: "GROWTH_SECRET_MISSING",
        message: "Affiliate-overzicht tijdelijk niet beschikbaar.",
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(growthUrl, {
      headers: {
        Authorization: `Bearer ${secret}`,
        "x-studio-hc-internal-secret": secret,
        "x-hc-ecosystem-internal-secret": secret,
        "x-studio-central-user-id": centralUserId,
        "x-ecosystem-affiliate-central-user-id": centralUserId,
        "x-central-user-id": centralUserId,
      },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({
      ok: false,
      code: "GROWTH_DASHBOARD_FAILED",
    }));
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          degraded: true,
          code: (json as { code?: string })?.code ?? "GROWTH_DASHBOARD_FAILED",
          message: "Affiliate-overzicht tijdelijk niet beschikbaar.",
          upstreamStatus: res.status,
        },
        { status: 200 },
      );
    }
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    console.warn("[affiliate/ecosystem-dashboard] growth fetch failed", err);
    return NextResponse.json(
      {
        ok: false,
        degraded: true,
        code: "GROWTH_DASHBOARD_UNAVAILABLE",
        message: "Affiliate-overzicht tijdelijk niet beschikbaar.",
      },
      { status: 200 },
    );
  }
}

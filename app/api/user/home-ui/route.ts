import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/apiCors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json(
        { hideHomeHero: false, hideHowItWorks: false },
        { headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hideHomeHero: true, hideHowItWorks: true },
    });

    return NextResponse.json(
      {
        hideHomeHero: user?.hideHomeHero ?? false,
        hideHowItWorks: user?.hideHowItWorks ?? false,
      },
      { headers: cors }
    );
  } catch {
    return NextResponse.json(
      { hideHomeHero: false, hideHowItWorks: false },
      { status: 500, headers: cors }
    );
  }
}

/** Partiële update; alleen meegegeven velden worden gezet. */
export async function PATCH(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: cors });
    }

    const body = await req.json().catch(() => ({}));
    const data: { hideHomeHero?: boolean; hideHowItWorks?: boolean } = {};

    if (typeof body.hideHomeHero === "boolean") {
      data.hideHomeHero = body.hideHomeHero;
    }
    if (typeof body.hideHowItWorks === "boolean") {
      data.hideHowItWorks = body.hideHowItWorks;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Geen geldige velden" },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { hideHomeHero: true, hideHowItWorks: true },
    });

    return NextResponse.json(
      {
        success: true,
        hideHomeHero: user.hideHomeHero,
        hideHowItWorks: user.hideHowItWorks,
      },
      { headers: cors }
    );
  } catch (error) {
    console.error("home-ui PATCH:", error);
    return NextResponse.json(
      { error: "Bijwerken mislukt" },
      { status: 500, headers: cors }
    );
  }
}

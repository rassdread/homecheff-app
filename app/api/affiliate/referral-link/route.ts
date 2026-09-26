/**
 * Get Referral Link API
 * 
 * GET /api/affiliate/referral-link
 * Returns the referral link code for the authenticated affiliate
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildPersonalReferralUrl,
  ensurePersonalReferralLink,
} from "@/lib/affiliates/personal-referral";

export const dynamic = 'force-dynamic';

function referralOrigin(req: NextRequest): string {
  return req.nextUrl.origin || "https://homecheff.eu";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        })
      : await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true },
        });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ensured = await ensurePersonalReferralLink(user.id);
    if (!ensured) {
      return NextResponse.json({
        code: null,
        link: null,
        enrollmentRequired: true,
      });
    }

    return NextResponse.json({
      code: ensured.code,
      link: buildPersonalReferralUrl(referralOrigin(req), ensured.code),
    });
  } catch (error) {
    console.error("Error ensuring referral link:", error);
    return NextResponse.json(
      { error: "Failed to create referral link" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        affiliate: {
          include: {
            referralLinks: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    // Geen affiliate of nog geen link: 200 + null voorkomt 404-spam voor gewone gebruikers
    if (!user?.affiliate) {
      return NextResponse.json({ code: null, link: null });
    }

    const referralLink = user.affiliate.referralLinks[0];
    if (!referralLink) {
      return NextResponse.json({ code: null, link: null });
    }

    // Detect language from referrer header or cookie
    // API routes don't have /en/ in pathname, so check referrer or cookie
    const referer = req.headers.get('referer') || '';
    const isEnglish = referer.includes('/en/') || req.cookies.get('homecheff-language')?.value === 'en';
    const langPrefix = isEnglish ? '/en' : '';
    
    return NextResponse.json({
      code: referralLink.code,
      link: `${req.nextUrl.origin}${langPrefix}/welkom/${referralLink.code}`,
    });
  } catch (error) {
    console.error("Error fetching referral link:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral link" },
      { status: 500 }
    );
  }
}



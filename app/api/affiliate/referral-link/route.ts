/**
 * Get Referral Link API
 * 
 * GET /api/affiliate/referral-link
 * Returns the referral link code for the authenticated affiliate
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    const referralLink = user.affiliate.referralLinks[0];
    if (!referralLink) {
      return NextResponse.json({ error: "Referral link not found" }, { status: 404 });
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



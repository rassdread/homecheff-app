/**
 * Referral Link Handler
 * 
 * Handles referral link clicks and sets cookie
 * GET /api/affiliate/referral?code=REFCODE
 */

import { NextRequest, NextResponse } from "next/server";
import { getAffiliateIdFromCode } from "@/lib/affiliate-attribution";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const redirect = searchParams.get('redirect') || '/';

    if (!code) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }

    // Validate referral code
    const affiliateId = await getAffiliateIdFromCode(code);
    if (!affiliateId) {
      // Invalid code, redirect anyway but don't set cookie
      return NextResponse.redirect(new URL(redirect, req.url));
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirect, req.url));

    // Set referral cookie (30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    response.cookies.set('hc_ref', code, {
      expires,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Needs to be accessible from client-side
    });

    return response;
  } catch (error) {
    console.error('Error processing referral link:', error);
    // On error, just redirect without setting cookie
    const redirect = new URL(req.nextUrl.searchParams.get('redirect') || '/', req.url);
    return NextResponse.redirect(redirect);
  }
}









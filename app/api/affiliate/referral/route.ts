/**
 * Referral Link Handler
 *
 * Handles referral link clicks and sets cookie (first-touch).
 * GET /api/affiliate/referral?code=REFCODE
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAffiliateIdFromCode,
  HC_BETA_SRC_COOKIE,
  HC_BETA_SRC_VALUE,
  REFERRAL_COOKIE_NAME,
  referralCookieExpiryDate,
} from '@/lib/affiliate-attribution';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const redirect = searchParams.get('redirect') || '/';
    const androidBeta = searchParams.get('androidBeta') === '1';

    if (!code) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }

    const affiliateId = await getAffiliateIdFromCode(code);
    if (!affiliateId) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }

    const response = NextResponse.redirect(new URL(redirect, req.url));
    const expires = referralCookieExpiryDate();

    const cookieOptions = {
      expires,
      path: '/',
      sameSite: 'lax' as const,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    };

    // First-touch: only set hc_ref when not already present.
    const existingRef = req.cookies.get(REFERRAL_COOKIE_NAME)?.value?.trim();
    if (!existingRef) {
      response.cookies.set(REFERRAL_COOKIE_NAME, code, cookieOptions);
    }

    if (androidBeta) {
      response.cookies.set(HC_BETA_SRC_COOKIE, HC_BETA_SRC_VALUE, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error('Error processing referral link:', error);
    const redirect = new URL(req.nextUrl.searchParams.get('redirect') || '/', req.url);
    return NextResponse.redirect(redirect);
  }
}

/**
 * Affiliate Attribution Logic
 * 
 * Handles referral link tracking via cookies and attribution creation
 */

import { prisma } from '@/lib/prisma';
import { ATTRIBUTION_WINDOW_DAYS } from './affiliate-config';
import { AttributionType, AttributionSource } from '@prisma/client';

const COOKIE_NAME = 'hc_ref';
const COOKIE_TTL_DAYS = 30;

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) out[key] = safeDecodeURIComponent(value);
  }
  return out;
}

/**
 * Get affiliate ID from referral code
 */
export async function getAffiliateIdFromCode(code: string): Promise<string | null> {
  try {
    const raw = String(code || '').trim();
    if (!raw) return null;
    const upper = raw.toUpperCase();
    let referralLink = await prisma.referralLink.findUnique({
      where: { code: raw },
      include: {
        affiliate: true,
      },
    });
    if (!referralLink) {
      referralLink = await prisma.referralLink.findUnique({
        where: { code: upper },
        include: { affiliate: true },
      });
    }

    if (!referralLink || !referralLink.affiliate) {
      return null;
    }

    // Check if affiliate is active
    if (referralLink.affiliate.status !== 'ACTIVE') {
      return null;
    }

    return referralLink.affiliate.id;
  } catch (error) {
    console.error('Error getting affiliate from code:', error);
    return null;
  }
}

/**
 * Create attribution record for a new user signup
 */
export async function createAttribution(
  userId: string,
  affiliateId: string,
  type: AttributionType,
  source: AttributionSource
): Promise<void> {
  try {
    const now = new Date();
    const endsAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    await prisma.attribution.create({
      data: {
        affiliateId,
        userId,
        type,
        source,
        startsAt: now,
        endsAt,
      },
    });
  } catch (error) {
    console.error('Error creating attribution:', error);
    // Don't throw - attribution failure shouldn't break signup
  }
}

/**
 * Get affiliate ID from cookie (for server-side)
 * Note: In Next.js App Router, cookies are handled via headers
 */
export function getAffiliateIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[COOKIE_NAME] || null;
}

/**
 * Set referral cookie (client-side helper)
 * This should be called from the frontend when a referral link is clicked
 */
export function setReferralCookie(code: string): void {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_TTL_DAYS);
  const secure =
    window.location.protocol === 'https:' ? '; Secure' : '';
  const value = encodeURIComponent(code.trim());

  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

/**
 * Voegt een korte tracking-URL toe aan uitgaande tekst (chat) voor actieve affiliates,
 * alleen als er nog geen ref/welkom-link in de tekst staat.
 */
export function appendAffiliateReferralToOutgoingText(
  text: string,
  referralCode: string | null | undefined,
  origin?: string
): string {
  const raw = text ?? '';
  const trimmed = raw.trim();
  if (!trimmed || !referralCode?.trim()) return raw;
  const c = referralCode.trim();
  if (/\?ref=|&ref=|\/welkom\/|\/uitnodiging\//i.test(trimmed)) {
    return raw;
  }
  const o =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu');
  return `${trimmed}\n\n—\n${o}/?ref=${encodeURIComponent(c)}`;
}

/**
 * Get referral code from cookie (client-side helper)
 */
export function getReferralCodeFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = parseCookieHeader(document.cookie);
  return cookies[COOKIE_NAME] || null;
}

/**
 * Process attribution on user signup
 * This should be called after user creation in registration endpoints
 */
export async function processAttributionOnSignup(
  userId: string,
  cookieHeader: string | null,
  isBusiness: boolean = false
): Promise<void> {
  try {
    const already = await prisma.attribution.findFirst({
      where: {
        userId,
        type: {
          in: [AttributionType.USER_SIGNUP, AttributionType.BUSINESS_SIGNUP],
        },
      },
      select: { id: true },
    });
    if (already) {
      return;
    }

    // Get affiliate code from cookie
    const affiliateCode = getAffiliateIdFromCookie(cookieHeader);
    if (!affiliateCode) {
      return; // No referral cookie found
    }

    // Resolve affiliate ID from code
    const affiliateId = await getAffiliateIdFromCode(affiliateCode);
    if (!affiliateId) {
      return; // Invalid or inactive affiliate
    }

    // Check for self-referral (user cannot refer themselves)
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { userId: true },
    });

    if (affiliate && affiliate.userId === userId) {
      console.warn('Self-referral detected, skipping attribution');
      return;
    }

    // Create attribution record
    const type = isBusiness ? AttributionType.BUSINESS_SIGNUP : AttributionType.USER_SIGNUP;
    await createAttribution(userId, affiliateId, type, AttributionSource.REF_LINK);
  } catch (error) {
    console.error('Error processing attribution on signup:', error);
    // Don't throw - attribution failure shouldn't break signup
  }
}


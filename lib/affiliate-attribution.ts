/**
 * Affiliate Attribution Logic
 *
 * Handles referral link tracking via cookies and attribution creation.
 * Policy: see lib/affiliate-attribution-contract.ts (first-touch, 30d cookie).
 */

import { prisma } from '@/lib/prisma';
import { ATTRIBUTION_WINDOW_DAYS, COOKIE_TTL_DAYS } from './affiliate-config';
import {
  AFFILIATE_ATTRIBUTION_CONTRACT,
  REFERRAL_COOKIE_NAME,
} from './affiliate-attribution-contract';
import { AttributionType, AttributionSource } from '@prisma/client';

export { REFERRAL_COOKIE_NAME, AFFILIATE_ATTRIBUTION_CONTRACT };

/** Landing /app: signup-attributiebron ANDROID_BETA_DOWNLOAD als deze cookie gezet is. */
export const HC_BETA_SRC_COOKIE = 'hc_beta_src';
export const HC_BETA_SRC_VALUE = 'android_beta_download';

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

/** Cookie expiry aligned with affiliate-config COOKIE_TTL_DAYS. */
export function referralCookieExpiryDate(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + COOKIE_TTL_DAYS);
  return expires;
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
  source: AttributionSource,
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
  }
}

export function getCookieFromHeader(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  const v = cookies[name]?.trim();
  return v || null;
}

/** Waarde van hc_ref (referralcode), niet affiliate-ID — historische functienaam. */
export function getAffiliateIdFromCookie(cookieHeader: string | null): string | null {
  return getCookieFromHeader(cookieHeader, REFERRAL_COOKIE_NAME);
}

export function hasAndroidBetaDownloadCookie(cookieHeader: string | null | undefined): boolean {
  return getCookieFromHeader(cookieHeader, HC_BETA_SRC_COOKIE) === HC_BETA_SRC_VALUE;
}

/**
 * First-touch client cookie (matches server referral route).
 * Returns true if cookie was set, false if existing hc_ref prevented overwrite.
 */
export function setReferralCookie(code: string): boolean {
  if (typeof window === 'undefined') return false;

  const existing = getReferralCodeFromCookie();
  if (existing) {
    return false;
  }

  const expires = referralCookieExpiryDate();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const value = encodeURIComponent(code.trim());

  document.cookie = `${REFERRAL_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
  return true;
}

/**
 * @deprecated Niet gebruiken voor chat of gebruikersberichten — alleen voor expliciete
 * marketing-/deel-UI waar de gebruiker verwacht dat een link wordt toegevoegd.
 */
export function appendAffiliateReferralToOutgoingText(
  text: string,
  referralCode: string | null | undefined,
  origin?: string,
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

export function getReferralCodeFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = parseCookieHeader(document.cookie);
  return cookies[REFERRAL_COOKIE_NAME] || null;
}

/**
 * Resolve attribution id for BusinessSubscription / Stripe checkout metadata.
 * Uses existing signup attribution (ref link or promo) within revenue window.
 */
export async function resolveSubscriptionAttributionId(userId: string): Promise<string | null> {
  const now = new Date();
  const attribution = await prisma.attribution.findFirst({
    where: {
      userId,
      type: {
        in: [AttributionType.USER_SIGNUP, AttributionType.BUSINESS_SIGNUP],
      },
      endsAt: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return attribution?.id ?? null;
}

/**
 * Process attribution on user signup
 */
export async function processAttributionOnSignup(
  userId: string,
  cookieHeader: string | null,
  isBusiness: boolean = false,
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

    const affiliateCode = getAffiliateIdFromCookie(cookieHeader);
    if (!affiliateCode) {
      return;
    }

    const affiliateId = await getAffiliateIdFromCode(affiliateCode);
    if (!affiliateId) {
      return;
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { userId: true },
    });

    if (affiliate && affiliate.userId === userId) {
      console.warn('Self-referral detected, skipping attribution');
      return;
    }

    const type = isBusiness ? AttributionType.BUSINESS_SIGNUP : AttributionType.USER_SIGNUP;
    const source = hasAndroidBetaDownloadCookie(cookieHeader)
      ? AttributionSource.ANDROID_BETA_DOWNLOAD
      : AttributionSource.REF_LINK;
    await createAttribution(userId, affiliateId, type, source);
  } catch (error) {
    console.error('Error processing attribution on signup:', error);
  }
}

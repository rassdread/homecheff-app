/**
 * Prisma-free subscription promo helpers (safe for offline validators).
 */

export type SubscriptionPlanKey = 'BASIC' | 'PRO' | 'PREMIUM';

export const SUBSCRIPTION_PLAN_KEYS: SubscriptionPlanKey[] = ['BASIC', 'PRO', 'PREMIUM'];

export type PromoPricingQuote = {
  plan: SubscriptionPlanKey;
  basePriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  currency: 'eur';
  mode: 'platform_percent' | 'platform_fixed' | 'affiliate_commission_share';
  isPlatform: boolean;
};

/** Reject client-forged discount payloads — only a code string is accepted. */
export function extractPromoCodeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const code = b.promoCode ?? b.code;
  if (typeof code !== 'string') return undefined;
  const trimmed = code.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizePromoCodeInput(code: unknown): string {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

/**
 * Premium-beschikbaarheid voor externe contactkanalen (Fase 3A).
 * Gating blijft uit tot subscription-data betrouwbaar én feature flag aan staat.
 */

export type ContactPremiumAvailability = {
  /** Subscription-status is betrouwbaar genoeg om te gaten (geen fake lock). */
  gatingReliable: boolean;
  /** Maker heeft actief premium/abonnement voor contactkanalen. */
  hasPremiumContact: boolean;
  /** Feature flag — standaard uit; Fase 3B kan inschakelen. */
  gatingEnabled: boolean;
};

export type SellerProfilePremiumSignals = {
  subscriptionId?: string | null;
  subscriptionValidUntil?: Date | string | null;
  stripeSubscriptionId?: string | null;
} | null | undefined;

/** Standaard: geen gating — gedrag Fase 2A/2B. */
export const CONTACT_PREMIUM_GATING_OFF: ContactPremiumAvailability = {
  gatingReliable: false,
  hasPremiumContact: false,
  gatingEnabled: false,
};

function parseValidUntil(raw: Date | string | null | undefined): Date | null {
  if (raw == null) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Bepaal of premium-gating veilig mag worden toegepast.
 * Zonder betrouwbare subscription-data: nooit locken (gatingReliable = false).
 */
export function resolveContactPremiumAvailability(
  sellerProfile: SellerProfilePremiumSignals,
): ContactPremiumAvailability {
  const gatingEnabled = process.env.CONTACT_PREMIUM_GATING_ENABLED === 'true';

  const subscriptionId = sellerProfile?.subscriptionId?.trim();
  const stripeSubscriptionId = sellerProfile?.stripeSubscriptionId?.trim();
  const validUntil = parseValidUntil(sellerProfile?.subscriptionValidUntil);

  const hasAuthoritativeSubscription =
    !!subscriptionId && validUntil !== null;
  const hasStripeSubscription =
    !!stripeSubscriptionId && validUntil !== null;

  const gatingReliable = hasAuthoritativeSubscription || hasStripeSubscription;

  const hasPremiumContact =
    gatingReliable && validUntil !== null && validUntil.getTime() > Date.now();

  return {
    gatingReliable,
    hasPremiumContact,
    gatingEnabled,
  };
}

/** Extern kanaal premium-locked — alleen als gating betrouwbaar én actief én geen premium. */
export function isExternalContactPremiumLocked(
  premium: ContactPremiumAvailability,
): boolean {
  if (!premium.gatingEnabled || !premium.gatingReliable) return false;
  return !premium.hasPremiumContact;
}

/** Kanalen die in Fase 3B premium kunnen worden (chat uitgesloten). */
export const PREMIUM_CAPABLE_CONTACT_FIELDS = [
  'phone',
  'whatsapp',
  'instagram',
  'facebook',
  'tiktok',
  'website',
  'telegram',
] as const;

export type PremiumCapableContactField = (typeof PREMIUM_CAPABLE_CONTACT_FIELDS)[number];

/** Publieke samenvatting voor settings-API — geen subscription-IDs. */
export function toContactPremiumReadinessSummary(
  premium: ContactPremiumAvailability,
) {
  return {
    gatingReliable: premium.gatingReliable,
    gatingEnabled: premium.gatingEnabled,
    hasPremiumContact: premium.hasPremiumContact,
    externalChannelsPremiumCapable: true,
  };
}

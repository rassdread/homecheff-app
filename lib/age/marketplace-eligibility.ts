/**
 * Server-side marketplace eligibility by canonical DOB.
 *
 * Missing DOB on an existing seller/Stripe user stays on the adult path
 * (legacy). New seller, Stripe and listing actions without a DOB fail closed.
 * Proven age under 13 cannot sell or start Stripe. Ages 13–17 use the minor
 * rules. Age 18+ keeps the existing adult behaviour.
 *
 * Delivery is never granted here. Commercial delivery stays 18+ in
 * lib/delivery/delivery-age.ts.
 *
 * Categories that are not explicitly certified for minors fail closed.
 * Adult category availability is unchanged.
 */

import { isAtLeastCommercialDeliveryAge } from '@/lib/delivery/delivery-age';
import {
  isMinorBand,
  resolveAgeFromDob,
  type AgeBand,
} from '@/lib/age/age-band';

export type MarketplaceActivity =
  | 'REGISTER'
  | 'BROWSE'
  | 'BUY'
  | 'LIST_PRODUCT'
  | 'OFFER_SERVICE'
  | 'STRIPE_ONBOARDING'
  | 'RECEIVE_ORDERS'
  | 'PAYOUTS'
  | 'DELIVERY'
  | 'AFFILIATE';

/**
 * Accounts created before the first 13–17 production deploy may already sell
 * without a stored date of birth. A SellerProfile alone does not grant that
 * exception after this moment, so a new Google signup cannot skip the DOB.
 */
export const LEGACY_SELLER_WITHOUT_DOB_CUTOFF = new Date('2026-09-27T13:06:35.000Z');

export type AgeSubject = {
  dateOfBirth?: Date | string | null;
  stripeConnectAccountId?: string | null;
  sellerActivatedAt?: Date | string | null;
  sellerRoles?: string[] | null;
  hasSellerProfile?: boolean;
  /** Account createdAt. Required before a profile-only user can stay on the legacy adult path. */
  createdAt?: Date | string | null;
  country?: string | null;
};

export type AgeEnforcementMode =
  | 'LEGACY_ADULT'
  | 'DOB_REQUIRED'
  | 'BLOCKED_UNDER_13'
  | 'ADULT'
  | 'MINOR';

export type AgeEnforcement = {
  mode: AgeEnforcementMode;
  ageYears: number | null;
  band: AgeBand | null;
};

export type EligibilityCode =
  | 'OK'
  | 'DOB_REQUIRED'
  | 'UNDER_13'
  | 'CONSENT_REQUIRED'
  | 'CATEGORY_NOT_CERTIFIED'
  | 'DELIVERY_18_PLUS'
  | 'AFFILIATE_18_PLUS'
  | 'NL_ONLY'
  | 'BUSINESS_18_PLUS'
  | 'STRIPE_NOT_READY';

export type EligibilityDecision = {
  allowed: boolean;
  code: EligibilityCode;
  mode: AgeEnforcementMode;
  band: AgeBand | null;
  ageYears: number | null;
  messageNl: string;
  messageEn: string;
};

const OK_NL = '';
const OK_EN = '';

/** Explicitly certified for NL minors 13–17. Anything else fails closed. */
const MINOR_CERTIFIED_CATEGORIES = new Set([
  'GROW',
  'GROWN',
  'GARDEN',
  'DESIGN',
  'DESIGNER',
  'ARTISTIC_SERVICE',
]);

export function isNetherlandsCountry(country: string | null | undefined): boolean {
  const c = (country ?? 'NL').trim().toUpperCase();
  if (!c) return true;
  return c === 'NL' || c === 'NLD' || c === 'NETHERLANDS' || c === 'NEDERLAND';
}

export function normalizeListingCategory(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function isCategoryCertifiedForMinors(
  category: string | null | undefined,
): boolean {
  const key = normalizeListingCategory(category);
  return key.length > 0 && MINOR_CERTIFIED_CATEGORIES.has(key);
}

function profilePredatesDobRequirement(createdAt: Date | string | null | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() < LEGACY_SELLER_WITHOUT_DOB_CUTOFF.getTime();
}

export function resolveAgeEnforcement(
  subject: AgeSubject | null | undefined,
  now: Date = new Date(),
): AgeEnforcement {
  const resolved = resolveAgeFromDob(subject?.dateOfBirth, now);
  if (!resolved.ok) {
    const establishedSeller =
      Boolean(subject?.stripeConnectAccountId) ||
      Boolean(subject?.sellerActivatedAt) ||
      (subject?.sellerRoles?.length ?? 0) > 0;
    const legacyProfile =
      Boolean(subject?.hasSellerProfile) && profilePredatesDobRequirement(subject?.createdAt);
    if (establishedSeller || legacyProfile) {
      return { mode: 'LEGACY_ADULT', ageYears: null, band: null };
    }
    return { mode: 'DOB_REQUIRED', ageYears: null, band: null };
  }
  if (resolved.band === 'UNDER_13') {
    return {
      mode: 'BLOCKED_UNDER_13',
      ageYears: resolved.ageYears,
      band: resolved.band,
    };
  }
  if (resolved.band === 'AGE_18_PLUS') {
    return {
      mode: 'ADULT',
      ageYears: resolved.ageYears,
      band: resolved.band,
    };
  }
  return {
    mode: 'MINOR',
    ageYears: resolved.ageYears,
    band: resolved.band,
  };
}

function decision(
  partial: Omit<EligibilityDecision, 'messageNl' | 'messageEn'> & {
    messageNl?: string;
    messageEn?: string;
  },
): EligibilityDecision {
  return {
    messageNl: partial.messageNl ?? OK_NL,
    messageEn: partial.messageEn ?? OK_EN,
    ...partial,
  };
}

function under13(enforcement: AgeEnforcement): EligibilityDecision {
  return decision({
    allowed: false,
    code: 'UNDER_13',
    mode: enforcement.mode,
    band: enforcement.band,
    ageYears: enforcement.ageYears,
    messageNl:
      'HomeCheff-accounts en verkopen zijn beschikbaar vanaf 13 jaar.',
    messageEn: 'HomeCheff accounts and selling are available from age 13.',
  });
}

function dobRequired(enforcement: AgeEnforcement): EligibilityDecision {
  return decision({
    allowed: false,
    code: 'DOB_REQUIRED',
    mode: enforcement.mode,
    band: null,
    ageYears: null,
    messageNl:
      'Vul je echte geboortedatum in. We bepalen je mogelijkheden op HomeCheff daarmee.',
    messageEn:
      'Enter your real date of birth. HomeCheff uses it to decide what you can do.',
  });
}

function consentRequired(enforcement: AgeEnforcement): EligibilityDecision {
  return decision({
    allowed: false,
    code: 'CONSENT_REQUIRED',
    mode: enforcement.mode,
    band: enforcement.band,
    ageYears: enforcement.ageYears,
    messageNl:
      'Omdat je jonger bent dan 18, heeft HomeCheff eerst toestemming van een ouder of wettelijk vertegenwoordiger nodig voordat je kunt verkopen of betalingen kunt instellen.',
    messageEn:
      'Because you are under 18, HomeCheff needs permission from a parent or legal representative before you can sell or set up payments.',
  });
}

export function evaluateMarketplaceEligibility(input: {
  subject?: AgeSubject | null;
  activity: MarketplaceActivity;
  now?: Date;
  category?: string | null;
  /** HomeCheff parental consent record. Not sent to Stripe as a guardian. */
  parentalConsentActive?: boolean;
  /** PARTICULAR vs BUSINESS. Minors cannot start a company account. */
  connectTrack?: 'PARTICULAR' | 'BUSINESS' | null;
  /** When Stripe itself says the connected account can be paid out. */
  stripePayoutReady?: boolean;
}): EligibilityDecision {
  const now = input.now ?? new Date();
  const enforcement = resolveAgeEnforcement(input.subject, now);
  const base = {
    mode: enforcement.mode,
    band: enforcement.band,
    ageYears: enforcement.ageYears,
  };

  if (input.activity === 'BROWSE') {
    return decision({ allowed: true, code: 'OK', ...base });
  }

  if (input.activity === 'REGISTER') {
    if (enforcement.mode === 'DOB_REQUIRED' || enforcement.mode === 'LEGACY_ADULT') {
      return dobRequired(enforcement);
    }
    if (enforcement.mode === 'BLOCKED_UNDER_13') return under13(enforcement);
    return decision({ allowed: true, code: 'OK', ...base });
  }

  if (input.activity === 'BUY') {
    if (enforcement.mode === 'BLOCKED_UNDER_13') return under13(enforcement);
    return decision({ allowed: true, code: 'OK', ...base });
  }

  if (input.activity === 'DELIVERY') {
    const eligible = isAtLeastCommercialDeliveryAge(input.subject?.dateOfBirth, now);
    if (!eligible) {
      return decision({
        allowed: false,
        code: 'DELIVERY_18_PLUS',
        ...base,
        messageNl: 'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar.',
        messageEn: 'Delivery via HomeCheff is available from age 18.',
      });
    }
    return decision({ allowed: true, code: 'OK', ...base });
  }

  if (input.activity === 'AFFILIATE') {
    if (enforcement.mode === 'BLOCKED_UNDER_13') return under13(enforcement);
    if (enforcement.mode === 'MINOR') {
      return decision({
        allowed: false,
        code: 'AFFILIATE_18_PLUS',
        ...base,
        messageNl: 'Het affiliateprogramma is beschikbaar vanaf 18 jaar.',
        messageEn: 'The affiliate programme is available from age 18.',
      });
    }
    return decision({ allowed: true, code: 'OK', ...base });
  }

  if (input.activity === 'PAYOUTS') {
    if (enforcement.mode === 'BLOCKED_UNDER_13') return under13(enforcement);
    if (enforcement.mode === 'DOB_REQUIRED') return dobRequired(enforcement);
    if (enforcement.mode === 'MINOR' && !input.parentalConsentActive) {
      return consentRequired(enforcement);
    }
    if (input.stripePayoutReady === false) {
      return decision({
        allowed: false,
        code: 'OK',
        ...base,
        messageNl:
          'Uitbetalen kan zodra Stripe je account daarvoor heeft goedgekeurd.',
        messageEn: 'Payouts start once Stripe has approved your account for them.',
      });
    }
    return decision({ allowed: true, code: 'OK', ...base });
  }

  const selling =
    input.activity === 'LIST_PRODUCT' ||
    input.activity === 'OFFER_SERVICE' ||
    input.activity === 'STRIPE_ONBOARDING' ||
    input.activity === 'RECEIVE_ORDERS';

  if (!selling) {
    return decision({ allowed: false, code: 'UNDER_13', ...base });
  }

  if (enforcement.mode === 'BLOCKED_UNDER_13') return under13(enforcement);
  if (enforcement.mode === 'DOB_REQUIRED') return dobRequired(enforcement);

  if (enforcement.mode === 'MINOR') {
    if (!isNetherlandsCountry(input.subject?.country) && input.activity === 'STRIPE_ONBOARDING') {
      return decision({
        allowed: false,
        code: 'NL_ONLY',
        ...base,
        messageNl:
          'Verkopen met betaling voor 13 tot en met 17 jaar staat op dit moment alleen open voor Nederlandse accounts.',
        messageEn:
          'Paid selling for ages 13 through 17 is currently available only for Netherlands accounts.',
      });
    }
    if (input.activity === 'STRIPE_ONBOARDING' && input.connectTrack === 'BUSINESS') {
      return decision({
        allowed: false,
        code: 'BUSINESS_18_PLUS',
        ...base,
        messageNl:
          'Een bedrijfsaccount is beschikbaar vanaf 18 jaar. Je kunt HomeCheff als particulier gebruiken.',
        messageEn:
          'A business account is available from age 18. You can use HomeCheff as a private seller.',
      });
    }
    if (!input.parentalConsentActive) return consentRequired(enforcement);
    if (
      input.activity === 'LIST_PRODUCT' ||
      input.activity === 'OFFER_SERVICE' ||
      input.activity === 'RECEIVE_ORDERS'
    ) {
      if (!isCategoryCertifiedForMinors(input.category)) {
        return decision({
          allowed: false,
          code: 'CATEGORY_NOT_CERTIFIED',
          ...base,
          messageNl:
            'Deze categorie is nog niet beschikbaar onder 18 jaar. Kies een categorie die wel voor jouw leeftijd is toegestaan, zoals kweken, design of een creatieve dienst.',
          messageEn:
            'This category is not available under 18 yet. Choose a category that is allowed for your age, such as growing, design, or a creative service.',
        });
      }
    }
    if (input.activity === 'RECEIVE_ORDERS' && input.stripePayoutReady !== true) {
      return decision({
        allowed: false,
        code: 'STRIPE_NOT_READY',
        ...base,
        messageNl:
          'Nieuwe bestellingen via HomeCheff kunnen pas binnenkomen als betalingen zijn ingesteld.',
        messageEn: 'New HomeCheff orders can start once payments are set up.',
      });
    }
  }

  return decision({ allowed: true, code: 'OK', ...base });
}

export function minorNeedsParentalConsent(enforcement: AgeEnforcement): boolean {
  return enforcement.mode === 'MINOR' && isMinorBand(enforcement.band);
}

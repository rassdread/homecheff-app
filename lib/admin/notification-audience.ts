/**
 * Admin broadcast audience.
 *
 * Stripe payout status is the database cache on User:
 * stripeConnectAccountId + stripeConnectOnboardingCompleted.
 * Seller sales and delivery payouts use that same account.
 * deriveConnectAccountStatusFromDb maps the same three states:
 * no id → NOT_STARTED, id without completed onboarding → INCOMPLETE,
 * completed onboarding → PAYMENT_READY.
 * Live Stripe "pending verification" is not stored and is not inferred.
 *
 * Last activity is not selected. HomeCheff has no last-login field.
 * createdAt is account age only. updatedAt and lastLocationUpdate are not activity.
 */

import { DELIVERY_AGREEMENT_DOCUMENT_ID } from '@/lib/delivery/delivery-agreement';
import { isReservedNonMailboxEmail } from '@/lib/admin/user-population';
import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';

export const DELIVERY_AGREEMENT_VERSION = DELIVERY_AGREEMENT_DOCUMENT_ID;

export const LAST_ACTIVITY_SIGNAL = null;

export const ACTIVITY_UNAVAILABLE_MESSAGE =
  'Laatste activiteit kan niet worden gebruikt. HomeCheff slaat geen laatste login en geen laatste activiteit op. De registratiedatum is alleen de leeftijd van het account. updatedAt en lastLocationUpdate zijn geen activiteit. Accounts zonder geregistreerde activiteit zijn daardoor niet apart te selecteren. Deze keuze blijft geblokkeerd tot er een betrouwbaar activiteitsveld is.';

export type AudienceId = 'applicable' | 'all' | 'buyers' | 'sellers' | 'delivery';

export type PayoutConnectStatus = 'none' | 'incomplete' | 'ready' | 'review';

/** One list for every status that is not ready to pay out. Ready stays outside it. */
export type StripeAudienceFilter = PayoutConnectStatus | 'not_ready';

export type VerificationKind = 'email' | 'courier' | 'commerce_review';

export type VerificationStatus = 'verified' | 'unverified' | 'pending';

export type AccountStatusFilter = 'active' | 'blocked' | 'courier_blocked';

export type PendingStepId =
  | 'delivery_age'
  | 'delivery_pricing'
  | 'delivery_service_area'
  | 'delivery_availability'
  | 'delivery_company_name';

export type AudienceSelection = {
  audience: AudienceId;
  match: 'all' | 'any';
  stripe: StripeAudienceFilter | null;
  verification: { kind: VerificationKind; status: VerificationStatus } | null;
  agreementVersion: string | null;
  accountStatus: AccountStatusFilter | null;
  pendingStep: PendingStepId | null;
  excludeUserIds: string[];
};

export type AudienceCandidate = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  role: string;
  createdAt: Date | string;
  accountDeletedAt: Date | string | null;
  suspendedAt: Date | string | null;
  emailVerified: Date | string | null;
  buyerRoles: string[];
  sellerRoles: string[];
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  /** Empty current field plus another stored Connect trace. Not a payout account. */
  stripeLinkReview?: boolean;
  hasSellerProfile: boolean;
  commerceReviewState: string | null;
  delivery: null | {
    isVerified: boolean;
    isBlocked: boolean;
    isActive: boolean;
    agreementAcceptedAt: Date | string | null;
    agreementDocumentId: string | null;
    /** null = the activation checklist could not be evaluated. Not an open task. */
    activationMissing: string[] | null;
  };
  pushReachable: boolean;
};

export type AgreementState = 'open' | 'accepted' | 'unknown_version' | 'not_applicable';

const AUDIENCES = new Set<AudienceId>(['applicable', 'all', 'buyers', 'sellers', 'delivery']);
const STRIPE = new Set<StripeAudienceFilter>(['none', 'incomplete', 'ready', 'review', 'not_ready']);
const VERIFICATION_KINDS = new Set<VerificationKind>(['email', 'courier', 'commerce_review']);
const VERIFICATION_STATUS = new Set<VerificationStatus>(['verified', 'unverified', 'pending']);
const ACCOUNT_STATUS = new Set<AccountStatusFilter>(['active', 'blocked', 'courier_blocked']);
const PENDING = new Set<PendingStepId>([
  'delivery_age',
  'delivery_pricing',
  'delivery_service_area',
  'delivery_availability',
  'delivery_company_name',
]);

const PENDING_TO_MISSING: Record<PendingStepId, string[]> = {
  delivery_age: ['dateOfBirth', 'under18'],
  delivery_pricing: ['pricing'],
  delivery_service_area: ['serviceArea'],
  delivery_availability: ['availability'],
  delivery_company_name: ['companyDisplayName'],
};

export function auditMetaHasConnectAccount(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
  const record = meta as Record<string, unknown>;
  return ['oldStripeAccountId', 'newStripeAccountId', 'stripeAccountId'].some((key) => {
    const value = typeof record[key] === 'string' ? record[key].trim() : '';
    return value.startsWith('acct_');
  });
}

/** A hint never becomes the current payout account. It only marks an empty field for review. */
export function stripeLinkNeedsReview(input: {
  stripeConnectAccountId?: string | null;
  affiliateConnectAccountId?: string | null;
  payoutDestinationRecorded?: boolean;
  onboardingOrMigrationRecorded?: boolean;
}): boolean {
  if ((input.stripeConnectAccountId || '').trim()) return false;
  return Boolean(
    (input.affiliateConnectAccountId || '').trim()
      || input.payoutDestinationRecorded
      || input.onboardingOrMigrationRecorded,
  );
}

export function payoutConnectStatus(user: {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  stripeLinkReview?: boolean | null;
}): PayoutConnectStatus {
  const accountId = user.stripeConnectAccountId?.trim() || '';
  if (!accountId) return user.stripeLinkReview ? 'review' : 'none';
  if (user.stripeConnectOnboardingCompleted) return 'ready';
  return 'incomplete';
}

export function payoutConnectStatusLabel(status: PayoutConnectStatus, lang: UiLanguage = 'nl'): string {
  if (status === 'none') return uiCopy(lang, 'admin.notificationCenter.ui.payoutNone');
  if (status === 'review') return uiCopy(lang, 'admin.notificationCenter.ui.payoutReview');
  if (status === 'incomplete') return uiCopy(lang, 'admin.notificationCenter.ui.payoutIncomplete');
  return uiCopy(lang, 'admin.notificationCenter.ui.payoutReady');
}

export const STRIPE_NOT_READY_LABEL = 'Stripe nog niet gereed voor uitbetalingen';

/** Short names for the existing Stripe filters. The status codes stay the same. */
export function stripeChoiceLabel(status: StripeAudienceFilter, lang: UiLanguage = 'nl'): string {
  if (status === 'none') return uiCopy(lang, 'admin.notificationCenter.ui.stripeNone');
  if (status === 'incomplete') return uiCopy(lang, 'admin.notificationCenter.ui.stripeIncomplete');
  if (status === 'ready') return uiCopy(lang, 'admin.notificationCenter.ui.stripeReady');
  if (status === 'review') return uiCopy(lang, 'admin.notificationCenter.ui.stripeReview');
  return uiCopy(lang, 'admin.notificationCenter.ui.stripeNotReady');
}

/**
 * The stored agreement id stays the i18n key that was accepted.
 * Admins see this name. The key is not a version they can edit.
 */
export const DELIVERY_AGREEMENT_DISPLAY_NAME = 'Huidige bezorgovereenkomst';

export function agreementVersionLabel(version: string | null | undefined, lang: UiLanguage = 'nl'): string {
  if (!version) return uiCopy(lang, 'admin.notificationCenter.ui.noAgreementFilter');
  if (version === DELIVERY_AGREEMENT_VERSION) return uiCopy(lang, 'admin.notificationCenter.ui.agreementCurrent');
  return uiCopy(lang, 'admin.notificationCenter.ui.otherAgreement');
}

export function stripeStatusMatches(status: PayoutConnectStatus, filter: StripeAudienceFilter): boolean {
  if (filter === 'not_ready') return status !== 'ready';
  return status === filter;
}

/** Review stays visible, but a bulk select must not include it. */
export function requiresExplicitStripeCheck(user: {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  stripeLinkReview?: boolean | null;
}): boolean {
  return payoutConnectStatus(user) === 'review';
}

export type StripeStatusCounts = {
  none: number;
  incomplete: number;
  review: number;
  ready: number;
  unique: number;
};

export function countStripeStatuses(
  users: ReadonlyArray<{
    stripeConnectAccountId?: string | null;
    stripeConnectOnboardingCompleted?: boolean | null;
    stripeLinkReview?: boolean | null;
  }>,
): StripeStatusCounts {
  const counts: StripeStatusCounts = { none: 0, incomplete: 0, review: 0, ready: 0, unique: users.length };
  for (const user of users) counts[payoutConnectStatus(user)] += 1;
  return counts;
}

export function stripeCountLines(counts: StripeStatusCounts, filter: StripeAudienceFilter | null, lang: UiLanguage = 'nl'): string[] {
  if (filter !== 'not_ready') return [];
  const lines = [
    uiCopy(lang, 'admin.notificationCenter.ui.countLine', { label: payoutConnectStatusLabel('none', lang), count: counts.none }),
    uiCopy(lang, 'admin.notificationCenter.ui.countLine', { label: payoutConnectStatusLabel('incomplete', lang), count: counts.incomplete }),
    uiCopy(lang, 'admin.notificationCenter.ui.countReview', { label: payoutConnectStatusLabel('review', lang), count: counts.review }),
    uiCopy(lang, 'admin.notificationCenter.ui.countUnique', { unique: counts.unique, ready: payoutConnectStatusLabel('ready', lang) }),
  ];
  const open = counts.none + counts.incomplete + counts.review;
  if (counts.unique !== open) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.countOther', { count: counts.unique - open }));
  }
  return lines;
}

export function explicitReviewBlock(
  users: ReadonlyArray<{
    id: string;
    stripeConnectAccountId?: string | null;
    stripeConnectOnboardingCompleted?: boolean | null;
    stripeLinkReview?: boolean | null;
  }>,
  explicitIds: readonly string[] | null | undefined,
  lang: UiLanguage = 'nl',
): string | null {
  const explicit = new Set(
    (explicitIds ?? [])
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );
  const blocked = users.some((user) => requiresExplicitStripeCheck(user) && !explicit.has(user.id));
  if (!blocked) return null;
  return uiCopy(lang, 'admin.notificationCenter.ui.explicitReviewError');
}

export function isBuyerCandidate(user: Pick<AudienceCandidate, 'role' | 'buyerRoles'>): boolean {
  return user.role === 'BUYER' || user.buyerRoles.length > 0;
}

export function isSellerCandidate(
  user: Pick<AudienceCandidate, 'role' | 'sellerRoles' | 'hasSellerProfile'>,
): boolean {
  return user.role === 'SELLER' || user.sellerRoles.length > 0 || user.hasSellerProfile;
}

export function isDeliveryCandidate(
  user: Pick<AudienceCandidate, 'role' | 'delivery'>,
): boolean {
  return user.role === 'DELIVERY' || user.delivery != null;
}

function isStaffRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function inAudience(user: AudienceCandidate, audience: AudienceId): boolean {
  if (user.accountDeletedAt) return false;
  if (isReservedNonMailboxEmail(user.email)) return false;
  if (audience === 'all') return !isStaffRole(user.role);
  if (audience === 'buyers') return isBuyerCandidate(user);
  if (audience === 'sellers') return isSellerCandidate(user);
  if (audience === 'delivery') return isDeliveryCandidate(user);
  return false;
}

/** Staff join Alle toepasselijke rollen only through a role-bound filter, not through a status that selects everyone. */
function staffFitsApplicableFilters(user: AudienceCandidate, selection: AudienceSelection): boolean {
  const courier = Boolean(
    selection.agreementVersion
      || selection.pendingStep
      || selection.accountStatus === 'courier_blocked'
      || selection.verification?.kind === 'courier',
  );
  const commerce = selection.verification?.kind === 'commerce_review';
  const payout = Boolean(selection.stripe);
  if (!courier && !commerce && !payout) return false;
  if (payout && (isSellerCandidate(user) || isDeliveryCandidate(user))) return true;
  if (courier && isDeliveryCandidate(user)) return true;
  if (commerce && isSellerCandidate(user)) return true;
  return false;
}

export function agreementState(
  user: AudienceCandidate,
  version: string = DELIVERY_AGREEMENT_VERSION,
): AgreementState {
  const delivery = user.delivery;
  if (!delivery) return 'not_applicable';
  const accepted = delivery.agreementAcceptedAt != null;
  const documentId = delivery.agreementDocumentId?.trim() || '';
  if (!accepted && !documentId) return 'open';
  if (accepted && documentId === version) return 'accepted';
  if (accepted && !documentId) return 'unknown_version';
  if (documentId && documentId !== version) return 'open';
  return 'open';
}

export function agreementStateLabel(state: AgreementState, lang: UiLanguage = 'nl'): string {
  if (state === 'open') return uiCopy(lang, 'admin.notificationCenter.ui.agreementOpenState');
  if (state === 'accepted') return uiCopy(lang, 'admin.notificationCenter.ui.agreementAccepted');
  if (state === 'unknown_version') return uiCopy(lang, 'admin.notificationCenter.ui.agreementUnknown');
  return uiCopy(lang, 'admin.notificationCenter.ui.noDeliveryProfile');
}

function verificationMatches(user: AudienceCandidate, filter: NonNullable<AudienceSelection['verification']>): boolean {
  if (filter.kind === 'email') {
    const verified = user.emailVerified != null;
    if (filter.status === 'verified') return verified;
    if (filter.status === 'unverified') return !verified;
    return false;
  }
  if (filter.kind === 'courier') {
    if (!user.delivery) return false;
    if (filter.status === 'verified') return user.delivery.isVerified;
    if (filter.status === 'unverified') return !user.delivery.isVerified;
    return false;
  }
  const state = user.commerceReviewState;
  if (filter.status === 'verified') return state === 'REVIEWED';
  if (filter.status === 'unverified') return state === 'REVIEW_REQUIRED';
  if (filter.status === 'pending') return state === 'UNDER_REVIEW';
  return false;
}

function pendingStepMatches(user: AudienceCandidate, step: PendingStepId): boolean {
  const missing = user.delivery?.activationMissing;
  if (!missing) return false;
  return PENDING_TO_MISSING[step].some((key) => missing.includes(key));
}

function selectedFilters(selection: AudienceSelection): Array<(user: AudienceCandidate) => boolean> {
  const filters: Array<(user: AudienceCandidate) => boolean> = [];
  if (selection.stripe) {
    const expected = selection.stripe;
    filters.push((user) => {
      if (selection.audience === 'applicable' && !isSellerCandidate(user) && !isDeliveryCandidate(user)) {
        return false;
      }
      return stripeStatusMatches(payoutConnectStatus(user), expected);
    });
  }
  if (selection.verification) {
    const verification = selection.verification;
    filters.push((user) => verificationMatches(user, verification));
  }
  if (selection.agreementVersion) {
    const version = selection.agreementVersion;
    filters.push((user) => agreementState(user, version) === 'open');
  }
  if (selection.accountStatus === 'active') {
    filters.push((user) => user.suspendedAt == null);
  } else if (selection.accountStatus === 'blocked') {
    filters.push((user) => user.suspendedAt != null);
  } else if (selection.accountStatus === 'courier_blocked') {
    filters.push((user) => user.delivery?.isBlocked === true);
  }
  if (selection.pendingStep) {
    const step = selection.pendingStep;
    filters.push((user) => pendingStepMatches(user, step));
  }
  return filters;
}

export function selectionHasStatusFilter(selection: AudienceSelection): boolean {
  return Boolean(
    selection.stripe
      || selection.verification
      || selection.agreementVersion
      || selection.accountStatus
      || selection.pendingStep,
  );
}

/** Applicable roles without a status filter must not become a send to everyone. */
export function selectionCanList(selection: AudienceSelection): boolean {
  if (selection.audience === 'applicable') return selectionHasStatusFilter(selection);
  return true;
}

export function matchesAudience(user: AudienceCandidate, selection: AudienceSelection): boolean {
  if (user.accountDeletedAt) return false;
  if (isReservedNonMailboxEmail(user.email)) return false;
  if (selection.excludeUserIds.includes(user.id)) return false;
  if (selection.audience === 'all') {
    if (isStaffRole(user.role)) return false;
  } else if (selection.audience === 'applicable') {
    if (isStaffRole(user.role) && !staffFitsApplicableFilters(user, selection)) return false;
  } else if (!inAudience(user, selection.audience)) {
    return false;
  }
  const filters = selectedFilters(selection);
  if (filters.length === 0) return selection.audience !== 'applicable';
  if (selection.match === 'any') return filters.some((filter) => filter(user));
  return filters.every((filter) => filter(user));
}

function audienceMembershipLabel(audience: AudienceId, lang: UiLanguage): string {
  if (audience === 'buyers') return uiCopy(lang, 'admin.notificationCenter.ui.reasonBuyers');
  if (audience === 'sellers') return uiCopy(lang, 'admin.notificationCenter.ui.reasonSellers');
  if (audience === 'delivery') return uiCopy(lang, 'admin.notificationCenter.ui.reasonCouriers');
  return uiCopy(lang, 'admin.notificationCenter.ui.reasonEveryone');
}

/** Status labels that explain why a matching user is in the filter list. */
export function inclusionReasons(user: AudienceCandidate, selection: AudienceSelection, lang: UiLanguage = 'nl'): string[] {
  const reasons: string[] = [];
  if (selection.stripe && stripeStatusMatches(payoutConnectStatus(user), selection.stripe)) {
    reasons.push(payoutConnectStatusLabel(payoutConnectStatus(user), lang));
  }
  if (selection.verification && verificationMatches(user, selection.verification)) {
    reasons.push(verificationFilterLabel(selection.verification, lang));
  }
  if (selection.agreementVersion && agreementState(user, selection.agreementVersion) === 'open') {
    reasons.push(uiCopy(lang, 'admin.notificationCenter.ui.agreementOpenState'));
  }
  if (selection.accountStatus === 'active' && user.suspendedAt == null) {
    reasons.push(accountStatusLabel('active', lang));
  } else if (selection.accountStatus === 'blocked' && user.suspendedAt != null) {
    reasons.push(accountStatusLabel('blocked', lang));
  } else if (selection.accountStatus === 'courier_blocked' && user.delivery?.isBlocked === true) {
    reasons.push(accountStatusLabel('courier_blocked', lang));
  }
  if (selection.pendingStep && pendingStepMatches(user, selection.pendingStep)) {
    reasons.push(pendingStepLabel(selection.pendingStep, lang));
  }
  if (reasons.length === 0) reasons.push(audienceMembershipLabel(selection.audience, lang));
  return reasons;
}

export function checkedRecipients<T extends { id: string }>(
  matched: readonly T[],
  includeUserIds: readonly string[] | null | undefined,
  lang: UiLanguage = 'nl',
): { ok: true; recipients: T[] } | { ok: false; code: 'none' | 'outside'; error: string } {
  const requested = [
    ...new Set(
      (includeUserIds ?? [])
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  ];
  if (requested.length === 0) {
    return { ok: false, code: 'none', error: uiCopy(lang, 'admin.notificationCenter.ui.checkOne') };
  }
  const matchedIds = new Set(matched.map((user) => user.id));
  if (requested.some((id) => !matchedIds.has(id))) {
    return {
      ok: false,
      code: 'outside',
      error: uiCopy(lang, 'admin.notificationCenter.ui.checkOutside'),
    };
  }
  const wanted = new Set(requested);
  return { ok: true, recipients: matched.filter((user) => wanted.has(user.id)) };
}

export function audienceRoleLabels(user: AudienceCandidate, lang: UiLanguage = 'nl'): string[] {
  const labels: string[] = [];
  if (user.role === 'SUPERADMIN') labels.push(uiCopy(lang, 'admin.notificationCenter.ui.roleSuperadmin'));
  else if (user.role === 'ADMIN') labels.push(uiCopy(lang, 'admin.notificationCenter.ui.roleAdmin'));
  if (isBuyerCandidate(user)) labels.push(uiCopy(lang, 'admin.notificationCenter.ui.roleBuyer'));
  if (isSellerCandidate(user)) labels.push(uiCopy(lang, 'admin.notificationCenter.ui.roleSeller'));
  if (isDeliveryCandidate(user)) labels.push(uiCopy(lang, 'admin.notificationCenter.ui.roleCourier'));
  if (labels.length === 0) labels.push(user.role || uiCopy(lang, 'admin.notificationCenter.ui.roleUser'));
  return labels;
}

export function emptySelection(audience: AudienceId): AudienceSelection {
  return {
    audience,
    match: 'all',
    stripe: null,
    verification: null,
    agreementVersion: null,
    accountStatus: null,
    pendingStep: null,
    excludeUserIds: [],
  };
}

export type AudiencePreset = {
  id: string;
  label: string;
  description: string;
  available: boolean;
  reason: string | null;
  selection: AudienceSelection | null;
};

export const AUDIENCE_PRESETS: AudiencePreset[] = [
  {
    id: 'delivery_stripe_none',
    label: 'Bezorgers: Stripe niet gekoppeld',
    description: 'Nog geen Stripe-account. Verkoop en bezorging delen hetzelfde account.',
    available: true,
    reason: null,
    selection: { ...emptySelection('delivery'), stripe: 'none' },
  },
  {
    id: 'delivery_stripe_incomplete',
    label: 'Bezorgers: Stripe nog niet afgerond',
    description: 'Stripe is gestart, de uitbetaling is nog niet afgerond.',
    available: true,
    reason: null,
    selection: { ...emptySelection('delivery'), stripe: 'incomplete' },
  },
  {
    id: 'delivery_stripe_ready',
    label: 'Bezorgers: Stripe afgerond',
    description: 'Het gedeelde Stripe-account is gereed voor uitbetalingen.',
    available: true,
    reason: null,
    selection: { ...emptySelection('delivery'), stripe: 'ready' },
  },
  {
    id: 'delivery_agreement_open',
    label: 'Bezorgers: overeenkomst nog open',
    description: 'De getoonde bezorgovereenkomst is nog niet geaccepteerd.',
    available: true,
    reason: null,
    selection: { ...emptySelection('delivery'), agreementVersion: DELIVERY_AGREEMENT_VERSION },
  },
  {
    id: 'sellers_without_stripe',
    label: 'Verkopers: Stripe niet gekoppeld',
    description: 'Verkopers zonder Stripe-account op hun profiel.',
    available: true,
    reason: null,
    selection: { ...emptySelection('sellers'), stripe: 'none' },
  },
  {
    id: 'buyers_inactive_60',
    label: 'Kopers die 60 dagen niet actief zijn',
    description: 'Laatste activiteit wordt niet bijgehouden.',
    available: false,
    reason: 'Laatste activiteit is niet beschikbaar. Registratiedatum, updatedAt en locatie-updates tellen niet mee.',
    selection: null,
  },
];

export const UNAVAILABLE_AUDIENCE_FACTS: string[] = [
  ACTIVITY_UNAVAILABLE_MESSAGE,
  'Accountstatus inactief bestaat niet. Geblokkeerd is suspendedAt. Bezorger geblokkeerd is DeliveryProfile.isBlocked. Hoe lang iemand offline is, is geen accountstatus.',
  'Stripe-verificatie in behandeling staat niet in HomeCheff. Connect onvolledig betekent alleen: er is een stripeConnectAccountId en stripeConnectOnboardingCompleted is false.',
  'HomeCheff-e-mailverificatie is emailVerified. Daar is geen status in behandeling.',
  'Bezorgerverificatie is DeliveryProfile.isVerified. Daar is geen status in behandeling. Een ontbrekend bezorgprofiel telt niet als niet-geverifieerd.',
  'termsAccepted, privacyPolicyAccepted, taxResponsibilityAccepted en messageGuidelinesAccepted hebben geen versie en zijn niet selecteerbaar.',
  'Verkoopuitbetalingen en bezorguitbetalingen gebruiken hetzelfde User.stripeConnectAccountId. Er is geen tweede Connect-account voor bezorgers.',
  'Een onbekende activatiecontrole of een acceptatie zonder documentversie wordt niet automatisch een openstaande taak.',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseAudienceSelection(
  value: unknown,
  lang: UiLanguage = 'nl',
): { ok: true; selection: AudienceSelection } | { ok: false; error: string } {
  const error = (key: string) => uiCopy(lang, `admin.notificationCenter.ui.${key}`);
  if (!isRecord(value)) {
    return { ok: false, error: error('chooseAudience') };
  }
  if ('activityDays' in value && value.activityDays != null) {
    return { ok: false, error: error('activityUnavailable') };
  }
  const audience = value.audience;
  if (typeof audience !== 'string' || !AUDIENCES.has(audience as AudienceId)) {
    return { ok: false, error: error('chooseRole') };
  }
  const match = value.match == null ? 'all' : value.match;
  if (match !== 'all' && match !== 'any') {
    return { ok: false, error: error('chooseMatch') };
  }
  let stripe: StripeAudienceFilter | null = null;
  if (value.stripe != null) {
    if (typeof value.stripe !== 'string' || !STRIPE.has(value.stripe as StripeAudienceFilter)) {
      return {
        ok: false,
        error: error('unknownStripe'),
      };
    }
    stripe = value.stripe as StripeAudienceFilter;
  }
  let verification: AudienceSelection['verification'] = null;
  if (value.verification != null) {
    if (!isRecord(value.verification)) {
      return { ok: false, error: error('badVerification') };
    }
    const kind = value.verification.kind;
    const status = value.verification.status;
    if (typeof kind !== 'string' || !VERIFICATION_KINDS.has(kind as VerificationKind)) {
      return { ok: false, error: error('unknownVerification') };
    }
    if (typeof status !== 'string' || !VERIFICATION_STATUS.has(status as VerificationStatus)) {
      return { ok: false, error: error('unknownVerificationStatus') };
    }
    if (status === 'pending' && kind !== 'commerce_review') {
      return {
        ok: false,
        error: kind === 'email' ? error('emailNoPending') : error('courierNoPending'),
      };
    }
    verification = { kind: kind as VerificationKind, status: status as VerificationStatus };
  }
  let agreementVersion: string | null = null;
  if (value.agreementVersion != null) {
    if (value.agreementVersion !== DELIVERY_AGREEMENT_VERSION) {
      return {
        ok: false,
        error: error('agreementVersionOnly'),
      };
    }
    agreementVersion = DELIVERY_AGREEMENT_VERSION;
  }
  let accountStatus: AccountStatusFilter | null = null;
  if (value.accountStatus != null) {
    if (typeof value.accountStatus !== 'string' || !ACCOUNT_STATUS.has(value.accountStatus as AccountStatusFilter)) {
      return {
        ok: false,
        error: error('unknownAccount'),
      };
    }
    accountStatus = value.accountStatus as AccountStatusFilter;
  }
  let pendingStep: PendingStepId | null = null;
  if (value.pendingStep != null) {
    if (typeof value.pendingStep !== 'string' || !PENDING.has(value.pendingStep as PendingStepId)) {
      return { ok: false, error: error('unknownStep') };
    }
    pendingStep = value.pendingStep as PendingStepId;
  }
  const excludeUserIds = Array.isArray(value.excludeUserIds)
    ? [...new Set(value.excludeUserIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    : [];
  if (excludeUserIds.length > 5000) {
    return { ok: false, error: error('tooManyExclusions') };
  }
  return {
    ok: true,
    selection: {
      audience: audience as AudienceId,
      match,
      stripe,
      verification,
      agreementVersion,
      accountStatus,
      pendingStep,
      excludeUserIds,
    },
  };
}

export function audienceLabel(audience: AudienceId, lang: UiLanguage = 'nl'): string {
  if (audience === 'applicable') return uiCopy(lang, 'admin.notificationCenter.ui.audienceLongApplicable');
  if (audience === 'all') return uiCopy(lang, 'admin.notificationCenter.ui.audienceLongAll');
  if (audience === 'buyers') return uiCopy(lang, 'admin.notificationCenter.ui.audienceLongBuyers');
  if (audience === 'sellers') return uiCopy(lang, 'admin.notificationCenter.ui.audienceLongSellers');
  return uiCopy(lang, 'admin.notificationCenter.ui.audienceLongDelivery');
}

export function stripeFilterLabel(status: StripeAudienceFilter, audience: AudienceId, lang: UiLanguage = 'nl'): string {
  const payout = uiCopy(
    lang,
    audience === 'delivery'
      ? 'admin.notificationCenter.ui.payoutWordDelivery'
      : audience === 'sellers'
        ? 'admin.notificationCenter.ui.payoutWordSellers'
        : audience === 'applicable'
          ? 'admin.notificationCenter.ui.payoutWordBoth'
          : 'admin.notificationCenter.ui.payoutWordUser',
  );
  if (status === 'not_ready') {
    return uiCopy(lang, 'admin.notificationCenter.ui.stripeNotReadyFor', {
      label: uiCopy(lang, 'admin.notificationCenter.ui.stripeNotReadyPayout'),
      payout,
    });
  }
  return uiCopy(lang, 'admin.notificationCenter.ui.stripeStatusFor', {
    status: payoutConnectStatusLabel(status, lang),
    payout,
  });
}

export function verificationFilterLabel(filter: NonNullable<AudienceSelection['verification']>, lang: UiLanguage = 'nl'): string {
  const kind = uiCopy(
    lang,
    filter.kind === 'email'
      ? 'admin.notificationCenter.ui.verificationEmail'
      : filter.kind === 'courier'
        ? 'admin.notificationCenter.ui.verificationCourier'
        : 'admin.notificationCenter.ui.verificationSales',
  );
  const status = uiCopy(
    lang,
    filter.status === 'verified'
      ? 'admin.notificationCenter.ui.statusVerified'
      : filter.status === 'unverified'
        ? 'admin.notificationCenter.ui.statusUnverified'
        : 'admin.notificationCenter.ui.statusPending',
  );
  return `${kind}: ${status}`;
}

export function accountStatusLabel(status: AccountStatusFilter, lang: UiLanguage = 'nl'): string {
  if (status === 'active') return uiCopy(lang, 'admin.notificationCenter.ui.accountActiveLong');
  if (status === 'blocked') return uiCopy(lang, 'admin.notificationCenter.ui.accountBlockedLong');
  return uiCopy(lang, 'admin.notificationCenter.ui.courierBlockedLong');
}

export function pendingStepLabel(step: PendingStepId, lang: UiLanguage = 'nl'): string {
  const keys: Record<PendingStepId, string> = {
    delivery_age: 'admin.notificationCenter.ui.pendingAgeLong',
    delivery_pricing: 'admin.notificationCenter.ui.pendingPriceLong',
    delivery_service_area: 'admin.notificationCenter.ui.pendingAreaLong',
    delivery_availability: 'admin.notificationCenter.ui.pendingAvailabilityLong',
    delivery_company_name: 'admin.notificationCenter.ui.pendingCompanyLong',
  };
  return uiCopy(lang, keys[step]);
}

export type SelectionFilterChip = { id: 'stripe' | 'verification' | 'agreement' | 'account' | 'pending'; label: string };

export function selectionFilterChips(selection: AudienceSelection, lang: UiLanguage = 'nl'): SelectionFilterChip[] {
  const text = (key: string) => uiCopy(lang, `admin.notificationCenter.ui.${key}`);
  const chips: SelectionFilterChip[] = [];
  if (selection.stripe) chips.push({ id: 'stripe', label: stripeChoiceLabel(selection.stripe, lang) });
  if (selection.verification) {
    const filter = selection.verification;
    const label = filter.kind === 'email'
      ? (filter.status === 'verified' ? text('emailVerified') : text('emailUnverified'))
      : filter.kind === 'courier'
        ? (filter.status === 'verified' ? text('courierVerified') : text('courierUnverified'))
        : filter.status === 'verified'
          ? text('salesReviewDone')
          : filter.status === 'pending'
            ? text('salesReviewPending')
            : text('salesReviewNeeded');
    chips.push({ id: 'verification', label });
  }
  if (selection.agreementVersion) chips.push({ id: 'agreement', label: text('agreementOpen') });
  if (selection.accountStatus === 'active') chips.push({ id: 'account', label: text('accountActiveChip') });
  if (selection.accountStatus === 'blocked') chips.push({ id: 'account', label: text('accountBlockedChip') });
  if (selection.accountStatus === 'courier_blocked') chips.push({ id: 'account', label: text('courierBlocked') });
  if (selection.pendingStep) {
    const short: Record<PendingStepId, string> = {
      delivery_age: text('pendingAgeMissing'),
      delivery_pricing: text('pendingPriceMissing'),
      delivery_service_area: text('pendingAreaMissing'),
      delivery_availability: text('pendingAvailabilityMissing'),
      delivery_company_name: text('pendingCompanyMissing'),
    };
    chips.push({ id: 'pending', label: short[selection.pendingStep] });
  }
  return chips;
}

export function selectionPlainSummary(selection: AudienceSelection, lang: UiLanguage = 'nl'): string {
  const who = uiCopy(
    lang,
    selection.audience === 'applicable'
      ? 'admin.notificationCenter.ui.whoApplicable'
      : selection.audience === 'all'
        ? 'admin.notificationCenter.ui.whoAll'
        : selection.audience === 'buyers'
          ? 'admin.notificationCenter.ui.whoBuyers'
          : selection.audience === 'sellers'
            ? 'admin.notificationCenter.ui.whoSellers'
            : 'admin.notificationCenter.ui.whoCouriers',
  );
  const chips = selectionFilterChips(selection, lang);
  if (selection.audience === 'applicable' && chips.length === 0) {
    return uiCopy(lang, 'admin.notificationCenter.ui.summaryApplicableEmpty');
  }
  if (selection.audience === 'all' && chips.length === 0) {
    return uiCopy(lang, 'admin.notificationCenter.ui.summaryAllEmpty');
  }
  if (chips.length === 0) {
    return uiCopy(lang, 'admin.notificationCenter.ui.summaryWho', { who });
  }
  const joiner = uiCopy(
    lang,
    selection.match === 'any' ? 'admin.notificationCenter.ui.joinerOr' : 'admin.notificationCenter.ui.joinerAnd',
  );
  return uiCopy(lang, 'admin.notificationCenter.ui.summaryWhoFilters', {
    who,
    filters: chips.map((chip) => chip.label).join(joiner),
  });
}

export function describeSelection(selection: AudienceSelection, lang: UiLanguage = 'nl'): string[] {
  const lines = [
    uiCopy(lang, 'admin.notificationCenter.ui.describeAudience', { label: audienceLabel(selection.audience, lang) }),
    selection.audience === 'applicable' && !selectionHasStatusFilter(selection)
      ? uiCopy(lang, 'admin.notificationCenter.ui.describeApplicableEmpty')
      : selection.match === 'all'
        ? uiCopy(lang, 'admin.notificationCenter.ui.describeMatchAll')
        : uiCopy(lang, 'admin.notificationCenter.ui.describeMatchAny'),
  ];
  if (selection.stripe) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeStripe', {
      label: stripeFilterLabel(selection.stripe, selection.audience, lang),
    }));
  }
  if (selection.stripe === 'not_ready' || selection.stripe === 'review') {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeReviewSkip'));
  }
  if (selection.verification) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeVerification', {
      label: verificationFilterLabel(selection.verification, lang),
    }));
  }
  if (selection.agreementVersion) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeAgreement', {
      label: agreementVersionLabel(selection.agreementVersion, lang),
    }));
  }
  if (selection.accountStatus) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeAccount', {
      label: accountStatusLabel(selection.accountStatus, lang),
    }));
  }
  if (selection.pendingStep) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describePending', {
      label: pendingStepLabel(selection.pendingStep, lang),
    }));
  }
  if (selection.excludeUserIds.length > 0) {
    lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeExcluded', { count: selection.excludeUserIds.length }));
  }
  lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeAge'));
  lines.push(uiCopy(lang, 'admin.notificationCenter.ui.describeStaff'));
  return lines;
}

export function canonicalSelection(selection: AudienceSelection): AudienceSelection {
  return {
    audience: selection.audience,
    match: selection.match,
    stripe: selection.stripe,
    verification: selection.verification
      ? { kind: selection.verification.kind, status: selection.verification.status }
      : null,
    agreementVersion: selection.agreementVersion,
    accountStatus: selection.accountStatus,
    pendingStep: selection.pendingStep,
    excludeUserIds: [...selection.excludeUserIds].sort(),
  };
}

export function previewCanonicalPayload(input: {
  selection: AudienceSelection;
  message: string;
  subject: string;
  title: string;
  route: string;
  sendNotification: boolean;
  sendEmail: boolean;
  confirmRepeat: boolean;
  recipientIds: string[];
  explicitReviewUserIds?: string[];
  manualAdmins?: Array<{ userId: string; channels: string[] }>;
}): string {
  return JSON.stringify({
    selection: canonicalSelection(input.selection),
    message: input.message,
    subject: input.subject,
    title: input.title,
    route: input.route,
    sendNotification: input.sendNotification,
    sendEmail: input.sendEmail,
    confirmRepeat: input.confirmRepeat,
    recipientIds: [...input.recipientIds].sort(),
    explicitReviewUserIds: [...(input.explicitReviewUserIds ?? [])].sort(),
    manualAdmins: [...(input.manualAdmins ?? [])]
      .map((admin) => ({ userId: admin.userId, channels: [...admin.channels].sort() }))
      .sort((left, right) => left.userId.localeCompare(right.userId)),
  });
}

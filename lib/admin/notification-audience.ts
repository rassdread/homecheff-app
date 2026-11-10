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

export const DELIVERY_AGREEMENT_VERSION = DELIVERY_AGREEMENT_DOCUMENT_ID;

export const LAST_ACTIVITY_SIGNAL = null;

export const ACTIVITY_UNAVAILABLE_MESSAGE =
  'Laatste activiteit kan niet worden gebruikt. HomeCheff slaat geen laatste login en geen laatste activiteit op. De registratiedatum is alleen de leeftijd van het account. updatedAt en lastLocationUpdate zijn geen activiteit. Accounts zonder geregistreerde activiteit zijn daardoor niet apart te selecteren. Deze keuze blijft geblokkeerd tot er een betrouwbaar activiteitsveld is.';

export type AudienceId = 'applicable' | 'all' | 'buyers' | 'sellers' | 'delivery';

export type PayoutConnectStatus = 'none' | 'incomplete' | 'ready' | 'review';

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
  stripe: PayoutConnectStatus | null;
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
const STRIPE = new Set<PayoutConnectStatus>(['none', 'incomplete', 'ready', 'review']);
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

export function payoutConnectStatusLabel(status: PayoutConnectStatus): string {
  if (status === 'none') return 'Geen actuele Stripe-koppeling in HomeCheff';
  if (status === 'review') return 'Stripe-koppeling controleren';
  if (status === 'incomplete') return 'Connect onvolledig';
  return 'Gereed voor uitbetalingen';
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

export function inAudience(user: AudienceCandidate, audience: AudienceId): boolean {
  if (user.accountDeletedAt) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') return false;
  if (audience === 'all') return true;
  if (audience === 'buyers') return isBuyerCandidate(user);
  if (audience === 'sellers') return isSellerCandidate(user);
  if (audience === 'delivery') return isDeliveryCandidate(user);
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

export function agreementStateLabel(state: AgreementState): string {
  if (state === 'open') return 'Bezorgovereenkomst staat open';
  if (state === 'accepted') return 'Bezorgovereenkomst geaccepteerd voor deze versie';
  if (state === 'unknown_version') return 'Acceptatie zonder versie';
  return 'Geen bezorgprofiel';
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
      return payoutConnectStatus(user) === expected;
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
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') return false;
  if (selection.excludeUserIds.includes(user.id)) return false;
  if (selection.audience !== 'applicable' && !inAudience(user, selection.audience)) return false;
  const filters = selectedFilters(selection);
  if (filters.length === 0) return selection.audience !== 'applicable';
  if (selection.match === 'any') return filters.some((filter) => filter(user));
  return filters.every((filter) => filter(user));
}

function audienceMembershipLabel(audience: AudienceId): string {
  if (audience === 'buyers') return 'Doelgroep kopers';
  if (audience === 'sellers') return 'Doelgroep verkopers';
  if (audience === 'delivery') return 'Doelgroep bezorgpartners';
  return 'Doelgroep iedereen';
}

/** Status labels that explain why a matching user is in the filter list. */
export function inclusionReasons(user: AudienceCandidate, selection: AudienceSelection): string[] {
  const reasons: string[] = [];
  if (selection.stripe && payoutConnectStatus(user) === selection.stripe) {
    reasons.push(payoutConnectStatusLabel(selection.stripe));
  }
  if (selection.verification && verificationMatches(user, selection.verification)) {
    reasons.push(verificationFilterLabel(selection.verification));
  }
  if (selection.agreementVersion && agreementState(user, selection.agreementVersion) === 'open') {
    reasons.push('Bezorgovereenkomst staat open');
  }
  if (selection.accountStatus === 'active' && user.suspendedAt == null) {
    reasons.push(accountStatusLabel('active'));
  } else if (selection.accountStatus === 'blocked' && user.suspendedAt != null) {
    reasons.push(accountStatusLabel('blocked'));
  } else if (selection.accountStatus === 'courier_blocked' && user.delivery?.isBlocked === true) {
    reasons.push(accountStatusLabel('courier_blocked'));
  }
  if (selection.pendingStep && pendingStepMatches(user, selection.pendingStep)) {
    reasons.push(pendingStepLabel(selection.pendingStep));
  }
  if (reasons.length === 0) reasons.push(audienceMembershipLabel(selection.audience));
  return reasons;
}

export function checkedRecipients<T extends { id: string }>(
  matched: readonly T[],
  includeUserIds: readonly string[] | null | undefined,
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
    return { ok: false, code: 'none', error: 'Vink minstens één ontvanger aan. Er is niets verstuurd.' };
  }
  const matchedIds = new Set(matched.map((user) => user.id));
  if (requested.some((id) => !matchedIds.has(id))) {
    return {
      ok: false,
      code: 'outside',
      error: 'Een aangevinkte gebruiker valt niet meer onder de filters. Vernieuw de lijst. Er is niets verstuurd.',
    };
  }
  const wanted = new Set(requested);
  return { ok: true, recipients: matched.filter((user) => wanted.has(user.id)) };
}

export function audienceRoleLabels(user: AudienceCandidate): string[] {
  const labels: string[] = [];
  if (isBuyerCandidate(user)) labels.push('Koper');
  if (isSellerCandidate(user)) labels.push('Verkoper');
  if (isDeliveryCandidate(user)) labels.push('Bezorger');
  if (labels.length === 0) labels.push(user.role || 'Gebruiker');
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
  available: boolean;
  reason: string | null;
  selection: AudienceSelection | null;
};

export const AUDIENCE_PRESETS: AudiencePreset[] = [
  {
    id: 'delivery_stripe_incomplete',
    label: 'Bezorgers met onvolledige Stripe Connect',
    available: true,
    reason: null,
    selection: { ...emptySelection('delivery'), stripe: 'incomplete' },
  },
  {
    id: 'sellers_without_stripe',
    label: 'Verkopers zonder Stripe',
    available: true,
    reason: null,
    selection: { ...emptySelection('sellers'), stripe: 'none' },
  },
  {
    id: 'buyers_inactive_60',
    label: 'Kopers die 60 dagen niet actief zijn',
    available: false,
    reason: ACTIVITY_UNAVAILABLE_MESSAGE,
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
): { ok: true; selection: AudienceSelection } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: 'Kies eerst een doelgroep. Een lege selectie kan niet worden verstuurd.' };
  }
  if ('activityDays' in value && value.activityDays != null) {
    return { ok: false, error: ACTIVITY_UNAVAILABLE_MESSAGE };
  }
  const audience = value.audience;
  if (typeof audience !== 'string' || !AUDIENCES.has(audience as AudienceId)) {
    return { ok: false, error: 'Kies Alle toepasselijke rollen, Alle gebruikers, kopers, verkopers of bezorgpartners.' };
  }
  const match = value.match == null ? 'all' : value.match;
  if (match !== 'all' && match !== 'any') {
    return { ok: false, error: 'Kies of ontvangers aan alle filters of aan minstens één filter moeten voldoen.' };
  }
  let stripe: PayoutConnectStatus | null = null;
  if (value.stripe != null) {
    if (typeof value.stripe !== 'string' || !STRIPE.has(value.stripe as PayoutConnectStatus)) {
      return { ok: false, error: 'Onbekende Stripe-status. Kies geen account, Connect onvolledig of gereed.' };
    }
    stripe = value.stripe as PayoutConnectStatus;
  }
  let verification: AudienceSelection['verification'] = null;
  if (value.verification != null) {
    if (!isRecord(value.verification)) {
      return { ok: false, error: 'De verificatiefilter is ongeldig.' };
    }
    const kind = value.verification.kind;
    const status = value.verification.status;
    if (typeof kind !== 'string' || !VERIFICATION_KINDS.has(kind as VerificationKind)) {
      return { ok: false, error: 'Onbekende verificatie. Kies e-mail, bezorgerprofiel of verkoopreview.' };
    }
    if (typeof status !== 'string' || !VERIFICATION_STATUS.has(status as VerificationStatus)) {
      return { ok: false, error: 'Onbekende verificatiestatus.' };
    }
    if (status === 'pending' && kind !== 'commerce_review') {
      return {
        ok: false,
        error:
          kind === 'email'
            ? 'HomeCheff-e-mailverificatie heeft geen status in behandeling.'
            : 'Bezorgerverificatie heeft geen status in behandeling.',
      };
    }
    verification = { kind: kind as VerificationKind, status: status as VerificationStatus };
  }
  let agreementVersion: string | null = null;
  if (value.agreementVersion != null) {
    if (value.agreementVersion !== DELIVERY_AGREEMENT_VERSION) {
      return {
        ok: false,
        error: 'Alleen de opgeslagen bezorgovereenkomstversie kan worden gekozen. Andere voorwaarden hebben geen versie.',
      };
    }
    agreementVersion = DELIVERY_AGREEMENT_VERSION;
  }
  let accountStatus: AccountStatusFilter | null = null;
  if (value.accountStatus != null) {
    if (typeof value.accountStatus !== 'string' || !ACCOUNT_STATUS.has(value.accountStatus as AccountStatusFilter)) {
      return {
        ok: false,
        error: 'Onbekende accountstatus. Inactief is niet vastgelegd. Kies actief, geblokkeerd of bezorger geblokkeerd.',
      };
    }
    accountStatus = value.accountStatus as AccountStatusFilter;
  }
  let pendingStep: PendingStepId | null = null;
  if (value.pendingStep != null) {
    if (typeof value.pendingStep !== 'string' || !PENDING.has(value.pendingStep as PendingStepId)) {
      return { ok: false, error: 'Onbekende openstaande stap. Alleen vastgelegde bezorgactivatie-stappen zijn kiesbaar.' };
    }
    pendingStep = value.pendingStep as PendingStepId;
  }
  const excludeUserIds = Array.isArray(value.excludeUserIds)
    ? [...new Set(value.excludeUserIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    : [];
  if (excludeUserIds.length > 5000) {
    return { ok: false, error: 'Er zijn te veel uitsluitingen.' };
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

export function audienceLabel(audience: AudienceId): string {
  if (audience === 'applicable') return 'Alle toepasselijke rollen';
  if (audience === 'all') return 'Alle gebruikers behalve beheerders en verwijderde accounts';
  if (audience === 'buyers') return 'Kopers (rol koper of koperrollen, ook bij een tweede rol)';
  if (audience === 'sellers') return 'Verkopers (verkopersrol, verkooprollen of verkoopprofiel, ook als iemand daarnaast bezorger is)';
  return 'Bezorgpartners (bezorgprofiel of bezorgrol, ook bij een tweede rol)';
}

export function stripeFilterLabel(status: PayoutConnectStatus, audience: AudienceId): string {
  const payout =
    audience === 'delivery'
      ? 'bezorguitbetalingen'
      : audience === 'sellers'
        ? 'verkoopuitbetalingen'
        : audience === 'applicable'
          ? 'verkoop- en bezorguitbetalingen'
          : 'het Stripe-account op de gebruiker';
  return `${payoutConnectStatusLabel(status)} voor ${payout}`;
}

export function verificationFilterLabel(filter: NonNullable<AudienceSelection['verification']>): string {
  const kind =
    filter.kind === 'email'
      ? 'HomeCheff-e-mailverificatie'
      : filter.kind === 'courier'
        ? 'Bezorgerverificatie (isVerified)'
        : 'Verkoopreview (commerceReviewState)';
  const status =
    filter.status === 'verified'
      ? 'geverifieerd'
      : filter.status === 'unverified'
        ? 'nog niet geverifieerd'
        : 'in behandeling';
  return `${kind}: ${status}`;
}

export function accountStatusLabel(status: AccountStatusFilter): string {
  if (status === 'active') return 'Account actief (niet geschorst)';
  if (status === 'blocked') return 'Account geblokkeerd (suspendedAt)';
  return 'Bezorger geblokkeerd (isBlocked)';
}

export function pendingStepLabel(step: PendingStepId): string {
  const labels: Record<PendingStepId, string> = {
    delivery_age: 'Bezorgactivatie: leeftijd ontbreekt volgens de bestaande controle',
    delivery_pricing: 'Bezorgactivatie: tarief ontbreekt volgens de bestaande controle',
    delivery_service_area: 'Bezorgactivatie: werkgebied ontbreekt volgens de bestaande controle',
    delivery_availability: 'Bezorgactivatie: beschikbaarheid ontbreekt volgens de bestaande controle',
    delivery_company_name: 'Bezorgactivatie: bedrijfsnaam ontbreekt volgens de bestaande controle',
  };
  return labels[step];
}

export function describeSelection(selection: AudienceSelection): string[] {
  const lines = [
    `Doelgroep: ${audienceLabel(selection.audience)}.`,
    selection.audience === 'applicable' && !selectionHasStatusFilter(selection)
      ? 'Alle toepasselijke rollen zonder statusfilter selecteert niemand.'
      : selection.match === 'all'
        ? 'Filters: een ontvanger moet aan alle gekozen filters voldoen. Een gekozen rol geldt daarbij.'
        : 'Filters: een ontvanger moet aan minstens één gekozen filter voldoen. Een gekozen rol geldt daarbij.',
  ];
  if (selection.stripe) lines.push(`Stripe: ${stripeFilterLabel(selection.stripe, selection.audience)}.`);
  if (selection.verification) lines.push(`Verificatie: ${verificationFilterLabel(selection.verification)}.`);
  if (selection.agreementVersion) {
    lines.push(
      `Openstaande acceptatie: bezorgovereenkomst ${selection.agreementVersion}. Alleen een opgeslagen andere versie of geen acceptatie telt als open. Acceptatie zonder versie blijft apart en telt niet mee.`,
    );
  }
  if (selection.accountStatus) lines.push(`Accountstatus: ${accountStatusLabel(selection.accountStatus)}.`);
  if (selection.pendingStep) lines.push(`Openstaande stap: ${pendingStepLabel(selection.pendingStep)}.`);
  if (selection.excludeUserIds.length > 0) {
    lines.push(`${selection.excludeUserIds.length} account(s) handmatig uitgesloten.`);
  }
  lines.push('Registratiedatum wordt getoond als accountleeftijd en niet als laatste activiteit.');
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
  recipientIds: string[];
}): string {
  return JSON.stringify({
    selection: canonicalSelection(input.selection),
    message: input.message,
    subject: input.subject,
    title: input.title,
    route: input.route,
    sendNotification: input.sendNotification,
    sendEmail: input.sendEmail,
    recipientIds: [...input.recipientIds].sort(),
  });
}

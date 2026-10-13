/**
 * Admin user population.
 *
 * One partition per account: anonymized tombstone, demonstrable test, or real.
 * Unverified or inactive accounts stay real. This module does not delete rows.
 *
 * Identity rules reuse lib/certification/internal-test-identities and
 * lib/certification/cert-hygiene. Acquisition reuses User.acquisitionFirstTouch
 * and Attribution — never inferred campaign history.
 */

import type { Prisma } from '@prisma/client';
import {
  isDisposableCertEmail,
  isInternalTestKeepEmail,
  isInternalTestKeepUsername,
  INTERNAL_TEST_KEEP_EMAILS,
  INTERNAL_TEST_KEEP_USERNAMES,
} from '@/lib/certification/internal-test-identities';
import { isCanonicalTombstoneEmail } from '@/lib/certification/cert-hygiene';

export const ACTIVE_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type UserPopulationClass = 'real' | 'test' | 'deleted';

export type RegistrationOrigin =
  | 'meta'
  | 'affiliate'
  | 'organic'
  | 'recorded_other'
  | 'unknown';

export type AdminUserPopulationSnapshot = {
  totalRegistered: number;
  totalRealUsers: number;
  totalVerified: number;
  totalActive: number;
  totalSoftDeleted: number;
  totalTestAccounts: number;
  newUsersToday: number;
  newUsers7Days: number;
  newUsers30Days: number;
  unverifiedRealUsers: number;
  origins: Record<RegistrationOrigin, number>;
  meta: {
    visitors: null;
    visitorsNote: string;
    registrations: number;
    verifiedRegistrations: number;
    activatedUsers: number;
    firstListing: number;
  };
};

export type PopulationIdentity = {
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  accountDeletedAt?: Date | string | null;
};

const META_UTM_SOURCES = new Set([
  'meta',
  'facebook',
  'fb',
  'instagram',
  'ig',
]);

const ORGANIC_MEDIUMS = new Set(['organic', 'referral']);
const ORGANIC_SOURCES = new Set(['organic', 'direct']);

export function isAnonymizedUser(user: PopulationIdentity | null | undefined): boolean {
  if (!user) return false;
  if (user.accountDeletedAt) return true;
  if (isCanonicalTombstoneEmail(user.email)) return true;
  const email = (user.email || '').trim().toLowerCase();
  if (email.startsWith('deleted+') && email.endsWith('@accounts.homecheff.internal')) return true;
  return false;
}

export function isKeepFixture(user: PopulationIdentity | null | undefined): boolean {
  if (!user) return false;
  return isInternalTestKeepEmail(user.email) || isInternalTestKeepUsername(user.username);
}

/**
 * Reserved or internal mailboxes that cannot belong to a public user.
 * `.invalid` is a reserved special-use TLD. `homecheff.internal` is not a public domain.
 * Tombstones on accounts.homecheff.internal are anonymized first and are not counted here.
 */
export function isReservedNonMailboxEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (value.endsWith('.invalid')) return true;
  if (value.endsWith('@homecheff.internal') || value.endsWith('.homecheff.internal')) return true;
  return false;
}

/** High-confidence certification or internal fixture. Not “inactive” and not “unverified”. */
export function isDemonstrableTestUser(user: PopulationIdentity | null | undefined): boolean {
  if (!user || isAnonymizedUser(user)) return false;
  if (isKeepFixture(user)) return true;
  if (/certificationFixture\s*=\s*true/i.test(user.bio || '')) return true;
  if (isReservedNonMailboxEmail(user.email)) return true;
  return isDisposableCertEmail(user.email);
}

export function classifyUserPopulation(
  user: PopulationIdentity | null | undefined,
): UserPopulationClass {
  if (isAnonymizedUser(user)) return 'deleted';
  if (isDemonstrableTestUser(user)) return 'test';
  return 'real';
}

function insensitiveEmail(match: Prisma.StringFilter): Prisma.UserWhereInput {
  return { email: { ...match, mode: 'insensitive' } };
}

function demonstrableTestSignals(): Prisma.UserWhereInput[] {
  const keepUsernames: Prisma.UserWhereInput[] = INTERNAL_TEST_KEEP_USERNAMES.map((username) => ({
    username: { equals: username, mode: 'insensitive' },
  }));
  const keepEmails: Prisma.UserWhereInput[] = INTERNAL_TEST_KEEP_EMAILS.map((email) =>
    insensitiveEmail({ equals: email }),
  );
  return [
    ...keepUsernames,
    ...keepEmails,
    { bio: { contains: 'certificationFixture=true', mode: 'insensitive' } },
    insensitiveEmail({ endsWith: '@homecheff-validation.test' }),
    insensitiveEmail({ endsWith: '@homecheff.invalid' }),
    insensitiveEmail({ endsWith: '@homecheff.test' }),
    insensitiveEmail({ contains: 'homecheff-validation.test' }),
    insensitiveEmail({ endsWith: '@example.com' }),
    insensitiveEmail({ endsWith: '.invalid' }),
    insensitiveEmail({ endsWith: '@homecheff.internal' }),
    {
      AND: [
        insensitiveEmail({ startsWith: 'cleaned-' }),
        insensitiveEmail({ contains: 'homecheff-validation' }),
      ],
    },
  ];
}

export function anonymizedUserWhere(): Prisma.UserWhereInput {
  return {
    OR: [
      { accountDeletedAt: { not: null } },
      insensitiveEmail({ startsWith: 'deleted+' }),
      insensitiveEmail({ endsWith: '@accounts.homecheff.internal' }),
    ],
  };
}

export function demonstrableTestUserWhere(): Prisma.UserWhereInput {
  return {
    AND: [{ NOT: anonymizedUserWhere() }, { OR: demonstrableTestSignals() }],
  };
}

export function realUserWhere(): Prisma.UserWhereInput {
  const emailSignals = demonstrableTestSignals().filter((signal) => {
    if (!('email' in signal) && !('AND' in signal)) return false;
    return true;
  });
  return {
    AND: [
      { accountDeletedAt: null },
      { NOT: insensitiveEmail({ startsWith: 'deleted+' }) },
      { NOT: insensitiveEmail({ endsWith: '@accounts.homecheff.internal' }) },
      { NOT: { OR: emailSignals } },
      {
        OR: [
          { username: null },
          {
            NOT: {
              OR: INTERNAL_TEST_KEEP_USERNAMES.map((username) => ({
                username: { equals: username, mode: 'insensitive' as const },
              })),
            },
          },
        ],
      },
      {
        OR: [
          { bio: null },
          { NOT: { bio: { contains: 'certificationFixture=true', mode: 'insensitive' } } },
        ],
      },
    ],
  };
}

export const ADMIN_USER_LIST_VIEWS = ['real', 'test', 'deleted', 'all'] as const;

export type AdminUserListView = (typeof ADMIN_USER_LIST_VIEWS)[number] | 'current';

/** Admin user list opens on real accounts. Deleted rows stay behind their own filter. */
export const DEFAULT_ADMIN_USER_LIST_VIEW = 'real' as const;

export function userPopulationWhere(view: AdminUserListView): Prisma.UserWhereInput {
  if (view === 'all') return {};
  if (view === 'deleted') return anonymizedUserWhere();
  if (view === 'test') return demonstrableTestUserWhere();
  if (view === 'real') return realUserWhere();
  return { NOT: anonymizedUserWhere() };
}

export type AcquisitionTouch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export function readAcquisitionTouch(value: unknown): AcquisitionTouch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const pick = (key: string) => {
    const raw = row[key];
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    return trimmed || undefined;
  };
  const touch: AcquisitionTouch = {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
  };
  if (!touch.utm_source && !touch.utm_medium && !touch.utm_campaign) return null;
  return touch;
}

export function isMetaUtmSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return META_UTM_SOURCES.has(source.trim().toLowerCase());
}

/**
 * Mutually exclusive registration origin.
 * Meta UTM wins over affiliate so a campaign click is not also counted as affiliate.
 * Missing stored source stays unknown — it is not treated as organic.
 */
export function registrationOrigin(input: {
  acquisitionFirstTouch: unknown;
  hasAffiliateAttribution: boolean;
}): RegistrationOrigin {
  const touch = readAcquisitionTouch(input.acquisitionFirstTouch);
  if (touch && isMetaUtmSource(touch.utm_source)) return 'meta';
  if (input.hasAffiliateAttribution) return 'affiliate';
  if (!touch) return 'unknown';
  const medium = (touch.utm_medium || '').toLowerCase();
  const source = (touch.utm_source || '').toLowerCase();
  if (ORGANIC_MEDIUMS.has(medium) || ORGANIC_SOURCES.has(source)) return 'organic';
  return 'recorded_other';
}

export type RetentionDeps = {
  ordersBuyer: number;
  ordersSeller: number;
  transactionsBuyer: number;
  transactionsSeller: number;
  payouts: number;
  escrows: number;
  stripeConnect: boolean;
  sellerStripe: boolean;
  affiliateStripe: boolean;
  affiliateRow: boolean;
  commissionLedger: number;
  affiliatePayouts: number;
  attributions: number;
  hcSettlements: number;
  communityOrders: number;
  reservations: number;
  reviews: number;
  messages: number;
  proposals: number;
  listings: number;
  products: number;
  reports: number;
  sellerExpenses: number;
  financialEvidence: number;
  auditLogs: number;
  deliveryProfiles: number;
  dishes: number;
  conversationParticipants: number;
};

export function emptyRetentionDeps(): RetentionDeps {
  return {
    ordersBuyer: 0,
    ordersSeller: 0,
    transactionsBuyer: 0,
    transactionsSeller: 0,
    payouts: 0,
    escrows: 0,
    stripeConnect: false,
    sellerStripe: false,
    affiliateStripe: false,
    affiliateRow: false,
    commissionLedger: 0,
    affiliatePayouts: 0,
    attributions: 0,
    hcSettlements: 0,
    communityOrders: 0,
    reservations: 0,
    reviews: 0,
    messages: 0,
    proposals: 0,
    listings: 0,
    products: 0,
    reports: 0,
    sellerExpenses: 0,
    financialEvidence: 0,
    auditLogs: 0,
    deliveryProfiles: 0,
    dishes: 0,
    conversationParticipants: 0,
  };
}

export function retentionBlocksHardDelete(deps: RetentionDeps): boolean {
  return (
    deps.ordersBuyer > 0 ||
    deps.ordersSeller > 0 ||
    deps.transactionsBuyer > 0 ||
    deps.transactionsSeller > 0 ||
    deps.payouts > 0 ||
    deps.escrows > 0 ||
    deps.stripeConnect ||
    deps.sellerStripe ||
    deps.affiliateStripe ||
    deps.affiliateRow ||
    deps.commissionLedger > 0 ||
    deps.affiliatePayouts > 0 ||
    deps.attributions > 0 ||
    deps.hcSettlements > 0 ||
    deps.communityOrders > 0 ||
    deps.reservations > 0 ||
    deps.reviews > 0 ||
    deps.messages > 0 ||
    deps.proposals > 0 ||
    deps.listings > 0 ||
    deps.products > 0 ||
    deps.reports > 0 ||
    deps.sellerExpenses > 0 ||
    deps.financialEvidence > 0 ||
    deps.auditLogs > 0 ||
    deps.deliveryProfiles > 0 ||
    deps.dishes > 0 ||
    deps.conversationParticipants > 0
  );
}

export function hardDeleteIsObjectivelySafe(input: {
  population: UserPopulationClass;
  role: string | null | undefined;
  keepFixture: boolean;
  deps: RetentionDeps;
}): boolean {
  if (input.population === 'real') return false;
  if (input.keepFixture) return false;
  if (input.role === 'ADMIN' || input.role === 'SUPERADMIN') return false;
  return !retentionBlocksHardDelete(input.deps);
}

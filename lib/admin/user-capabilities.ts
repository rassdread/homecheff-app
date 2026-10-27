import type { Prisma } from '@prisma/client';
import { ACTIVE_USER_WINDOW_MS } from '@/lib/admin/user-population';

/**
 * Capabilities come from records, not from a single User.role.
 * A person can be a buyer and a seller. A delivery profile is a registration,
 * not a page visit. An affiliate row counts only when it is a commercial participant.
 * Stripe onboarding completed is not identity verification and not courier approval.
 */

export const USER_CAPABILITY_FILTERS = [
  'buyers',
  'private_sellers',
  'business_sellers',
  'business_accounts',
  'delivery_partners',
  'affiliates',
  'administrators',
  'verified',
  'unverified',
  'active',
  'inactive',
  'suspended',
  'connect_ready',
  'connect_incomplete',
  'subscribed_businesses',
  'unsubscribed_businesses',
] as const;

export type UserCapabilityFilter = (typeof USER_CAPABILITY_FILTERS)[number];

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'ACTIVE', 'TRIALING'];

export function parseUserCapabilityFilters(
  raw: string[],
): { ok: true; filters: UserCapabilityFilter[] } | { ok: false; error: string } {
  const filters: UserCapabilityFilter[] = [];
  for (const value of raw) {
    if (!value) continue;
    if (!(USER_CAPABILITY_FILTERS as readonly string[]).includes(value)) {
      return { ok: false, error: `Unknown capability filter: ${value}` };
    }
    filters.push(value as UserCapabilityFilter);
  }
  return { ok: true, filters };
}

export function businessSellerWhere(): Prisma.UserWhereInput {
  return {
    SellerProfile: {
      is: {
        OR: [
          { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
          { AND: [{ kvk: { not: null } }, { NOT: { kvk: '' } }] },
        ],
      },
    },
  };
}

export function privateSellerWhere(): Prisma.UserWhereInput {
  return {
    AND: [{ SellerProfile: { isNot: null } }, { NOT: businessSellerWhere() }],
  };
}

export function connectReadyWhere(): Prisma.UserWhereInput {
  return {
    AND: [
      { stripeConnectOnboardingCompleted: true },
      { stripeConnectAccountId: { not: null } },
      { NOT: { stripeConnectAccountId: '' } },
    ],
  };
}

export function capabilityWhere(
  filters: UserCapabilityFilter[],
  input: { now: Date; subscribedUserIds: string[] },
): Prisma.UserWhereInput {
  const activeSince = new Date(input.now.getTime() - ACTIVE_USER_WINDOW_MS);
  const parts: Prisma.UserWhereInput[] = [];
  for (const filter of filters) {
    switch (filter) {
      case 'buyers':
        parts.push({ orders: { some: {} } });
        break;
      case 'private_sellers':
        parts.push(privateSellerWhere());
        break;
      case 'business_sellers':
        parts.push(businessSellerWhere());
        break;
      case 'business_accounts':
        parts.push({
          OR: [
            businessSellerWhere(),
            { id: { in: input.subscribedUserIds } },
          ],
        });
        break;
      case 'delivery_partners':
        parts.push({ DeliveryProfile: { isNot: null } });
        break;
      case 'affiliates':
        parts.push({ affiliate: { is: { populationClass: 'COMMERCIAL' } } });
        break;
      case 'administrators':
        parts.push({ role: { in: ['ADMIN', 'SUPERADMIN'] } });
        break;
      case 'verified':
        parts.push({ emailVerified: { not: null } });
        break;
      case 'unverified':
        parts.push({ emailVerified: null, accountDeletedAt: null });
        break;
      case 'active':
        parts.push({
          updatedAt: { gte: activeSince },
          suspendedAt: null,
          accountDeletedAt: null,
        });
        break;
      case 'inactive':
        parts.push({
          updatedAt: { lt: activeSince },
          suspendedAt: null,
          accountDeletedAt: null,
        });
        break;
      case 'suspended':
        parts.push({ suspendedAt: { not: null } });
        break;
      case 'connect_ready':
        parts.push(connectReadyWhere());
        break;
      case 'connect_incomplete':
        parts.push({
          AND: [
            {
              OR: [
                { SellerProfile: { isNot: null } },
                { DeliveryProfile: { isNot: null } },
                { affiliate: { is: { populationClass: 'COMMERCIAL' } } },
              ],
            },
            { NOT: connectReadyWhere() },
          ],
        });
        break;
      case 'subscribed_businesses':
        parts.push({ id: { in: input.subscribedUserIds } });
        break;
      case 'unsubscribed_businesses':
        parts.push({
          AND: [businessSellerWhere(), { NOT: { id: { in: input.subscribedUserIds } } }],
        });
        break;
      default:
        break;
    }
  }
  if (parts.length === 0) return {};
  return { AND: parts };
}

export const SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT = ACTIVE_SUBSCRIPTION_STATUSES;

export type CapabilityLabelsInput = {
  orderCount: number;
  hasSellerProfile: boolean;
  businessSeller: boolean;
  hasDeliveryProfile: boolean;
  commercialAffiliate: boolean;
  role: string;
  connectReady: boolean;
};

export function capabilityLabels(input: CapabilityLabelsInput): string[] {
  const labels: string[] = [];
  if (input.orderCount > 0) labels.push('Koper');
  if (input.businessSeller) labels.push('Zakelijke verkoper');
  else if (input.hasSellerProfile) labels.push('Particuliere verkoper');
  if (input.hasDeliveryProfile) labels.push('Bezorgpartner');
  if (input.commercialAffiliate) labels.push('Affiliate');
  if (input.role === 'ADMIN' || input.role === 'SUPERADMIN') labels.push('Beheerder');
  if (input.connectReady) labels.push('Connect gereed');
  else if (input.hasSellerProfile || input.hasDeliveryProfile || input.commercialAffiliate) {
    labels.push('Connect onvolledig');
  }
  if (labels.length === 0) labels.push(input.role || 'Account');
  return labels;
}

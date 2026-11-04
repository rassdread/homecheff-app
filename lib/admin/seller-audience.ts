/**
 * Read-only seller audience for the admin composer.
 * Plan visuals use the existing subscription resolver.
 * A stored Connect account is not payout readiness.
 * Expired plans do not change the private or business declaration.
 */

import { classifySellerConnect, type SellerConnectClass } from '@/lib/admin/seller-connect-segment';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { resolveBusinessPlanId } from '@/lib/business/visibility-profile';

export type SellerAccountFilter = 'PRIVATE' | 'BUSINESS';
export type SellerPlanFilter = 'NONE' | 'BASIC' | 'PRO' | 'PREMIUM' | 'ACTIVE' | 'EXPIRED';
export type SellerProductFilter = 'ACTIVE' | 'NONE';
export type SellerOnboardingFilter = 'COMPLETE' | 'INCOMPLETE';

export type SellerAudienceQuery = {
  account: SellerAccountFilter[];
  plans: SellerPlanFilter[];
  products: SellerProductFilter | null;
  onboarding: SellerOnboardingFilter | null;
  connect: SellerConnectClass[];
};

export type SellerAudienceSource = {
  userId: string;
  name: string | null;
  email: string | null;
  deleted: boolean;
  suspended: boolean;
  marketingAccepted: boolean;
  commerceDeclaration: string | null;
  businessVerified: boolean;
  subscriptionId: string | null;
  subscriptionValidUntil: Date | string | null;
  subscriptionName: string | null;
  feeBps: number | null;
  activeProductCount: number;
  connectAccountId: string | null | undefined;
  connectOnboardingCompleted: boolean | null | undefined;
  payoutsEnabled: boolean | null;
  connectRestricted: boolean | null;
  connectRequirementsDue: boolean | null;
};

export type AssessedSeller = {
  userId: string;
  name: string | null;
  email: string | null;
  account: 'PRIVATE' | 'BUSINESS' | 'UNDECLARED';
  plan: 'individual' | 'basic' | 'pro' | 'premium';
  period: 'NONE' | 'ACTIVE' | 'EXPIRED';
  activeProductCount: number;
  onboardingComplete: boolean;
  connect: SellerConnectClass;
  marketingAccepted: boolean;
  exclusionReason: string | null;
};

const ACCOUNTS = new Set<SellerAccountFilter>(['PRIVATE', 'BUSINESS']);
const PLANS = new Set<SellerPlanFilter>(['NONE', 'BASIC', 'PRO', 'PREMIUM', 'ACTIVE', 'EXPIRED']);
const CONNECTS = new Set<SellerConnectClass>([
  'NOT_STARTED',
  'STARTED_INCOMPLETE',
  'LINKED_PAYOUT_UNKNOWN',
  'REQUIREMENTS_DUE',
  'PAYOUT_READY',
  'RESTRICTED',
  'UNKNOWN',
]);

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof value === 'string' && value && value !== 'ANY') return [value];
  return [];
}

export function parseSellerAudienceQuery(
  raw: unknown,
): { ok: true; query: SellerAudienceQuery } | { ok: false; error: string } {
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const account = asList(body.account).filter((entry): entry is SellerAccountFilter => ACCOUNTS.has(entry as SellerAccountFilter));
  if (asList(body.account).some((entry) => !ACCOUNTS.has(entry as SellerAccountFilter))) {
    return { ok: false, error: 'Onbekend verkoperstype.' };
  }
  const plans = asList(body.plans).filter((entry): entry is SellerPlanFilter => PLANS.has(entry as SellerPlanFilter));
  if (asList(body.plans).some((entry) => !PLANS.has(entry as SellerPlanFilter))) {
    return { ok: false, error: 'Onbekend abonnementsfilter.' };
  }
  const connect = asList(body.connect).filter((entry): entry is SellerConnectClass => CONNECTS.has(entry as SellerConnectClass));
  if (asList(body.connect).some((entry) => !CONNECTS.has(entry as SellerConnectClass))) {
    return { ok: false, error: 'Onbekend Connect-filter.' };
  }
  let products: SellerProductFilter | null = null;
  if (body.products != null && body.products !== '' && body.products !== 'ANY') {
    if (body.products !== 'ACTIVE' && body.products !== 'NONE') {
      return { ok: false, error: 'Onbekend productfilter.' };
    }
    products = body.products;
  }
  let onboarding: SellerOnboardingFilter | null = null;
  if (body.onboarding != null && body.onboarding !== '' && body.onboarding !== 'ANY') {
    if (body.onboarding !== 'COMPLETE' && body.onboarding !== 'INCOMPLETE') {
      return { ok: false, error: 'Onbekend onboardingfilter.' };
    }
    onboarding = body.onboarding;
  }
  return { ok: true, query: { account, plans, products, onboarding, connect } };
}

export function sellerQueryKey(query: SellerAudienceQuery): string {
  return JSON.stringify({
    account: [...query.account].sort(),
    plans: [...query.plans].sort(),
    products: query.products,
    onboarding: query.onboarding,
    connect: [...query.connect].sort(),
  });
}

export function describeSellerQuery(query: SellerAudienceQuery): string[] {
  const lines: string[] = [];
  if (query.account.length) lines.push(`Account: ${query.account.join(' of ')}`);
  if (query.plans.length) lines.push(`Abonnement: ${query.plans.join(' of ')}`);
  if (query.products) lines.push(query.products === 'ACTIVE' ? 'Minstens één actief product' : 'Geen actieve producten');
  if (query.onboarding) lines.push(query.onboarding === 'COMPLETE' ? 'Onboarding afgerond' : 'Onboarding onvolledig');
  if (query.connect.length) lines.push(`Connect: ${query.connect.join(' of ')}`);
  if (lines.length === 0) lines.push('Alle verkopers met een verkopersprofiel');
  lines.push('Filters tussen categorieën gelden samen. Meerdere waarden in één categorie gelden als of.');
  return lines;
}

function periodOf(validUntil: Date | string | null, plan: AssessedSeller['plan'], now: Date): AssessedSeller['period'] {
  if (!validUntil) return plan === 'individual' ? 'NONE' : 'ACTIVE';
  const ts = validUntil instanceof Date ? validUntil.getTime() : Date.parse(String(validUntil));
  if (!Number.isFinite(ts)) return 'NONE';
  return ts > now.getTime() ? 'ACTIVE' : 'EXPIRED';
}

export function assessSeller(source: SellerAudienceSource, now = new Date()): AssessedSeller {
  const plan = resolveBusinessPlanId({
    subscriptionId: source.subscriptionId,
    subscriptionValidUntil: source.subscriptionValidUntil,
    Subscription: source.subscriptionName
      ? { name: source.subscriptionName, feeBps: source.feeBps ?? undefined }
      : null,
  });
  const declaration = source.commerceDeclaration || 'UNDECLARED';
  const account: AssessedSeller['account'] =
    declaration === 'SELF_DECLARED_PROFESSIONAL' || source.businessVerified
      ? 'BUSINESS'
      : declaration === 'PRIVATE_OCCASIONAL'
        ? 'PRIVATE'
        : 'UNDECLARED';
  const email = tryNormalizeEmail(source.email);
  let exclusionReason: string | null = null;
  if (source.deleted) exclusionReason = 'Verwijderd account';
  else if (source.suspended) exclusionReason = 'Geschorst account';
  else if (!email) exclusionReason = 'Geen geldig e-mailadres';
  return {
    userId: source.userId,
    name: source.name,
    email,
    account,
    plan,
    period: periodOf(source.subscriptionValidUntil, plan, now),
    activeProductCount: source.activeProductCount,
    onboardingComplete: account !== 'UNDECLARED',
    connect: classifySellerConnect({
      stripeConnectAccountId: source.connectAccountId,
      onboardingCompleted: source.connectOnboardingCompleted,
      payoutsEnabled: source.payoutsEnabled,
      restricted: source.connectRestricted,
      requirementsDue: source.connectRequirementsDue,
    }),
    marketingAccepted: source.marketingAccepted,
    exclusionReason,
  };
}

function matchesPlan(seller: AssessedSeller, plans: SellerPlanFilter[]): boolean {
  if (plans.length === 0) return true;
  return plans.some((plan) => {
    if (plan === 'NONE') return seller.period === 'NONE';
    if (plan === 'ACTIVE') return seller.period === 'ACTIVE' && seller.plan !== 'individual';
    if (plan === 'EXPIRED') return seller.period === 'EXPIRED';
    return seller.plan === plan.toLowerCase();
  });
}

export function selectSellerRecipients(
  sellers: AssessedSeller[],
  query: SellerAudienceQuery,
): { eligible: AssessedSeller[]; excluded: { reason: string; count: number }[] } {
  const excluded = new Map<string, number>();
  const bump = (reason: string) => excluded.set(reason, (excluded.get(reason) || 0) + 1);
  const matched: AssessedSeller[] = [];
  for (const seller of sellers) {
    if (seller.exclusionReason) {
      bump(seller.exclusionReason);
      continue;
    }
    if (query.account.length && !query.account.includes(seller.account as SellerAccountFilter)) {
      bump('Ander accounttype');
      continue;
    }
    if (!matchesPlan(seller, query.plans)) {
      bump('Ander abonnement');
      continue;
    }
    if (query.products === 'ACTIVE' && seller.activeProductCount < 1) {
      bump('Geen actief product');
      continue;
    }
    if (query.products === 'NONE' && seller.activeProductCount > 0) {
      bump('Heeft actieve producten');
      continue;
    }
    if (query.onboarding === 'COMPLETE' && !seller.onboardingComplete) {
      bump('Onboarding onvolledig');
      continue;
    }
    if (query.onboarding === 'INCOMPLETE' && seller.onboardingComplete) {
      bump('Onboarding afgerond');
      continue;
    }
    if (query.connect.length && !query.connect.includes(seller.connect)) {
      bump('Andere Connect-status');
      continue;
    }
    matched.push(seller);
  }
  const seen = new Set<string>();
  const eligible: AssessedSeller[] = [];
  for (const seller of [...matched].sort((a, b) => a.userId.localeCompare(b.userId))) {
    const key = seller.email || seller.userId;
    if (seen.has(key)) {
      bump('Dubbel e-mailadres');
      continue;
    }
    seen.add(key);
    eligible.push(seller);
  }
  return {
    eligible,
    excluded: [...excluded.entries()].map(([reason, count]) => ({ reason, count })),
  };
}

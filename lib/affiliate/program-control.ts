/**
 * Affiliate launch program: capabilities, recruitment, grandfathering.
 * Financial formulas stay in the certified economics modules.
 * This file only decides WHICH policy applies and WHICH tools are on.
 */

export const EARLY_AFFILIATE_PROGRAM_CODE = 'EARLY_AFFILIATE_V1';
export const EARLY_AFFILIATE_PROGRAM_NAME = 'Vroege instap';
export const CERTIFIED_COMMISSION_POLICY_REF = 'CERTIFIED_CURRENT_ECONOMICS';
export const QUALIFYING_DURATION_POLICY_REF = 'QUALIFYING_WHILE_ACTIVE';
export const EARLY_TERMS_VERSION = 'EARLY_AFFILIATE_V1_TERMS';

export const CAPABILITY_KEYS = [
  'CAN_EARN_DIRECT_COMMISSION',
  'CAN_CREATE_PROMO_CODES',
  'CAN_USE_PROMO_LIBRARY',
  'CAN_INVITE_SUB_AFFILIATES',
  'CAN_HAVE_SUB_AFFILIATES',
  'CAN_BECOME_MAIN',
  'CAN_EARN_MAIN_OVERRIDE',
  'CAN_ACCESS_NETWORK_DASHBOARD',
  'CAN_ACCESS_COMMISSION_CATALOG',
  'CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS',
  'CAN_REQUEST_NEW_MARKET',
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];
export type CapabilitySource =
  | 'ADMIN_OVERRIDE'
  | 'ENROLLMENT'
  | 'PROGRAM'
  | 'MARKET'
  | 'GLOBAL';

export type RecruitmentState = 'OPEN' | 'LIMITED' | 'WAITLIST' | 'CLOSED';

export type CapabilityMap = Record<CapabilityKey, boolean>;

/** Current production: one hierarchy layer, no numeric child cap. */
export const GLOBAL_DEFAULT_CAPABILITIES: CapabilityMap = {
  CAN_EARN_DIRECT_COMMISSION: true,
  CAN_CREATE_PROMO_CODES: true,
  CAN_USE_PROMO_LIBRARY: true,
  CAN_INVITE_SUB_AFFILIATES: true,
  CAN_HAVE_SUB_AFFILIATES: true,
  CAN_BECOME_MAIN: true,
  CAN_EARN_MAIN_OVERRIDE: true,
  CAN_ACCESS_NETWORK_DASHBOARD: true,
  CAN_ACCESS_COMMISSION_CATALOG: true,
  CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS: true,
  CAN_REQUEST_NEW_MARKET: true,
};

export const GLOBAL_DEFAULT_SUB_LIMIT: number | null = null;

export type PartialCaps = Partial<CapabilityMap>;

export type SubLimitSetting = {
  /** null = unlimited */
  value: number | null;
  configured: boolean;
};

export type CapabilityContext = {
  /** HomeCheff can lift this. It blocks the affiliate's own actions. It does not erase grants. */
  suspended: boolean;
  /**
   * Technical, review and excluded identities do not inherit program or global rights.
   * Absence of a parent is not a MAIN grant.
   */
  withholdProgramRights?: boolean;
  program: { capabilities: PartialCaps; subAffiliateLimit: number | null };
  market?: { capabilities?: PartialCaps; subAffiliateLimit?: number | null };
  /** Rights captured when this affiliate joined. Null inherits the program. */
  enrollmentGrant?: PartialCaps | null;
  adminOverride?: {
    capabilities: PartialCaps;
    subLimitMode: 'INHERIT' | 'LIMITED' | 'UNLIMITED';
    subLimit: number | null;
    privateCollaboration?: boolean;
  } | null;
};

export type ResolvedCapability = {
  value: boolean;
  source: CapabilitySource;
  configured: boolean | null;
};

export type ResolvedAffiliateCapabilities = {
  capabilities: Record<CapabilityKey, ResolvedCapability>;
  subAffiliateLimit: {
    value: number | null;
    source: CapabilitySource;
    configured: number | null | 'UNLIMITED' | 'INHERIT';
  };
  precedence: string[];
  operationsBlocked: boolean;
  privateCollaboration: boolean;
};

export const CAPABILITY_PRECEDENCE = [
  'ADMIN_OVERRIDE',
  'ENROLLMENT',
  'PROGRAM',
  'MARKET',
  'GLOBAL',
] as const;

function pickBoolean(
  key: CapabilityKey,
  ctx: CapabilityContext,
): ResolvedCapability {
  const override = ctx.adminOverride?.capabilities[key];
  if (typeof override === 'boolean') {
    return { value: override, source: 'ADMIN_OVERRIDE', configured: override };
  }
  const enrolled = ctx.enrollmentGrant?.[key];
  if (typeof enrolled === 'boolean') {
    return { value: enrolled, source: 'ENROLLMENT', configured: enrolled };
  }
  const program = ctx.program.capabilities[key];
  if (typeof program === 'boolean') {
    return { value: program, source: 'PROGRAM', configured: program };
  }
  const market = ctx.market?.capabilities?.[key];
  if (typeof market === 'boolean') {
    return { value: market, source: 'MARKET', configured: market };
  }
  const global = GLOBAL_DEFAULT_CAPABILITIES[key];
  return { value: global, source: 'GLOBAL', configured: global };
}

export function resolveAffiliateCapabilities(
  ctx: CapabilityContext,
): ResolvedAffiliateCapabilities {
  if (ctx.withholdProgramRights) {
    const capabilities = {} as Record<CapabilityKey, ResolvedCapability>;
    for (const key of CAPABILITY_KEYS) {
      const override = ctx.adminOverride?.capabilities[key];
      capabilities[key] = typeof override === 'boolean'
        ? { value: override, source: 'ADMIN_OVERRIDE', configured: override }
        : { value: false, source: 'GLOBAL', configured: null };
    }
    const mode = ctx.adminOverride?.subLimitMode ?? 'INHERIT';
    const sub = mode === 'UNLIMITED'
      ? { value: null, source: 'ADMIN_OVERRIDE' as const, configured: 'UNLIMITED' as const }
      : mode === 'LIMITED'
        ? {
            value: ctx.adminOverride?.subLimit ?? 0,
            source: 'ADMIN_OVERRIDE' as const,
            configured: ctx.adminOverride?.subLimit ?? 0,
          }
        : { value: 0, source: 'GLOBAL' as const, configured: 0 as const };
    return {
      capabilities,
      subAffiliateLimit: sub,
      precedence: [...CAPABILITY_PRECEDENCE],
      operationsBlocked: ctx.suspended,
      privateCollaboration: Boolean(ctx.adminOverride?.privateCollaboration),
    };
  }

  const capabilities = {} as Record<CapabilityKey, ResolvedCapability>;
  for (const key of CAPABILITY_KEYS) {
    capabilities[key] = pickBoolean(key, ctx);
  }

  let sub: ResolvedAffiliateCapabilities['subAffiliateLimit'];
  const mode = ctx.adminOverride?.subLimitMode ?? 'INHERIT';
  if (mode === 'UNLIMITED') {
    sub = { value: null, source: 'ADMIN_OVERRIDE', configured: 'UNLIMITED' };
  } else if (mode === 'LIMITED') {
    sub = {
      value: ctx.adminOverride?.subLimit ?? 0,
      source: 'ADMIN_OVERRIDE',
      configured: ctx.adminOverride?.subLimit ?? 0,
    };
  } else if (ctx.program.subAffiliateLimit !== undefined) {
    sub = {
      value: ctx.program.subAffiliateLimit,
      source: 'PROGRAM',
      configured: ctx.program.subAffiliateLimit,
    };
  } else if (ctx.market && ctx.market.subAffiliateLimit !== undefined) {
    sub = {
      value: ctx.market.subAffiliateLimit ?? null,
      source: 'MARKET',
      configured: ctx.market.subAffiliateLimit ?? null,
    };
  } else {
    sub = { value: GLOBAL_DEFAULT_SUB_LIMIT, source: 'GLOBAL', configured: null };
  }

  return {
    capabilities,
    subAffiliateLimit: sub,
    precedence: [...CAPABILITY_PRECEDENCE],
    operationsBlocked: ctx.suspended,
    privateCollaboration: Boolean(ctx.adminOverride?.privateCollaboration),
  };
}

export function effectiveSubLimitLabel(value: number | null): string {
  if (value === null) return 'ONBEPERKT';
  return String(value);
}

export type PublicEnrollmentDecision =
  | { allow: 'ENROLL'; programCode: string }
  | { allow: 'REVIEW'; programCode: string }
  | { allow: 'WAITLIST' }
  | { allow: 'CLOSED' };

export function decidePublicEnrollment(input: {
  recruitmentState: RecruitmentState;
  programCode: string | null;
}): PublicEnrollmentDecision {
  if (input.recruitmentState === 'OPEN' && input.programCode) {
    return { allow: 'ENROLL', programCode: input.programCode };
  }
  if (input.recruitmentState === 'LIMITED' && input.programCode) {
    return { allow: 'REVIEW', programCode: input.programCode };
  }
  if (input.recruitmentState === 'WAITLIST') return { allow: 'WAITLIST' };
  return { allow: 'CLOSED' };
}

/** Admin admission ignores public recruitment. It does not ignore a missing user. */
export function decideAdminAdmission(input: {
  actorRole: string | null;
  userExists: boolean;
  alreadyAffiliate: boolean;
}): { ok: true; force: true } | { ok: false; code: string; reason: string } {
  if (input.actorRole !== 'ADMIN' && input.actorRole !== 'SUPERADMIN') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      reason: 'Alleen een beheerder van HomeCheff kan dit doen.',
    };
  }
  if (!input.userExists) {
    return {
      ok: false,
      code: 'USER_MISSING',
      reason: 'Er is geen account om aan te melden. Maak eerst het account aan.',
    };
  }
  if (input.alreadyAffiliate) {
    return {
      ok: false,
      code: 'ALREADY_AFFILIATE',
      reason: 'Dit account is al affiliate. Pas het programma aan in plaats van opnieuw aan te maken.',
    };
  }
  return { ok: true, force: true };
}

export function decideSubInvite(input: {
  resolved: ResolvedAffiliateCapabilities;
  hasParent: boolean;
  childCount: number;
  pendingInvites: number;
  adminForce: boolean;
}): { ok: true } | { ok: false; code: string } {
  if (input.resolved.operationsBlocked && !input.adminForce) {
    return { ok: false, code: 'SUSPENDED' };
  }
  if (!input.resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value && !input.adminForce) {
    return { ok: false, code: 'INVITE_DISABLED' };
  }
  if (input.hasParent && !input.adminForce) {
    return { ok: false, code: 'PARENT_IS_PARTNER' };
  }
  const limit = input.resolved.subAffiliateLimit.value;
  const used = input.childCount + input.pendingInvites;
  if (limit !== null && used >= limit) {
    return { ok: false, code: 'SUB_LIMIT' };
  }
  return { ok: true };
}

export function commissionStillApplies(input: {
  enrolled: boolean;
  suspended: boolean;
  canEarn: boolean;
  recruitmentState: RecruitmentState;
}): boolean {
  void input.recruitmentState;
  return input.enrolled && !input.suspended && input.canEarn;
}

export function enrollmentSurvivesDefaultChange(input: {
  enrolledProgramCode: string;
  newPublicDefaultCode: string;
}): { programCode: string; changed: false } {
  return { programCode: input.enrolledProgramCode, changed: false };
}

export type LedgerMutation =
  | { ok: false; code: 'LEDGER_IMMUTABLE'; correction: 'REVERSAL' }
  | { ok: true; path: 'REVERSAL' };

export function decideLedgerMutation(action: 'DELETE' | 'REWRITE' | 'REVERSAL'): LedgerMutation {
  if (action === 'REVERSAL') return { ok: true, path: 'REVERSAL' };
  return { ok: false, code: 'LEDGER_IMMUTABLE', correction: 'REVERSAL' };
}

export type PublicTone = 'EARLY' | 'OPEN' | 'LIMITED' | 'WAITLIST' | 'CLOSED';

export function publicProposition(input: {
  recruitmentState: RecruitmentState;
  publicEarlyEnabled: boolean;
  programName: string;
}): {
  tone: PublicTone;
  badge: string | null;
  lead: string;
  follow: string;
} {
  if (input.recruitmentState === 'CLOSED') {
    return {
      tone: 'CLOSED',
      badge: null,
      lead: 'Nieuwe affiliate-aanmeldingen zijn in deze regio momenteel gesloten.',
      follow: 'Laat weten dat je interesse hebt. Bestaande affiliates blijven werken met hun eigen programma.',
    };
  }
  if (input.recruitmentState === 'WAITLIST') {
    return {
      tone: 'WAITLIST',
      badge: null,
      lead: 'Er is momenteel voldoende affiliate-dekking in jouw regio. Je kunt je wel aanmelden voor de wachtlijst. Zodra er ruimte ontstaat, kunnen we contact met je opnemen.',
      follow: 'Een plek op de wachtlijst is nog geen affiliate-account.',
    };
  }
  if (input.recruitmentState === 'LIMITED') {
    return {
      tone: 'LIMITED',
      badge: null,
      lead: 'HomeCheff heeft in jouw regio al een groeiend affiliate-netwerk. Nieuwe aanmeldingen worden daarom beoordeeld op beschikbare dekking en commerciële mogelijkheden.',
      follow: 'Een aanmelding betekent niet automatisch dat je wordt toegelaten.',
    };
  }
  if (input.publicEarlyEnabled) {
    return {
      tone: 'EARLY',
      badge: input.programName,
      lead: 'HomeCheff bouwt momenteel zijn affiliate-netwerk op. Daarom zijn er nu uitgebreide mogelijkheden om vroeg een eigen klantenportefeuille en netwerk op te bouwen.',
      follow:
        'Wanneer in een regio voldoende dekking is bereikt, kunnen de voorwaarden voor nieuwe affiliates veranderen.',
    };
  }
  return {
    tone: 'OPEN',
    badge: null,
    lead: 'Je kunt je in deze regio aanmelden als affiliate.',
    follow: 'Je krijgt het programma dat op dit moment voor nieuwe affiliates openstaat.',
  };
}

export function durationCopy(programName: string): string {
  return `Zolang jouw aangebrachte klant kwalificerend actief blijft, kan de commissie volgens de regels van ${programName} blijven doorlopen. Blijft een klant 2, 5 of 20 jaar kwalificerend actief, dan kan gedurende die periode commissie blijven ontstaan volgens de voorwaarden van jouw affiliateprogramma.`;
}

export function catalogView(input: {
  audience: 'PUBLIC' | 'AUTHENTICATED';
  publicProgramCode: string;
  enrolledProgramCode: string | null;
}): { programCode: string; audience: 'PUBLIC' | 'AUTHENTICATED' } {
  if (input.audience === 'AUTHENTICATED' && input.enrolledProgramCode) {
    return { programCode: input.enrolledProgramCode, audience: 'AUTHENTICATED' };
  }
  return { programCode: input.publicProgramCode, audience: 'PUBLIC' };
}

export function impactPreview(input: {
  existingEnrolledOnProgram: number;
  grandfathered: number;
  publicDefaultChanging: boolean;
}): {
  newAffiliatesAffected: 'FUTURE';
  existingAffiliatesRewritten: 0;
  grandfatheredPreserved: number;
} {
  void input.publicDefaultChanging;
  return {
    newAffiliatesAffected: 'FUTURE',
    existingAffiliatesRewritten: 0,
    grandfatheredPreserved: input.grandfathered,
  };
}

export function resetOverride(): {
  subLimitMode: 'INHERIT';
  capabilities: Record<string, never>;
} {
  return { subLimitMode: 'INHERIT', capabilities: {} };
}

export const EARLY_PROGRAM_DEFAULTS = {
  code: EARLY_AFFILIATE_PROGRAM_CODE,
  name: EARLY_AFFILIATE_PROGRAM_NAME,
  commissionPolicyRef: CERTIFIED_COMMISSION_POLICY_REF,
  durationPolicyRef: QUALIFYING_DURATION_POLICY_REF,
  termsVersion: EARLY_TERMS_VERSION,
  subAffiliateLimit: null as number | null,
  capabilities: { ...GLOBAL_DEFAULT_CAPABILITIES },
  publicEarlyEnabled: true,
};

export type PublicCommercialRights = {
  main: boolean;
  network: boolean;
  promo: boolean;
};

/** What a new public signup receives. Existing enrollments are not rewritten. */
export function publicSignupCapabilities(
  program: PartialCaps,
  rights: PublicCommercialRights,
): PartialCaps {
  const grant: PartialCaps = { ...program };
  if (!rights.main) {
    grant.CAN_BECOME_MAIN = false;
    grant.CAN_EARN_MAIN_OVERRIDE = false;
  }
  if (!rights.network) {
    grant.CAN_INVITE_SUB_AFFILIATES = false;
    grant.CAN_HAVE_SUB_AFFILIATES = false;
    grant.CAN_ACCESS_NETWORK_DASHBOARD = false;
  }
  if (!rights.promo) {
    grant.CAN_CREATE_PROMO_CODES = false;
    grant.CAN_USE_PROMO_LIBRARY = false;
  }
  return grant;
}

export type AdminPresetId =
  | 'STANDARD'
  | 'MAIN_NETWORK'
  | 'REGIONAL'
  | 'COUNTRY'
  | 'CUSTOM';

export function adminCapabilityPreset(id: AdminPresetId): {
  privateCollaboration: boolean;
  capabilities: PartialCaps;
  subLimitMode: 'INHERIT' | 'LIMITED' | 'UNLIMITED';
  subLimit: number | null;
} {
  if (id === 'MAIN_NETWORK') {
    return {
      privateCollaboration: true,
      subLimitMode: 'UNLIMITED',
      subLimit: null,
      capabilities: {
        CAN_BECOME_MAIN: true,
        CAN_EARN_MAIN_OVERRIDE: true,
        CAN_INVITE_SUB_AFFILIATES: true,
        CAN_HAVE_SUB_AFFILIATES: true,
        CAN_ACCESS_NETWORK_DASHBOARD: true,
        CAN_CREATE_PROMO_CODES: true,
        CAN_USE_PROMO_LIBRARY: true,
        CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS: true,
      },
    };
  }
  if (id === 'REGIONAL' || id === 'COUNTRY') {
    return {
      privateCollaboration: true,
      subLimitMode: 'UNLIMITED',
      subLimit: null,
      capabilities: {
        CAN_BECOME_MAIN: true,
        CAN_INVITE_SUB_AFFILIATES: true,
        CAN_ACCESS_NETWORK_DASHBOARD: true,
        CAN_CREATE_PROMO_CODES: true,
        CAN_REQUEST_NEW_MARKET: id === 'COUNTRY',
        CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS: true,
      },
    };
  }
  if (id === 'STANDARD') {
    return {
      privateCollaboration: false,
      subLimitMode: 'LIMITED',
      subLimit: 0,
      capabilities: {
        CAN_BECOME_MAIN: false,
        CAN_EARN_MAIN_OVERRIDE: false,
        CAN_INVITE_SUB_AFFILIATES: false,
        CAN_ACCESS_NETWORK_DASHBOARD: false,
      },
    };
  }
  return {
    privateCollaboration: false,
    subLimitMode: 'INHERIT',
    subLimit: null,
    capabilities: {},
  };
}

export function catalogShowsNetwork(input: {
  audience: 'PUBLIC' | 'AFFILIATE' | 'ADMIN';
  publicMain: boolean;
  publicNetwork: boolean;
  effectiveMain: boolean;
  effectiveNetwork: boolean;
}): boolean {
  if (input.audience === 'ADMIN') return true;
  if (input.audience === 'AFFILIATE') return input.effectiveMain || input.effectiveNetwork;
  return input.publicMain || input.publicNetwork;
}

export function publicFacingLines(lines: string[], showNetwork: boolean): string[] {
  if (showNetwork) return lines;
  return lines.filter((line) => !/\bMAIN\b|\bSUB\b|netwerk|network/i.test(line));
}

export function publicFaqs<T extends { q: string; a: string }>(
  faqs: T[],
  rights: PublicCommercialRights,
): T[] {
  return faqs.filter((item) => {
    const text = `${item.q} ${item.a}`.toLowerCase();
    const networkTopic = /sub-affiliate|affiliates opbouwen|main-aandeel|main share|main\/sub/.test(text);
    const promoTopic = /promo/.test(text);
    if (!rights.main && !rights.network && networkTopic) return false;
    if (!rights.promo && promoTopic) return false;
    return true;
  });
}

export function publicPayload(value: Record<string, unknown>): Record<string, unknown> {
  const hidden = ['privateCollaboration', 'adminOverride', 'overrides', 'capturedCapabilities'];
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!hidden.includes(key)) out[key] = item;
  }
  return out;
}

export function coverageDecision(target: number | null, current: number): {
  targetReached: boolean;
  blocksAdmin: false;
  autoClose: false;
} {
  return {
    targetReached: target != null && current >= target,
    blocksAdmin: false,
    autoClose: false,
  };
}

export type DurationMode = 'WHILE_QUALIFYING' | 'FIXED_DURATION';
export type DurationClock =
  | 'FROM_CUSTOMER_ATTRIBUTION'
  | 'FROM_FIRST_QUALIFYING_PAYMENT'
  | 'PER_PRODUCT_RELATIONSHIP';

export type CommercialPolicyDraft = {
  code: string;
  status: 'DRAFT' | 'PUBLISHED';
  durationMode: DurationMode;
  durationMonths: number | null;
  durationClock: DurationClock | null;
  /** Basis points of the existing affiliate pool. Null keeps the certified product split. */
  directPoolBps: number | null;
  subPoolBps: number | null;
  mainPoolBps: number | null;
};

export function validateCommercialPolicy(
  draft: CommercialPolicyDraft,
): { ok: true } | { ok: false; reason: string } {
  const shares = [draft.directPoolBps, draft.subPoolBps, draft.mainPoolBps];
  for (const share of shares) {
    if (share != null && (share < 0 || share > 10000)) {
      return {
        ok: false,
        reason: 'Een aandeel moet tussen 0 en 100% van de bestaande affiliate-pool blijven. Een hoger aandeel maakt het HomeCheff-restant of de HC-reserve ongeldig.',
      };
    }
  }
  const sub = draft.subPoolBps ?? 0;
  const main = draft.mainPoolBps ?? 0;
  if (draft.subPoolBps != null || draft.mainPoolBps != null) {
    if (sub + main > 10000) {
      return {
        ok: false,
        reason: `SUB ${sub} plus MAIN ${main} basispunten is ${sub + main}. Dat is meer dan 100% van de affiliate-pool, dus het HomeCheff-restant zou negatief worden.`,
      };
    }
  }
  if (draft.durationMode === 'FIXED_DURATION') {
    if (!draft.durationMonths || draft.durationMonths < 1) {
      return { ok: false, reason: 'Een vaste duur heeft een aantal maanden nodig.' };
    }
    if (!draft.durationClock) {
      return { ok: false, reason: 'Een vaste duur heeft een expliciete klok nodig.' };
    }
  }
  return { ok: true };
}

export function decidePolicyWrite(
  existing: { status: 'DRAFT' | 'PUBLISHED' } | null,
  action: 'EDIT' | 'PUBLISH',
): { ok: true } | { ok: false; reason: string } {
  if (existing?.status === 'PUBLISHED') {
    return {
      ok: false,
      reason: 'Een gepubliceerde financiële versie wordt niet ter plaatse gewijzigd. Maak een nieuwe versie.',
    };
  }
  if (action === 'PUBLISH' && existing && existing.status !== 'DRAFT') {
    return { ok: false, reason: 'Alleen een concept kan worden gepubliceerd.' };
  }
  return { ok: true };
}

export function sliceAffiliatePool(input: {
  affiliateCents: number;
  homeCheffCents: number;
  hcCents: number;
  directPoolBps: number | null;
  subPoolBps: number | null;
  mainPoolBps: number | null;
}): {
  affiliateCents: number;
  subCents: number | null;
  mainCents: number | null;
  homeCheffCents: number;
  hcCents: number;
} {
  const affiliate = input.directPoolBps == null
    ? input.affiliateCents
    : Math.floor((input.affiliateCents * input.directPoolBps) / 10000);
  const sub = input.subPoolBps == null ? null : Math.floor((input.affiliateCents * input.subPoolBps) / 10000);
  const main = input.mainPoolBps == null ? null : Math.floor((input.affiliateCents * input.mainPoolBps) / 10000);
  const used = Math.max(affiliate, (sub ?? 0) + (main ?? 0));
  return {
    affiliateCents: affiliate,
    subCents: sub,
    mainCents: main,
    homeCheffCents: input.homeCheffCents + Math.max(0, input.affiliateCents - used),
    hcCents: input.hcCents,
  };
}

export const EARLY_DURATION_POLICY: CommercialPolicyDraft = {
  code: CERTIFIED_COMMISSION_POLICY_REF,
  status: 'PUBLISHED',
  durationMode: 'WHILE_QUALIFYING',
  durationMonths: null,
  durationClock: null,
  directPoolBps: null,
  subPoolBps: null,
  mainPoolBps: null,
};

export function durationForEnrollment(input: {
  enrolledPolicy: CommercialPolicyDraft;
  publicPolicy: CommercialPolicyDraft;
}): CommercialPolicyDraft {
  return input.enrolledPolicy;
}

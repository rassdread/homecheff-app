import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CAPABILITY_KEYS,
  EARLY_PROGRAM_DEFAULTS,
  type CapabilityContext,
  type CapabilityKey,
  type CapabilityMap,
  type RecruitmentState,
  decidePublicEnrollment,
  publicProposition,
  publicSignupCapabilities,
  resolveAffiliateCapabilities,
  validateCommercialPolicy,
  decidePolicyWrite,
  type CommercialPolicyDraft,
  type ResolvedAffiliateCapabilities,
} from '@/lib/affiliate/program-control';

const RECRUITMENT: RecruitmentState[] = ['OPEN', 'LIMITED', 'WAITLIST', 'CLOSED'];

function asCaps(value: unknown): Partial<CapabilityMap> {
  if (!value || typeof value !== 'object') return {};
  const out: Partial<CapabilityMap> = {};
  for (const key of CAPABILITY_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === 'boolean') out[key] = raw;
  }
  return out;
}

export async function loadMarket(countryCode = 'NL') {
  return prisma.affiliateMarketRecruitment.findUnique({
    where: { countryCode_regionCode: { countryCode, regionCode: '' } },
    include: { program: true },
  });
}

export async function loadPublicPresentation(countryCode = 'NL') {
  const market = await loadMarket(countryCode).catch(() => null);
  const program = market?.program;
  const recruitmentState = (RECRUITMENT.includes(market?.recruitmentState as RecruitmentState)
    ? market?.recruitmentState
    : 'OPEN') as RecruitmentState;
  const copy = publicProposition({
    recruitmentState,
    publicEarlyEnabled: program?.publicEarlyEnabled ?? true,
    programName: program?.name ?? EARLY_PROGRAM_DEFAULTS.name,
  });
  const rights = {
    main: market?.publicMainAvailable ?? true,
    network: market?.publicNetworkAvailable ?? true,
    promo: market?.publicPromoAvailable ?? true,
  };
  return {
    countryCode,
    recruitmentState,
    publicMain: rights.main,
    publicNetwork: rights.network,
    publicPromo: rights.promo,
    programCode: program?.code ?? EARLY_PROGRAM_DEFAULTS.code,
    programName: program?.name ?? EARLY_PROGRAM_DEFAULTS.name,
    commissionPolicyRef: program?.commissionPolicyRef ?? EARLY_PROGRAM_DEFAULTS.commissionPolicyRef,
    durationPolicyRef: program?.durationPolicyRef ?? EARLY_PROGRAM_DEFAULTS.durationPolicyRef,
    termsVersion: program?.termsVersion ?? EARLY_PROGRAM_DEFAULTS.termsVersion,
    signup: decidePublicEnrollment({
      recruitmentState,
      programCode: program?.code ?? EARLY_PROGRAM_DEFAULTS.code,
    }),
    copy,
  };
}

function contextFromRows(input: {
  status: string;
  programCaps: unknown;
  programSubLimit: number | null;
  enrollmentGrant: unknown;
  override: {
    directCommission: boolean | null;
    promoCodes: boolean | null;
    promoLibrary: boolean | null;
    inviteSubs: boolean | null;
    becomeMain: boolean | null;
    earnMainOverride: boolean | null;
    networkDashboard: boolean | null;
    commissionCatalog: boolean | null;
    advancedTools: boolean | null;
    newMarket: boolean | null;
    subLimitMode: string;
    subLimit: number | null;
    privateCollaboration: boolean;
  } | null;
}): CapabilityContext {
  const capabilities: Partial<CapabilityMap> = {};
  const map: Array<[CapabilityKey, boolean | null | undefined]> = [
    ['CAN_EARN_DIRECT_COMMISSION', input.override?.directCommission],
    ['CAN_CREATE_PROMO_CODES', input.override?.promoCodes],
    ['CAN_USE_PROMO_LIBRARY', input.override?.promoLibrary],
    ['CAN_INVITE_SUB_AFFILIATES', input.override?.inviteSubs],
    ['CAN_BECOME_MAIN', input.override?.becomeMain],
    ['CAN_EARN_MAIN_OVERRIDE', input.override?.earnMainOverride],
    ['CAN_ACCESS_NETWORK_DASHBOARD', input.override?.networkDashboard],
    ['CAN_ACCESS_COMMISSION_CATALOG', input.override?.commissionCatalog],
    ['CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS', input.override?.advancedTools],
    ['CAN_REQUEST_NEW_MARKET', input.override?.newMarket],
  ];
  for (const [key, value] of map) {
    if (typeof value === 'boolean') capabilities[key] = value;
  }
  const mode = input.override?.subLimitMode;
  return {
    suspended: input.status === 'SUSPENDED',
    program: {
      capabilities: asCaps(input.programCaps),
      subAffiliateLimit: input.programSubLimit,
    },
    enrollmentGrant: input.enrollmentGrant ? asCaps(input.enrollmentGrant) : null,
    adminOverride: input.override
      ? {
          capabilities,
          subLimitMode: mode === 'LIMITED' || mode === 'UNLIMITED' ? mode : 'INHERIT',
          subLimit: input.override.subLimit,
          privateCollaboration: input.override.privateCollaboration,
        }
      : null,
  };
}

export async function resolveStoredAffiliateCapabilities(
  affiliateId: string,
): Promise<ResolvedAffiliateCapabilities & { programCode: string | null; programName: string | null }> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      capabilityOverride: true,
      programEnrollment: { include: { program: true } },
    },
  });
  if (!affiliate) {
    const empty = resolveAffiliateCapabilities({
      suspended: true,
      program: { capabilities: {}, subAffiliateLimit: 0 },
    });
    return { ...empty, programCode: null, programName: null };
  }
  const program = affiliate.programEnrollment?.program;
  const resolved = resolveAffiliateCapabilities(
    contextFromRows({
      status: affiliate.status,
      programCaps: program?.capabilities ?? EARLY_PROGRAM_DEFAULTS.capabilities,
      programSubLimit: program?.subAffiliateLimit ?? EARLY_PROGRAM_DEFAULTS.subAffiliateLimit,
      enrollmentGrant: affiliate.programEnrollment?.capturedCapabilities ?? null,
      override: affiliate.capabilityOverride,
    }),
  );
  return {
    ...resolved,
    programCode: program?.code ?? null,
    programName: program?.name ?? null,
  };
}

export async function enrollAffiliate(input: {
  affiliateId: string;
  countryCode?: string;
  source: 'SIGNUP' | 'ADMIN' | 'MIGRATED_EXISTING';
  acceptedTerms: boolean;
  programCode?: string;
}) {
  const existing = await prisma.affiliateProgramEnrollment.findUnique({
    where: { affiliateId: input.affiliateId },
  });
  if (existing) return existing;
  const program = input.programCode
    ? await prisma.affiliateProgram.findUnique({ where: { code: input.programCode } })
    : await prisma.affiliateProgram.findFirst({ where: { isPublicDefault: true, status: 'ACTIVE' } });
  if (!program) return null;
  let capturedCapabilities: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
  if (input.source === 'SIGNUP') {
    const presentation = await loadPublicPresentation(input.countryCode ?? 'NL');
    capturedCapabilities = publicSignupCapabilities(asCaps(program.capabilities), {
      main: presentation.publicMain,
      network: presentation.publicNetwork,
      promo: presentation.publicPromo,
    }) as Prisma.InputJsonValue;
  }
  return prisma.affiliateProgramEnrollment.create({
    data: {
      affiliateId: input.affiliateId,
      programId: program.id,
      marketCountry: input.countryCode ?? 'NL',
      source: input.source,
      termsVersion: program.termsVersion,
      termsAcceptedAt: input.acceptedTerms ? new Date() : null,
      capturedCapabilities,
    },
  });
}

export async function publicSignupAllowed(countryCode = 'NL') {
  const presentation = await loadPublicPresentation(countryCode);
  return presentation.signup.allow === 'ENROLL';
}

async function audit(input: {
  adminUserId: string | null;
  targetType: string;
  targetId: string;
  action: string;
  previous: unknown;
  next: unknown;
  reason: string | null;
}) {
  await prisma.affiliateCommercialAudit.create({
    data: {
      adminUserId: input.adminUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      previous: input.previous === null || input.previous === undefined
        ? Prisma.JsonNull
        : (input.previous as Prisma.InputJsonValue),
      next: input.next === null || input.next === undefined
        ? Prisma.JsonNull
        : (input.next as Prisma.InputJsonValue),
      reason: input.reason,
    },
  });
}

export async function setMarketRecruitment(input: {
  adminUserId: string;
  countryCode: string;
  recruitmentState: RecruitmentState;
  reason: string;
}) {
  const previous = await loadMarket(input.countryCode);
  const program = await prisma.affiliateProgram.findFirst({
    where: { isPublicDefault: true, status: 'ACTIVE' },
  });
  const next = await prisma.affiliateMarketRecruitment.upsert({
    where: { countryCode_regionCode: { countryCode: input.countryCode, regionCode: '' } },
    create: {
      countryCode: input.countryCode,
      regionCode: '',
      recruitmentState: input.recruitmentState,
      programId: program?.id,
      homecheffActive: input.countryCode === 'NL',
    },
    update: { recruitmentState: input.recruitmentState },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'MARKET',
    targetId: input.countryCode,
    action: 'SET_RECRUITMENT',
    previous: { recruitmentState: previous?.recruitmentState ?? null },
    next: { recruitmentState: next.recruitmentState },
    reason: input.reason,
  });
  return next;
}

export async function setAffiliateOverride(input: {
  adminUserId: string;
  affiliateId: string;
  patch: {
    promoCodes?: boolean | null;
    inviteSubs?: boolean | null;
    becomeMain?: boolean | null;
    earnMainOverride?: boolean | null;
    networkDashboard?: boolean | null;
    advancedTools?: boolean | null;
    newMarket?: boolean | null;
    promoLibrary?: boolean | null;
    subLimitMode?: 'INHERIT' | 'LIMITED' | 'UNLIMITED';
    subLimit?: number | null;
    privateCollaboration?: boolean;
  };
  reason: string;
}) {
  const previous = await prisma.affiliateCapabilityOverride.findUnique({
    where: { affiliateId: input.affiliateId },
  });
  const data = {
    promoCodes: input.patch.promoCodes,
    promoLibrary: input.patch.promoLibrary,
    inviteSubs: input.patch.inviteSubs,
    becomeMain: input.patch.becomeMain,
    earnMainOverride: input.patch.earnMainOverride,
    networkDashboard: input.patch.networkDashboard,
    advancedTools: input.patch.advancedTools,
    newMarket: input.patch.newMarket,
    subLimitMode: input.patch.subLimitMode,
    subLimit: input.patch.subLimitMode === 'UNLIMITED' ? null : input.patch.subLimit,
    privateCollaboration: input.patch.privateCollaboration,
  };
  const next = await prisma.affiliateCapabilityOverride.upsert({
    where: { affiliateId: input.affiliateId },
    create: { affiliateId: input.affiliateId, ...data },
    update: data,
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'AFFILIATE',
    targetId: input.affiliateId,
    action: 'SET_CAPABILITY_OVERRIDE',
    previous,
    next,
    reason: input.reason,
  });
  return next;
}

export async function setProgramFlags(input: {
  adminUserId: string;
  programCode: string;
  publicEarlyEnabled?: boolean;
  isPublicDefault?: boolean;
  reason: string;
}) {
  const previous = await prisma.affiliateProgram.findUnique({ where: { code: input.programCode } });
  if (!previous) return { ok: false as const, reason: 'Dit programma bestaat niet.' };
  if (input.isPublicDefault) {
    await prisma.affiliateProgram.updateMany({ data: { isPublicDefault: false } });
  }
  const next = await prisma.affiliateProgram.update({
    where: { code: input.programCode },
    data: {
      publicEarlyEnabled: input.publicEarlyEnabled,
      isPublicDefault: input.isPublicDefault,
    },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'PROGRAM',
    targetId: previous.id,
    action: 'SET_PROGRAM_FLAGS',
    previous: {
      publicEarlyEnabled: previous.publicEarlyEnabled,
      isPublicDefault: previous.isPublicDefault,
    },
    next: {
      publicEarlyEnabled: next.publicEarlyEnabled,
      isPublicDefault: next.isPublicDefault,
    },
    reason: input.reason,
  });
  return { ok: true as const, enrollmentsRewritten: 0 as const };
}

export async function createAffiliateProgram(input: {
  adminUserId: string;
  code: string;
  name: string;
  reason: string;
}) {
  const existing = await prisma.affiliateProgram.findUnique({ where: { code: input.code } });
  if (existing) return { ok: false as const, reason: 'Deze programmacode bestaat al.' };
  const created = await prisma.affiliateProgram.create({
    data: {
      code: input.code,
      name: input.name,
      status: 'DRAFT',
      isPublicDefault: false,
      publicEarlyEnabled: false,
      commissionPolicyRef: 'CERTIFIED_CURRENT_ECONOMICS',
      durationPolicyRef: 'QUALIFYING_WHILE_ACTIVE',
      termsVersion: `${input.code}_TERMS`,
      subAffiliateLimit: null,
      capabilities: EARLY_PROGRAM_DEFAULTS.capabilities,
    },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'PROGRAM',
    targetId: created.id,
    action: 'CREATE_PROGRAM',
    previous: null,
    next: { code: created.code, status: created.status },
    reason: input.reason,
  });
  return { ok: true as const, code: created.code, economicsCopied: false as const };
}

export async function reassignAffiliateProgram(input: {
  adminUserId: string;
  affiliateId: string;
  programCode: string;
  reason: string;
}) {
  const program = await prisma.affiliateProgram.findUnique({ where: { code: input.programCode } });
  if (!program) {
    return { ok: false as const, reason: 'Dit programma bestaat niet.' };
  }
  const previous = await prisma.affiliateProgramEnrollment.findUnique({
    where: { affiliateId: input.affiliateId },
  });
  const next = await prisma.affiliateProgramEnrollment.upsert({
    where: { affiliateId: input.affiliateId },
    create: {
      affiliateId: input.affiliateId,
      programId: program.id,
      source: 'ADMIN',
      termsVersion: program.termsVersion,
      termsAcceptedAt: null,
    },
    update: {
      programId: program.id,
      termsVersion: program.termsVersion,
      capturedCapabilities: Prisma.JsonNull,
    },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'AFFILIATE',
    targetId: input.affiliateId,
    action: 'REASSIGN_PROGRAM',
    previous: { programId: previous?.programId ?? null },
    next: { programId: next.programId },
    reason: input.reason,
  });
  return { ok: true as const, ledgerTouched: false as const };
}

export async function setPublicAvailability(input: {
  adminUserId: string;
  countryCode: string;
  publicMain?: boolean;
  publicNetwork?: boolean;
  publicPromo?: boolean;
  desiredMainCount?: number | null;
  desiredActiveCount?: number | null;
  programCode?: string;
  reason: string;
}) {
  const previous = await loadMarket(input.countryCode);
  const nextProgram = input.programCode
    ? await prisma.affiliateProgram.findUnique({ where: { code: input.programCode } })
    : null;
  if (input.programCode && !nextProgram) {
    return { ok: false as const, reason: 'Dit programma bestaat niet.' };
  }
  const next = await prisma.affiliateMarketRecruitment.update({
    where: { countryCode_regionCode: { countryCode: input.countryCode, regionCode: '' } },
    data: {
      publicMainAvailable: input.publicMain,
      publicNetworkAvailable: input.publicNetwork,
      publicPromoAvailable: input.publicPromo,
      desiredMainCount: input.desiredMainCount,
      desiredActiveCount: input.desiredActiveCount,
      programId: nextProgram?.id,
    },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'MARKET',
    targetId: input.countryCode,
    action: 'SET_PUBLIC_AVAILABILITY',
    previous: {
      publicMain: previous?.publicMainAvailable ?? null,
      publicNetwork: previous?.publicNetworkAvailable ?? null,
      publicPromo: previous?.publicPromoAvailable ?? null,
    },
    next: {
      publicMain: next.publicMainAvailable,
      publicNetwork: next.publicNetworkAvailable,
      publicPromo: next.publicPromoAvailable,
    },
    reason: input.reason,
  });
  return { ok: true as const, market: next, enrollmentsRewritten: 0 as const };
}

export async function saveCommercialPolicyDraft(input: {
  adminUserId: string;
  draft: CommercialPolicyDraft;
  reason: string;
}) {
  const existing = await prisma.affiliateCommercialPolicy.findUnique({ where: { code: input.draft.code } });
  const gate = decidePolicyWrite(existing ? { status: existing.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' } : null, 'EDIT');
  if (!gate.ok) return gate;
  const check = validateCommercialPolicy({ ...input.draft, status: 'DRAFT' });
  if (!check.ok) return check;
  const saved = await prisma.affiliateCommercialPolicy.upsert({
    where: { code: input.draft.code },
    create: {
      code: input.draft.code,
      status: 'DRAFT',
      durationMode: input.draft.durationMode,
      durationMonths: input.draft.durationMonths,
      durationClock: input.draft.durationClock,
      directPoolBps: input.draft.directPoolBps,
      subPoolBps: input.draft.subPoolBps,
      mainPoolBps: input.draft.mainPoolBps,
    },
    update: {
      durationMode: input.draft.durationMode,
      durationMonths: input.draft.durationMonths,
      durationClock: input.draft.durationClock,
      directPoolBps: input.draft.directPoolBps,
      subPoolBps: input.draft.subPoolBps,
      mainPoolBps: input.draft.mainPoolBps,
    },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'POLICY',
    targetId: saved.id,
    action: 'SAVE_POLICY_DRAFT',
    previous: existing ? { status: existing.status } : null,
    next: { code: saved.code, status: saved.status },
    reason: input.reason,
  });
  return { ok: true as const, code: saved.code, currentEconomicsChanged: false as const };
}

export async function publishCommercialPolicy(input: {
  adminUserId: string;
  code: string;
  reason: string;
}) {
  const existing = await prisma.affiliateCommercialPolicy.findUnique({ where: { code: input.code } });
  if (!existing) return { ok: false as const, reason: 'Dit concept bestaat niet.' };
  const gate = decidePolicyWrite({ status: existing.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' }, 'PUBLISH');
  if (!gate.ok) return gate;
  const check = validateCommercialPolicy({
    code: existing.code,
    status: 'DRAFT',
    durationMode: existing.durationMode === 'FIXED_DURATION' ? 'FIXED_DURATION' : 'WHILE_QUALIFYING',
    durationMonths: existing.durationMonths,
    durationClock: existing.durationClock as CommercialPolicyDraft['durationClock'],
    directPoolBps: existing.directPoolBps,
    subPoolBps: existing.subPoolBps,
    mainPoolBps: existing.mainPoolBps,
  });
  if (!check.ok) return check;
  const published = await prisma.affiliateCommercialPolicy.update({
    where: { code: input.code },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  await audit({
    adminUserId: input.adminUserId,
    targetType: 'POLICY',
    targetId: published.id,
    action: 'PUBLISH_POLICY',
    previous: { status: existing.status },
    next: { status: published.status },
    reason: input.reason,
  });
  return { ok: true as const, earlyPolicyUntouched: true as const };
}

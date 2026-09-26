import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activatePersonalAffiliate } from '@/lib/affiliate/activate-affiliate';
import {
  decideAdminAdmission,
  decideLedgerMutation,
  impactPreview,
  type RecruitmentState,
} from '@/lib/affiliate/program-control';
import {
  enrollAffiliate,
  createAffiliateProgram,
  publishCommercialPolicy,
  reassignAffiliateProgram,
  resolveStoredAffiliateCapabilities,
  saveCommercialPolicyDraft,
  setAffiliateOverride,
  setMarketRecruitment,
  setProgramFlags,
  setPublicAvailability,
} from '@/lib/affiliate/program-store';
import { adminCapabilityPreset, coverageDecision, validateCommercialPolicy, type AdminPresetId } from '@/lib/affiliate/program-control';

export const dynamic = 'force-dynamic';

async function staff() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return null;
  return user;
}

export async function GET(req: Request) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const affiliateId = new URL(req.url).searchParams.get('affiliateId');
  const [programs, markets, affiliates, mains, subs, enrollments, migrated, promos, attributions, ledgers] =
    await Promise.all([
      prisma.affiliateProgram.findMany({ orderBy: { effectiveFrom: 'asc' } }),
      prisma.affiliateMarketRecruitment.findMany({ include: { program: true } }),
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { parentAffiliateId: null } }),
      prisma.affiliate.count({ where: { parentAffiliateId: { not: null } } }),
      prisma.affiliateProgramEnrollment.count(),
      prisma.affiliateProgramEnrollment.count({ where: { source: 'MIGRATED_EXISTING' } }),
      prisma.promoCode.count({ where: { affiliateId: { not: null } } }),
      prisma.attribution.count(),
      prisma.commissionLedger.count(),
    ]);
  const active = await prisma.affiliate.count({ where: { status: 'ACTIVE' } });
  const detail = affiliateId ? await resolveStoredAffiliateCapabilities(affiliateId) : null;
  const preview = impactPreview({
    existingEnrolledOnProgram: enrollments,
    grandfathered: migrated,
    publicDefaultChanging: false,
  });
  return NextResponse.json({
    programs,
    markets,
    counts: {
      affiliates,
      mains,
      subs,
      active,
      enrollments,
      migrated,
      promos,
      attributions,
      ledgers,
    },
    detail,
    preview,
  });
}

export async function POST(req: Request) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '');
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!body?.confirm || reason.length < 3) {
    return NextResponse.json(
      { error: 'Bevestig de wijziging en vul een reden in.' },
      { status: 400 },
    );
  }

  if (action === 'deleteLedger') {
    const decision = decideLedgerMutation('DELETE');
    return NextResponse.json(
      {
        error: 'Het historische commissiegrootboek kan niet worden gewist.',
        correction:
          'Gebruik een terugboeking of correctie. Bestaande boekingen, uitbetalingen en refunds blijven staan.',
        decision,
      },
      { status: 409 },
    );
  }

  if (action === 'setPublicAvailability') {
    const result = await setPublicAvailability({
      adminUserId: actor.id,
      countryCode: String(body.countryCode || 'NL').toUpperCase(),
      publicMain: typeof body.publicMain === 'boolean' ? body.publicMain : undefined,
      publicNetwork: typeof body.publicNetwork === 'boolean' ? body.publicNetwork : undefined,
      publicPromo: typeof body.publicPromo === 'boolean' ? body.publicPromo : undefined,
      desiredMainCount: typeof body.desiredMainCount === 'number' ? body.desiredMainCount : undefined,
      desiredActiveCount: typeof body.desiredActiveCount === 'number' ? body.desiredActiveCount : undefined,
      programCode: typeof body.programCode === 'string' ? body.programCode : undefined,
      reason,
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    const mains = await prisma.affiliate.count({ where: { parentAffiliateId: null } });
    return NextResponse.json({
      ...result,
      coverage: coverageDecision(result.market.desiredMainCount, mains),
      existingEnrollmentsChanged: 0,
      financialHistoryPreserved: true,
    });
  }

  if (action === 'applyPreset') {
    const preset = adminCapabilityPreset(String(body.preset || 'CUSTOM') as AdminPresetId);
    const limit = typeof body.subLimit === 'number' ? body.subLimit : preset.subLimit;
    const mode = body.subLimitMode || preset.subLimitMode;
    const saved = await setAffiliateOverride({
      adminUserId: actor.id,
      affiliateId: String(body.affiliateId || ''),
      patch: {
        becomeMain: preset.capabilities.CAN_BECOME_MAIN,
        earnMainOverride: preset.capabilities.CAN_EARN_MAIN_OVERRIDE,
        inviteSubs: preset.capabilities.CAN_INVITE_SUB_AFFILIATES,
        networkDashboard: preset.capabilities.CAN_ACCESS_NETWORK_DASHBOARD,
        promoCodes: preset.capabilities.CAN_CREATE_PROMO_CODES,
        promoLibrary: preset.capabilities.CAN_USE_PROMO_LIBRARY,
        advancedTools: preset.capabilities.CAN_ACCESS_ADVANCED_AFFILIATE_TOOLS,
        newMarket: preset.capabilities.CAN_REQUEST_NEW_MARKET,
        subLimitMode: mode,
        subLimit: limit,
        privateCollaboration: preset.privateCollaboration,
      },
      reason,
    });
    return NextResponse.json({ saved, publicProgramUnchanged: true, ledgerTouched: false });
  }

  if (action === 'validatePolicy') {
    const result = validateCommercialPolicy({
      code: String(body.code || 'DRAFT'),
      status: 'DRAFT',
      durationMode: body.durationMode === 'FIXED_DURATION' ? 'FIXED_DURATION' : 'WHILE_QUALIFYING',
      durationMonths: typeof body.durationMonths === 'number' ? body.durationMonths : null,
      durationClock: body.durationClock || null,
      directPoolBps: typeof body.directPoolBps === 'number' ? body.directPoolBps : null,
      subPoolBps: typeof body.subPoolBps === 'number' ? body.subPoolBps : null,
      mainPoolBps: typeof body.mainPoolBps === 'number' ? body.mainPoolBps : null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }

  if (action === 'savePolicyDraft') {
    const result = await saveCommercialPolicyDraft({
      adminUserId: actor.id,
      reason,
      draft: {
        code: String(body.code || ''),
        status: 'DRAFT',
        durationMode: body.durationMode === 'FIXED_DURATION' ? 'FIXED_DURATION' : 'WHILE_QUALIFYING',
        durationMonths: typeof body.durationMonths === 'number' ? body.durationMonths : null,
        durationClock: body.durationClock || null,
        directPoolBps: typeof body.directPoolBps === 'number' ? body.directPoolBps : null,
        subPoolBps: typeof body.subPoolBps === 'number' ? body.subPoolBps : null,
        mainPoolBps: typeof body.mainPoolBps === 'number' ? body.mainPoolBps : null,
      },
    });
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === 'publishPolicy') {
    const result = await publishCommercialPolicy({
      adminUserId: actor.id,
      code: String(body.code || ''),
      reason,
    });
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === 'setRecruitment') {
    const state = String(body.recruitmentState || '') as RecruitmentState;
    if (!['OPEN', 'LIMITED', 'WAITLIST', 'CLOSED'].includes(state)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }
    const market = await setMarketRecruitment({
      adminUserId: actor.id,
      countryCode: String(body.countryCode || 'NL').toUpperCase(),
      recruitmentState: state,
      reason,
    });
    return NextResponse.json({
      market,
      unchanged: 'Bestaande affiliates, portefeuilles en commissies blijven staan.',
    });
  }

  if (action === 'setOverride' || action === 'resetOverride') {
    const affiliateId = String(body.affiliateId || '');
    if (!affiliateId) return NextResponse.json({ error: 'Affiliate ontbreekt' }, { status: 400 });
    const patch = action === 'resetOverride'
      ? {
          promoCodes: null,
          promoLibrary: null,
          inviteSubs: null,
          becomeMain: null,
          earnMainOverride: null,
          networkDashboard: null,
          advancedTools: null,
          newMarket: null,
          subLimitMode: 'INHERIT' as const,
          subLimit: null,
        }
      : {
          promoCodes: body.promoCodes,
          promoLibrary: body.promoLibrary,
          inviteSubs: body.inviteSubs,
          becomeMain: body.becomeMain,
          earnMainOverride: body.earnMainOverride,
          networkDashboard: body.networkDashboard,
          advancedTools: body.advancedTools,
          newMarket: body.newMarket,
          subLimitMode: body.subLimitMode,
          subLimit: body.subLimit,
        };
    const saved = await setAffiliateOverride({
      adminUserId: actor.id,
      affiliateId,
      patch,
      reason,
    });
    const effective = await resolveStoredAffiliateCapabilities(affiliateId);
    return NextResponse.json({ saved, effective, ledgerTouched: false });
  }

  if (action === 'setProgramFlags') {
    const result = await setProgramFlags({
      adminUserId: actor.id,
      programCode: String(body.programCode || ''),
      publicEarlyEnabled: typeof body.publicEarlyEnabled === 'boolean' ? body.publicEarlyEnabled : undefined,
      isPublicDefault: body.isPublicDefault === true ? true : undefined,
      reason,
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    return NextResponse.json(result);
  }

  if (action === 'createProgram') {
    const code = String(body.programCode || '').trim();
    const name = String(body.name || '').trim();
    if (!/^[A-Z0-9_]+$/.test(code) || name.length < 2) {
      return NextResponse.json({ error: 'Gebruik een programmacode als STANDARD_AFFILIATE_V2 en een naam.' }, { status: 400 });
    }
    const result = await createAffiliateProgram({
      adminUserId: actor.id,
      code,
      name,
      reason,
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    return NextResponse.json(result);
  }

  if (action === 'reassignProgram') {
    const result = await reassignAffiliateProgram({
      adminUserId: actor.id,
      affiliateId: String(body.affiliateId || ''),
      programCode: String(body.programCode || ''),
      reason,
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    return NextResponse.json(result);
  }

  if (action === 'admit') {
    const email = String(body.email || '').trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { affiliate: true },
    });
    const decision = decideAdminAdmission({
      actorRole: actor.role,
      userExists: Boolean(user),
      alreadyAffiliate: Boolean(user?.affiliate),
    });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.reason, code: decision.code }, { status: 409 });
    }
    const activated = await activatePersonalAffiliate(user!.id);
    await enrollAffiliate({
      affiliateId: activated.affiliateId,
      source: 'ADMIN',
      acceptedTerms: false,
      programCode: body.programCode ? String(body.programCode) : undefined,
      countryCode: String(body.countryCode || 'NL'),
    });
    await prisma.affiliateCommercialAudit.create({
      data: {
        adminUserId: actor.id,
        targetType: 'AFFILIATE',
        targetId: activated.affiliateId,
        action: 'ADMIN_ADMIT',
        previous: Prisma.JsonNull,
        next: { email, marketUnchanged: true },
        reason,
      },
    });
    return NextResponse.json({
      affiliateId: activated.affiliateId,
      marketUnchanged: true,
      financialHistoryPreserved: true,
    });
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 });
}

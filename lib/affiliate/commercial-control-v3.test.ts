import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { affiliatePropositionFaqs } from './proposition-faqs';
import { getAffiliateLandingFaqJsonLd } from '@/lib/seo/affiliateLandingStructuredData';
import {
  EARLY_DURATION_POLICY,
  EARLY_PROGRAM_DEFAULTS,
  adminCapabilityPreset,
  catalogShowsNetwork,
  coverageDecision,
  decideAdminAdmission,
  decideLedgerMutation,
  decidePolicyWrite,
  decidePublicEnrollment,
  decideSubInvite,
  durationForEnrollment,
  enrollmentSurvivesDefaultChange,
  publicFaqs,
  publicPayload,
  publicSignupCapabilities,
  resolveAffiliateCapabilities,
  sliceAffiliatePool,
  validateCommercialPolicy,
} from './program-control';

const early = {
  capabilities: EARLY_PROGRAM_DEFAULTS.capabilities,
  subAffiliateLimit: null as number | null,
};
const off = { main: false, network: false, promo: false };
const on = { main: true, network: true, promo: true };

describe('affiliate commercial control v3', () => {
  it('keeps public Early MAIN when the public flags are on', () => {
    const grant = publicSignupCapabilities(early.capabilities, on);
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      program: early,
      enrollmentGrant: grant,
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, true);
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, true);
  });

  it('withholds MAIN and network from a new public affiliate when those flags are off', () => {
    const grant = publicSignupCapabilities(early.capabilities, off);
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      program: early,
      enrollmentGrant: grant,
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, false);
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, false);
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.source, 'ENROLLMENT');
  });

  it('lets admin grant MAIN, promo and unlimited direct subs while public flags stay off', () => {
    const grant = publicSignupCapabilities(early.capabilities, off);
    const preset = adminCapabilityPreset('MAIN_NETWORK');
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      program: { ...early, subAffiliateLimit: 1 },
      enrollmentGrant: grant,
      adminOverride: {
        capabilities: preset.capabilities,
        subLimitMode: preset.subLimitMode,
        subLimit: preset.subLimit,
        privateCollaboration: preset.privateCollaboration,
      },
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, true);
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.source, 'ADMIN_OVERRIDE');
    assert.equal(resolved.capabilities.CAN_CREATE_PROMO_CODES.value, true);
    assert.equal(resolved.subAffiliateLimit.value, null);
    assert.equal(resolved.privateCollaboration, true);
    assert.equal(
      decideSubInvite({ resolved, hasParent: false, childCount: 40, pendingInvites: 0, adminForce: false }).ok,
      true,
    );
    assert.equal(decidePublicEnrollment({ recruitmentState: 'CLOSED', programCode: 'STANDARD_AFFILIATE_V2' }).allow, 'CLOSED');
    const admin = decideAdminAdmission({ actorRole: 'SUPERADMIN', userExists: true, alreadyAffiliate: false });
    assert.equal(admin.ok, true);
  });

  it('hides MAIN from public copy, catalog, calculator and structured data', () => {
    const faqs = publicFaqs(affiliatePropositionFaqs('nl'), off);
    assert.equal(faqs.some((item) => /affiliates opbouwen/i.test(item.q)), false);
    assert.equal(faqs.some((item) => /promo/i.test(item.q)), false);
    const json = JSON.stringify(getAffiliateLandingFaqJsonLd('nl', faqs));
    assert.equal(/sub-affiliate|MAIN\/SUB|handmatig|private collaboration/i.test(json), false);
    assert.equal(catalogShowsNetwork({ audience: 'PUBLIC', publicMain: false, publicNetwork: false, effectiveMain: false, effectiveNetwork: false }), false);
    assert.equal(catalogShowsNetwork({ audience: 'AFFILIATE', publicMain: false, publicNetwork: false, effectiveMain: true, effectiveNetwork: true }), true);
    assert.equal(catalogShowsNetwork({ audience: 'ADMIN', publicMain: false, publicNetwork: false, effectiveMain: false, effectiveNetwork: false }), true);
  });

  it('keeps an existing Early MAIN when public MAIN is later turned off', () => {
    const existing = resolveAffiliateCapabilities({ suspended: false, program: early, enrollmentGrant: null });
    assert.equal(existing.capabilities.CAN_BECOME_MAIN.value, true);
    assert.equal(existing.capabilities.CAN_BECOME_MAIN.source, 'PROGRAM');
    const kept = enrollmentSurvivesDefaultChange({
      enrolledProgramCode: 'EARLY_AFFILIATE_V1',
      newPublicDefaultCode: 'STANDARD_AFFILIATE_V2',
    });
    assert.equal(kept.programCode, 'EARLY_AFFILIATE_V1');
  });

  it('does not leak private collaboration through a public payload', () => {
    const payload = publicPayload({
      programName: 'Vroege instap',
      privateCollaboration: true,
      adminOverride: { main: true },
      publicMain: true,
    });
    assert.equal('privateCollaboration' in payload, false);
    assert.equal('adminOverride' in payload, false);
    assert.equal(payload.programName, 'Vroege instap');
    const stranger = decideAdminAdmission({ actorRole: 'USER', userExists: true, alreadyAffiliate: false });
    assert.equal(stranger.ok, false);
    const publicRoute = readFileSync('app/api/affiliate/public-program/route.ts', 'utf8');
    const ownRoute = readFileSync('app/api/affiliate/my-program/route.ts', 'utf8');
    assert.equal(publicRoute.includes('privateCollaboration'), false);
    assert.equal(ownRoute.includes('privateCollaboration'), false);
    assert.equal(ownRoute.includes('ADMIN_OVERRIDE'), false);
  });

  it('validates future policies without touching the Early duration', () => {
    assert.equal(validateCommercialPolicy({ ...EARLY_DURATION_POLICY }).ok, true);
    const invalid = validateCommercialPolicy({
      code: 'BROKEN',
      status: 'DRAFT',
      durationMode: 'WHILE_QUALIFYING',
      durationMonths: null,
      durationClock: null,
      directPoolBps: null,
      subPoolBps: 7000,
      mainPoolBps: 5000,
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.match(invalid.reason, /12000/);
    const draft = validateCommercialPolicy({
      code: 'STANDARD_AFFILIATE_V2_POLICY',
      status: 'DRAFT',
      durationMode: 'FIXED_DURATION',
      durationMonths: 24,
      durationClock: 'FROM_FIRST_QUALIFYING_PAYMENT',
      directPoolBps: 10000,
      subPoolBps: 8000,
      mainPoolBps: 2000,
    });
    assert.equal(draft.ok, true);
    assert.equal(decidePolicyWrite({ status: 'PUBLISHED' }, 'EDIT').ok, false);
    assert.equal(decidePolicyWrite({ status: 'DRAFT' }, 'EDIT').ok, true);
    const earlyStill = durationForEnrollment({
      enrolledPolicy: EARLY_DURATION_POLICY,
      publicPolicy: {
        ...EARLY_DURATION_POLICY,
        code: 'V2',
        durationMode: 'FIXED_DURATION',
        durationMonths: 12,
        durationClock: 'FROM_CUSTOMER_ATTRIBUTION',
      },
    });
    assert.equal(earlyStill.durationMode, 'WHILE_QUALIFYING');
    const sliced = sliceAffiliatePool({
      affiliateCents: 1575,
      homeCheffCents: 1575,
      hcCents: 750,
      directPoolBps: null,
      subPoolBps: null,
      mainPoolBps: null,
    });
    assert.equal(sliced.affiliateCents, 1575);
    assert.equal(sliced.hcCents, 750);
    const blocked = decideLedgerMutation('DELETE');
    assert.equal(blocked.ok, false);
  });

  it('does not let a reached coverage target block another private MAIN', () => {
    const coverage = coverageDecision(10, 10);
    assert.equal(coverage.targetReached, true);
    assert.equal(coverage.blocksAdmin, false);
    assert.equal(coverage.autoClose, false);
    const reset = resolveAffiliateCapabilities({
      suspended: false,
      program: { capabilities: { ...early.capabilities, CAN_BECOME_MAIN: false }, subAffiliateLimit: 1 },
      adminOverride: { capabilities: {}, subLimitMode: 'INHERIT', subLimit: null },
    });
    assert.equal(reset.capabilities.CAN_BECOME_MAIN.value, false);
    assert.equal(reset.capabilities.CAN_BECOME_MAIN.source, 'PROGRAM');
    assert.equal(reset.subAffiliateLimit.value, 1);
  });
});

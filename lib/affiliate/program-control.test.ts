import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EARLY_AFFILIATE_PROGRAM_CODE,
  EARLY_PROGRAM_DEFAULTS,
  catalogView,
  commissionStillApplies,
  decideAdminAdmission,
  decideLedgerMutation,
  decidePublicEnrollment,
  decideSubInvite,
  durationCopy,
  enrollmentSurvivesDefaultChange,
  impactPreview,
  publicProposition,
  resolveAffiliateCapabilities,
} from './program-control';

const early = {
  capabilities: EARLY_PROGRAM_DEFAULTS.capabilities,
  subAffiliateLimit: null as number | null,
};

describe('affiliate program control', () => {
  it('enrolls an early affiliate with current capabilities', () => {
    const resolved = resolveAffiliateCapabilities({ suspended: false, program: early });
    assert.equal(resolved.capabilities.CAN_CREATE_PROMO_CODES.value, true);
    assert.equal(resolved.capabilities.CAN_CREATE_PROMO_CODES.source, 'PROGRAM');
    assert.equal(resolved.subAffiliateLimit.value, null);
  });

  it('keeps an existing affiliate after the market closes', () => {
    const resolved = resolveAffiliateCapabilities({ suspended: false, program: early });
    assert.equal(
      commissionStillApplies({
        enrolled: true,
        suspended: false,
        canEarn: resolved.capabilities.CAN_EARN_DIRECT_COMMISSION.value,
        recruitmentState: 'CLOSED',
      }),
      true,
    );
    assert.equal(decidePublicEnrollment({ recruitmentState: 'CLOSED', programCode: EARLY_AFFILIATE_PROGRAM_CODE }).allow, 'CLOSED');
  });

  it('blocks a second invite at limit 1 and allows unlimited', () => {
    const limited = resolveAffiliateCapabilities({
      suspended: false,
      program: { ...early, subAffiliateLimit: 1 },
    });
    assert.equal(
      decideSubInvite({ resolved: limited, hasParent: false, childCount: 1, pendingInvites: 0, adminForce: false }).ok,
      false,
    );
    const open = resolveAffiliateCapabilities({ suspended: false, program: early });
    assert.equal(
      decideSubInvite({ resolved: open, hasParent: false, childCount: 4, pendingInvites: 0, adminForce: false }).ok,
      true,
    );
  });

  it('lets an admin override beat the program, then fall back when removed', () => {
    const overridden = resolveAffiliateCapabilities({
      suspended: false,
      program: {
        capabilities: { ...early.capabilities, CAN_CREATE_PROMO_CODES: false, CAN_BECOME_MAIN: false },
        subAffiliateLimit: 1,
      },
      adminOverride: {
        capabilities: { CAN_CREATE_PROMO_CODES: true, CAN_BECOME_MAIN: true },
        subLimitMode: 'UNLIMITED',
        subLimit: null,
      },
    });
    assert.equal(overridden.capabilities.CAN_CREATE_PROMO_CODES.value, true);
    assert.equal(overridden.capabilities.CAN_CREATE_PROMO_CODES.source, 'ADMIN_OVERRIDE');
    assert.equal(overridden.capabilities.CAN_BECOME_MAIN.value, true);
    assert.equal(overridden.subAffiliateLimit.value, null);
    assert.equal(
      decideSubInvite({ resolved: overridden, hasParent: false, childCount: 3, pendingInvites: 0, adminForce: false }).ok,
      true,
    );

    const reset = resolveAffiliateCapabilities({
      suspended: false,
      program: {
        capabilities: { ...early.capabilities, CAN_CREATE_PROMO_CODES: false },
        subAffiliateLimit: 1,
      },
      adminOverride: { capabilities: {}, subLimitMode: 'INHERIT', subLimit: null },
    });
    assert.equal(reset.capabilities.CAN_CREATE_PROMO_CODES.value, false);
    assert.equal(reset.capabilities.CAN_CREATE_PROMO_CODES.source, 'PROGRAM');
    assert.equal(reset.subAffiliateLimit.value, 1);
    assert.equal(reset.subAffiliateLimit.source, 'PROGRAM');
  });

  it('lets suspension beat an affiliate override', () => {
    const resolved = resolveAffiliateCapabilities({
      suspended: true,
      program: early,
      adminOverride: {
        capabilities: { CAN_INVITE_SUB_AFFILIATES: true },
        subLimitMode: 'UNLIMITED',
        subLimit: null,
      },
    });
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, false);
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.source, 'SUSPENSION');
  });

  it('blocks public signup when closed and allows admin admission', () => {
    assert.equal(decidePublicEnrollment({ recruitmentState: 'CLOSED', programCode: 'EARLY_AFFILIATE_V1' }).allow, 'CLOSED');
    const admin = decideAdminAdmission({ actorRole: 'SUPERADMIN', userExists: true, alreadyAffiliate: false });
    assert.equal(admin.ok, true);
    const stranger = decideAdminAdmission({ actorRole: 'USER', userExists: true, alreadyAffiliate: false });
    assert.equal(stranger.ok, false);
  });

  it('does not let a future program rewrite a grandfathered enrollment or the ledger', () => {
    const kept = enrollmentSurvivesDefaultChange({
      enrolledProgramCode: 'EARLY_AFFILIATE_V1',
      newPublicDefaultCode: 'STANDARD_AFFILIATE_V2',
    });
    assert.equal(kept.programCode, 'EARLY_AFFILIATE_V1');
    assert.equal(kept.changed, false);
    const blocked = decideLedgerMutation('DELETE');
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.correction, 'REVERSAL');
    assert.equal(decideLedgerMutation('REVERSAL').ok, true);
    const preview = impactPreview({
      existingEnrolledOnProgram: 12,
      grandfathered: 12,
      publicDefaultChanging: true,
    });
    assert.equal(preview.existingAffiliatesRewritten, 0);
    assert.equal(preview.grandfatheredPreserved, 12);
  });

  it('keeps year-5 qualification under the early duration policy', () => {
    assert.equal(EARLY_PROGRAM_DEFAULTS.durationPolicyRef, 'QUALIFYING_WHILE_ACTIVE');
    assert.equal(EARLY_PROGRAM_DEFAULTS.commissionPolicyRef, 'CERTIFIED_CURRENT_ECONOMICS');
    for (const months of [13, 24, 60]) {
      assert.equal(
        commissionStillApplies({
          enrolled: true,
          suspended: false,
          canEarn: true,
          recruitmentState: 'CLOSED',
        }),
        true,
        String(months),
      );
    }
  });

  it('changes public copy with recruitment state and stays program-aware', () => {
    const earlyCopy = publicProposition({
      recruitmentState: 'OPEN',
      publicEarlyEnabled: true,
      programName: 'Vroege instap',
    });
    assert.equal(earlyCopy.tone, 'EARLY');
    assert.match(earlyCopy.lead, /bouwt momenteel/);
    assert.equal(earlyCopy.lead.includes('12 maanden'), false);
    assert.equal(earlyCopy.lead.includes('365'), false);
    assert.equal(publicProposition({ recruitmentState: 'LIMITED', publicEarlyEnabled: true, programName: 'Vroege instap' }).tone, 'LIMITED');
    assert.equal(publicProposition({ recruitmentState: 'WAITLIST', publicEarlyEnabled: true, programName: 'Vroege instap' }).tone, 'WAITLIST');
    assert.equal(publicProposition({ recruitmentState: 'CLOSED', publicEarlyEnabled: true, programName: 'Vroege instap' }).tone, 'CLOSED');
    const duration = durationCopy('Vroege instap');
    assert.match(duration, /2, 5 of 20 jaar/);
    assert.equal(duration.includes('12 maanden'), false);
    assert.equal(duration.includes('365'), false);
    assert.equal(
      catalogView({ audience: 'AUTHENTICATED', publicProgramCode: 'STANDARD_AFFILIATE_V2', enrolledProgramCode: 'EARLY_AFFILIATE_V1' }).programCode,
      'EARLY_AFFILIATE_V1',
    );
    assert.equal(
      catalogView({ audience: 'PUBLIC', publicProgramCode: 'STANDARD_AFFILIATE_V2', enrolledProgramCode: 'EARLY_AFFILIATE_V1' }).programCode,
      'STANDARD_AFFILIATE_V2',
    );
  });

  it('does not turn off early copy while the market stays open and the flag is on', () => {
    const off = publicProposition({
      recruitmentState: 'OPEN',
      publicEarlyEnabled: false,
      programName: 'Vroege instap',
    });
    assert.equal(off.tone, 'OPEN');
    assert.equal(off.badge, null);
  });
});

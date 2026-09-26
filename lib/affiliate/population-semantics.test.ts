import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { decideSubInvite, EARLY_PROGRAM_DEFAULTS, enrollmentSurvivesDefaultChange, resolveAffiliateCapabilities } from './program-control';
import {
  POPULATION_COMMERCIAL,
  POPULATION_EXCLUDED_TEST,
  POPULATION_INTERNAL,
  POPULATION_REVIEW,
  POPULATION_TECHNICAL,
  SOURCE_ADMIN_ADMISSION,
  SOURCE_MIGRATED_EXISTING,
  SOURCE_PARTNER_INVITE,
  SOURCE_PUBLIC_SIGNUP,
  SOURCE_TECHNICAL_COMMISSION,
  isAdminAdmission,
  isCommercialAffiliateParticipant,
  isConfirmedPublicSignup,
  isPartnerInvite,
  migrationMarkerProvesSignup,
  summarizeAffiliatePopulation,
} from './population';

const early = {
  capabilities: EARLY_PROGRAM_DEFAULTS.capabilities,
  subAffiliateLimit: null as number | null,
};

const standardOff = {
  capabilities: {
    ...EARLY_PROGRAM_DEFAULTS.capabilities,
    CAN_BECOME_MAIN: false,
    CAN_EARN_MAIN_OVERRIDE: false,
    CAN_INVITE_SUB_AFFILIATES: false,
    CAN_HAVE_SUB_AFFILIATES: false,
    CAN_ACCESS_NETWORK_DASHBOARD: false,
  },
  subAffiliateLimit: 0,
};

describe('affiliate population semantics', () => {
  it('does not count an affiliate row without enrollment as a confirmed signup', () => {
    assert.equal(isCommercialAffiliateParticipant({
      populationClass: POPULATION_COMMERCIAL,
      hasEnrollment: false,
    }), false);
    assert.equal(isConfirmedPublicSignup({
      populationClass: POPULATION_TECHNICAL,
      enrollmentSource: null,
      termsAcceptedAt: null,
    }), false);
  });

  it('does not treat a root without an explicit MAIN right as MAIN', () => {
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      withholdProgramRights: true,
      program: { capabilities: {}, subAffiliateLimit: 0 },
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, false);
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, false);
  });

  it('gives a root Early affiliate MAIN from the program, including unlimited direct subs', () => {
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      program: early,
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, true);
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.source, 'PROGRAM');
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, true);
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.source, 'PROGRAM');
    assert.equal(resolved.subAffiliateLimit.value, null);
    assert.equal(resolved.subAffiliateLimit.source, 'PROGRAM');
    for (const childCount of [0, 1, 9, 99]) {
      assert.equal(decideSubInvite({
        resolved,
        hasParent: false,
        childCount,
        pendingInvites: 0,
        adminForce: false,
      }).ok, true);
    }
  });

  it('keeps a future root Standard affiliate off MAIN and off network', () => {
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      program: standardOff,
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, false);
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.source, 'PROGRAM');
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, false);
  });

  it('lets a technical commission identity exist without becoming a participant', () => {
    assert.equal(isCommercialAffiliateParticipant({
      populationClass: POPULATION_TECHNICAL,
      hasEnrollment: false,
    }), false);
    assert.equal(isConfirmedPublicSignup({
      populationClass: POPULATION_TECHNICAL,
      enrollmentSource: SOURCE_TECHNICAL_COMMISSION,
      termsAcceptedAt: null,
    }), false);
    const resolved = resolveAffiliateCapabilities({
      suspended: false,
      withholdProgramRights: true,
      program: { capabilities: {}, subAffiliateLimit: 0 },
    });
    assert.equal(resolved.capabilities.CAN_BECOME_MAIN.value, false);
    assert.equal(resolved.capabilities.CAN_CREATE_PROMO_CODES.value, false);
    const seat = readFileSync(new URL('../affiliate-commission.ts', import.meta.url), 'utf8');
    assert.match(seat, /populationClass: 'TECHNICAL'/);
  });

  it('does not enroll someone because they open the invite page', () => {
    const referral = readFileSync(new URL('../affiliates/personal-referral.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(referral, /affiliate\.create/);
    const route = readFileSync(new URL('../../app/api/affiliate/referral-link/route.ts', import.meta.url), 'utf8');
    assert.match(route, /enrollmentRequired: true/);
  });

  it('persists public signup provenance and terms', () => {
    assert.equal(isConfirmedPublicSignup({
      populationClass: POPULATION_COMMERCIAL,
      enrollmentSource: SOURCE_PUBLIC_SIGNUP,
      termsAcceptedAt: '2026-09-26T00:00:00.000Z',
    }), true);
    const signup = readFileSync(new URL('../../app/api/affiliate/signup/route.ts', import.meta.url), 'utf8');
    assert.match(signup, /PUBLIC_SIGNUP/);
    assert.match(signup, /acceptedTerms: true/);
  });

  it('persists admin admission separately from a technical seat', () => {
    assert.equal(isAdminAdmission(SOURCE_ADMIN_ADMISSION), true);
    assert.equal(isConfirmedPublicSignup({
      populationClass: POPULATION_COMMERCIAL,
      enrollmentSource: SOURCE_ADMIN_ADMISSION,
      termsAcceptedAt: null,
    }), false);
    const route = readFileSync(new URL('../../app/api/admin/affiliate-program/route.ts', import.meta.url), 'utf8');
    assert.match(route, /ADMIN_ADMISSION/);
  });

  it('persists a legitimate SUB invite and excludes a test SUB from business metrics', () => {
    assert.equal(isPartnerInvite(SOURCE_PARTNER_INVITE), true);
    const summary = summarizeAffiliatePopulation([
      {
        populationClass: POPULATION_COMMERCIAL,
        parentAffiliateId: 'parent',
        enrollmentSource: SOURCE_PARTNER_INVITE,
        termsAcceptedAt: null,
        canBecomeMain: true,
        mainSource: 'PROGRAM',
        canInviteSubs: true,
      },
      {
        populationClass: POPULATION_EXCLUDED_TEST,
        parentAffiliateId: 'test-parent',
        enrollmentSource: SOURCE_PARTNER_INVITE,
        termsAcceptedAt: null,
        canBecomeMain: false,
        mainSource: null,
        canInviteSubs: false,
      },
    ]);
    assert.equal(summary.totalSubRelationships, 2);
    assert.equal(summary.activeCommercialSubs, 1);
    assert.equal(summary.testSubsExcluded, 1);
    assert.equal(summary.commercialParticipants, 1);
  });

  it('excludes tombstoned certification rows and internal identities from external acquisition', () => {
    const summary = summarizeAffiliatePopulation([
      {
        populationClass: POPULATION_EXCLUDED_TEST,
        parentAffiliateId: null,
        enrollmentSource: SOURCE_MIGRATED_EXISTING,
        termsAcceptedAt: null,
        canBecomeMain: false,
        mainSource: null,
        canInviteSubs: false,
      },
      {
        populationClass: POPULATION_INTERNAL,
        parentAffiliateId: null,
        enrollmentSource: SOURCE_MIGRATED_EXISTING,
        termsAcceptedAt: null,
        canBecomeMain: true,
        mainSource: 'PROGRAM',
        canInviteSubs: true,
      },
      {
        populationClass: POPULATION_COMMERCIAL,
        parentAffiliateId: null,
        enrollmentSource: SOURCE_MIGRATED_EXISTING,
        termsAcceptedAt: null,
        canBecomeMain: true,
        mainSource: 'PROGRAM',
        canInviteSubs: true,
      },
    ]);
    assert.equal(summary.confirmedPublicSignups, 0);
    assert.equal(summary.commercialParticipants, 1);
    assert.equal(summary.explicitEffectiveMain, 1);
    assert.equal(summary.internalIdentities, 1);
    assert.equal(summary.testCertification, 1);
    assert.equal(summary.excludedFromBusinessMetrics, 2);
  });

  it('does not treat MIGRATED_EXISTING as signup proof', () => {
    assert.equal(migrationMarkerProvesSignup(SOURCE_MIGRATED_EXISTING), false);
    assert.equal(isConfirmedPublicSignup({
      populationClass: POPULATION_COMMERCIAL,
      enrollmentSource: SOURCE_MIGRATED_EXISTING,
      termsAcceptedAt: null,
    }), false);
  });

  it('blocks an Early SUB from creating a second layer', () => {
    const resolved = resolveAffiliateCapabilities({ suspended: false, program: early });
    const decision = decideSubInvite({
      resolved,
      hasParent: true,
      childCount: 0,
      pendingInvites: 0,
      adminForce: false,
    });
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.code, 'PARENT_IS_PARTNER');
  });

  it('keeps an existing Early affiliate on Early rights after the public program switches', () => {
    const stayed = enrollmentSurvivesDefaultChange({
      enrolledProgramCode: 'EARLY_AFFILIATE_V1',
      newPublicDefaultCode: 'STANDARD_AFFILIATE_V2',
    });
    assert.equal(stayed.programCode, 'EARLY_AFFILIATE_V1');
    assert.equal(stayed.changed, false);
    const resolved = resolveAffiliateCapabilities({ suspended: false, program: early });
    assert.equal(resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value, true);
    assert.equal(resolved.subAffiliateLimit.value, null);
    assert.equal(resolved.subAffiliateLimit.source, 'PROGRAM');
  });

  it('lets an admin cap an Early affiliate at 10 and returns to unlimited on reset', () => {
    const capped = resolveAffiliateCapabilities({
      suspended: false,
      program: early,
      adminOverride: {
        capabilities: {},
        subLimitMode: 'LIMITED',
        subLimit: 10,
      },
    });
    assert.equal(capped.subAffiliateLimit.value, 10);
    assert.equal(capped.subAffiliateLimit.source, 'ADMIN_OVERRIDE');
    const reset = resolveAffiliateCapabilities({
      suspended: false,
      program: early,
      adminOverride: {
        capabilities: {},
        subLimitMode: 'INHERIT',
        subLimit: null,
      },
    });
    assert.equal(reset.subAffiliateLimit.value, null);
    assert.equal(reset.subAffiliateLimit.source, 'PROGRAM');
    assert.equal(decideSubInvite({
      resolved: capped,
      hasParent: false,
      childCount: 10,
      pendingInvites: 0,
      adminForce: false,
    }).ok, false);
  });

  it('keeps review records out of commercial MAIN', () => {
    const summary = summarizeAffiliatePopulation([
      {
        populationClass: POPULATION_REVIEW,
        parentAffiliateId: null,
        enrollmentSource: SOURCE_MIGRATED_EXISTING,
        termsAcceptedAt: null,
        canBecomeMain: false,
        mainSource: null,
        canInviteSubs: false,
      },
    ]);
    assert.equal(summary.reviewRequired, 1);
    assert.equal(summary.commercialParticipants, 0);
    assert.equal(summary.explicitEffectiveMain, 0);
  });
});

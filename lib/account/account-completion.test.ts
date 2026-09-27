import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { accountCompletionModel, type AccountCompletionInput } from './account-completion';

function base(overrides: Partial<AccountCompletionInput> = {}): AccountCompletionInput {
  return {
    emailVerified: true,
    ageMode: 'ADULT',
    consentRequired: false,
    hasStripeAccount: false,
    stripeUiStatus: 'NOT_STARTED',
    connectTrack: null,
    canCreateOnboardingLink: true,
    configurationMismatch: false,
    selectedTrack: null,
    ...overrides,
  };
}

describe('account completion checklist', () => {
  it('shows a compact checklist for an adult who still needs a type and payments', () => {
    const model = accountCompletionModel(base());
    assert.equal(model.showChecklist, true);
    assert.equal(model.dobComplete, true);
    assert.equal(model.particularSelectable, true);
    assert.equal(model.businessSelectable, true);
    assert.equal(model.paymentsBlocked, true);
    assert.equal(model.paymentCta, 'setup');
    assert.equal(model.showConsent, false);
  });

  it('unlocks payments after an adult selects a type and does not invent a third type', () => {
    const model = accountCompletionModel(base({ selectedTrack: 'PARTICULAR' }));
    assert.equal(model.effectiveTrack, 'PARTICULAR');
    assert.equal(model.paymentsBlocked, false);
    assert.equal(model.businessSelectable, true);
  });

  it('does not offer a business path to a minor', () => {
    const model = accountCompletionModel(
      base({
        ageMode: 'MINOR',
        consentRequired: true,
        selectedTrack: 'BUSINESS',
      }),
    );
    assert.equal(model.minorBusinessBlocked, true);
    assert.equal(model.businessSelectable, false);
    assert.equal(model.particularSelectable, true);
    assert.equal(model.effectiveTrack, 'PARTICULAR');
    assert.equal(model.showConsent, true);
    assert.equal(model.paymentsBlocked, true);
  });

  it('lets a minor with active consent start particular payments', () => {
    const model = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: false }),
    );
    assert.equal(model.consentComplete, true);
    assert.equal(model.effectiveTrack, 'PARTICULAR');
    assert.equal(model.paymentsBlocked, false);
    assert.equal(model.businessSelectable, false);
  });

  it('asks for a date of birth before account type when the server requires it', () => {
    const model = accountCompletionModel(base({ ageMode: 'DOB_REQUIRED' }));
    assert.equal(model.dobRequired, true);
    assert.equal(model.showAccountType, false);
    assert.equal(model.paymentsBlocked, true);
    assert.ok(model.steps.includes('dob'));
  });

  it('does not put a grandfathered seller through a date-of-birth step', () => {
    const model = accountCompletionModel(
      base({
        ageMode: 'LEGACY_ADULT',
        hasStripeAccount: true,
        stripeUiStatus: 'PAYMENT_READY',
        connectTrack: 'BUSINESS',
      }),
    );
    assert.equal(model.steps.includes('dob'), false);
    assert.equal(model.showChecklist, false);
    assert.equal(model.paymentCta, 'view');
    assert.equal(model.businessSelectable, false);
  });

  it('does not ask an existing Stripe account to choose a type again', () => {
    const model = accountCompletionModel(
      base({
        hasStripeAccount: true,
        stripeUiStatus: 'INCOMPLETE',
        connectTrack: 'PARTICULAR',
        selectedTrack: 'BUSINESS',
      }),
    );
    assert.equal(model.particularSelectable, false);
    assert.equal(model.businessSelectable, false);
    assert.equal(model.effectiveTrack, 'PARTICULAR');
    assert.equal(model.paymentCta, 'finish');
  });

  it('does not offer payments to someone under 13', () => {
    const model = accountCompletionModel(base({ ageMode: 'BLOCKED_UNDER_13' }));
    assert.equal(model.under13, true);
    assert.equal(model.showAccountType, false);
    assert.equal(model.steps.includes('payments'), false);
    assert.equal(model.paymentCta, 'none');
  });

  it('hides the checklist when email, age and payments are already done', () => {
    const model = accountCompletionModel(
      base({
        hasStripeAccount: true,
        stripeUiStatus: 'PAYMENT_READY',
        connectTrack: 'PARTICULAR',
      }),
    );
    assert.equal(model.showChecklist, false);
    assert.equal(model.paymentsComplete, true);
  });
});

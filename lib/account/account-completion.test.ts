import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountCompletionModel,
  listingCompletionSteps,
  type AccountCompletionInput,
} from './account-completion';

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
    assert.equal(model.effectiveTrack, null);
    assert.equal(model.accountTypeComplete, false);
    assert.equal(model.showConsent, true);
    assert.equal(model.paymentsBlocked, true);
  });

  it('lets a minor with active consent start particular payments only after that choice', () => {
    const unanswered = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: false }),
    );
    assert.equal(unanswered.effectiveTrack, null);
    assert.equal(unanswered.paymentsBlocked, true);
    const model = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: false, selectedTrack: 'PARTICULAR' }),
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

describe('listing inline completion order', () => {
  it('asks for date of birth before type or payments', () => {
    const model = accountCompletionModel(base({ ageMode: 'DOB_REQUIRED' }));
    assert.deepEqual(listingCompletionSteps(model), ['dob']);
  });

  it('asks an adult for a type before payments', () => {
    const model = accountCompletionModel(base());
    assert.deepEqual(listingCompletionSteps(model), ['dob', 'accountType']);
    assert.equal(model.businessSelectable, true);
  });

  it('shows payments once an adult has chosen particular', () => {
    const model = accountCompletionModel(base({ selectedTrack: 'PARTICULAR' }));
    assert.deepEqual(listingCompletionSteps(model), ['dob', 'accountType', 'payments']);
  });

  it('shows particular and consent for a 13–17 seller, and hides business', () => {
    const model = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: true }),
    );
    assert.equal(model.businessSelectable, false);
    assert.equal(model.minorBusinessBlocked, true);
    assert.deepEqual(listingCompletionSteps(model), ['dob', 'accountType', 'consent']);
  });

  it('opens payments for a minor only after consent is active', () => {
    const model = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: false, selectedTrack: 'PARTICULAR' }),
    );
    assert.ok(listingCompletionSteps(model).includes('payments'));
    assert.equal(model.paymentsBlocked, false);
  });

  it('hides setup once Stripe is ready', () => {
    const model = accountCompletionModel(
      base({
        hasStripeAccount: true,
        stripeUiStatus: 'PAYMENT_READY',
        connectTrack: 'BUSINESS',
      }),
    );
    assert.equal(model.paymentsComplete, true);
    assert.equal(listingCompletionSteps(model).includes('payments'), true);
  });

  it('A. asks an adult with a stored date of birth and no seller type to choose', () => {
    const model = accountCompletionModel(base({ connectTrack: null, selectedTrack: null }));
    assert.equal(model.effectiveTrack, null);
    assert.equal(model.accountTypeComplete, false);
    assert.equal(model.particularSelectable, true);
    assert.equal(model.businessSelectable, true);
    assert.equal(model.dobRequired, false);
  });

  it('B/C. keeps a stored particular or business choice and does not ask again', () => {
    const particular = accountCompletionModel(base({ connectTrack: 'PARTICULAR' }));
    const business = accountCompletionModel(base({ connectTrack: 'BUSINESS' }));
    assert.equal(particular.accountTypeComplete, true);
    assert.equal(particular.effectiveTrack, 'PARTICULAR');
    assert.equal(business.accountTypeComplete, true);
    assert.equal(business.effectiveTrack, 'BUSINESS');
    assert.equal(business.paymentsBlocked, false);
  });

  it('D/E. asks for a missing date of birth and reuses a valid one', () => {
    const missing = accountCompletionModel(base({ ageMode: 'DOB_REQUIRED' }));
    const present = accountCompletionModel(base({ ageMode: 'ADULT' }));
    assert.equal(missing.dobRequired, true);
    assert.deepEqual(listingCompletionSteps(missing), ['dob']);
    assert.equal(present.dobRequired, false);
    assert.equal(present.dobComplete, true);
  });

  it('F. keeps grandfathered sellers off the date-of-birth step', () => {
    const model = accountCompletionModel(
      base({ ageMode: 'LEGACY_ADULT', connectTrack: 'BUSINESS', hasStripeAccount: true, stripeUiStatus: 'PAYMENT_READY' }),
    );
    assert.equal(model.steps.includes('dob'), false);
    assert.equal(model.dobRequired, false);
  });

  it('G/H/J. starts when Stripe is absent and resumes the same incomplete account', () => {
    const absent = accountCompletionModel(base({ selectedTrack: 'PARTICULAR' }));
    const incomplete = accountCompletionModel(
      base({
        hasStripeAccount: true,
        stripeUiStatus: 'INCOMPLETE',
        connectTrack: 'PARTICULAR',
      }),
    );
    assert.equal(absent.paymentCta, 'setup');
    assert.equal(incomplete.paymentCta, 'finish');
    assert.equal(incomplete.effectiveTrack, 'PARTICULAR');
    assert.equal(incomplete.paymentsComplete, false);
  });

  it('N/O/P. a minor cannot take business, and a client claim does not make Stripe ready', () => {
    const minor = accountCompletionModel(
      base({ ageMode: 'MINOR', consentRequired: false, selectedTrack: 'BUSINESS' }),
    );
    assert.equal(minor.businessSelectable, false);
    assert.equal(minor.effectiveTrack, null);
    const fakeReady = accountCompletionModel(
      base({
        selectedTrack: 'PARTICULAR',
        stripeUiStatus: 'NOT_STARTED',
        hasStripeAccount: false,
      }),
    );
    assert.equal(fakeReady.paymentsComplete, false);
  });
});

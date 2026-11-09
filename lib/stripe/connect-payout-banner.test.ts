import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { connectPayoutBannerModel } from './connect-payout-banner';

describe('connect payout banner', () => {
  it('a new account asks for particular or business before Stripe starts', () => {
    const model = connectPayoutBannerModel({
      hasAccount: false,
      uiStatus: 'NOT_STARTED',
      needsTrackSelection: true,
    });
    assert.equal(model.phase, 'not_started');
    assert.equal(model.presentation, 'action');
    assert.equal(model.actionLabelNl, 'Instellen');
    assert.equal(model.askTrack, true);
    assert.match(model.titleNl, /Rond Stripe Connect af om uitbetalingen te ontvangen/);
  });

  it('an existing account resumes without asking for the choice again', () => {
    const model = connectPayoutBannerModel({
      hasAccount: true,
      uiStatus: 'INCOMPLETE',
      needsTrackSelection: false,
      canCreateOnboardingLink: true,
      connectTrack: 'PARTICULAR',
    });
    assert.equal(model.phase, 'resume');
    assert.equal(model.presentation, 'action');
    assert.equal(model.actionLabelNl, 'Verder met Stripe Connect');
    assert.equal(model.askTrack, false);
  });

  it('review and ready show status without an action', () => {
    const review = connectPayoutBannerModel({
      hasAccount: true,
      uiStatus: 'PENDING_VERIFICATION',
      canCreateOnboardingLink: false,
      paymentReady: false,
    });
    assert.equal(review.phase, 'in_review');
    assert.equal(review.presentation, 'payments');
    assert.equal(review.actionLabelNl, null);
    assert.equal(review.paymentsLineNl, 'Verificatie wordt gecontroleerd');
    const ready = connectPayoutBannerModel({
      hasAccount: true,
      uiStatus: 'PAYMENT_READY',
      paymentReady: true,
    });
    assert.equal(ready.phase, 'ready');
    assert.equal(ready.presentation, 'payments');
    assert.equal(ready.actionLabelNl, null);
    assert.equal(ready.paymentsLineNl, '✓ Uitbetalingen ingesteld');
  });

  it('the same account can return to either dashboard', () => {
    const courier = connectPayoutBannerModel({
      hasAccount: true,
      uiStatus: 'ACTION_REQUIRED',
      canCreateOnboardingLink: true,
      needsTrackSelection: false,
      connectTrack: 'PARTICULAR',
    });
    const seller = connectPayoutBannerModel({
      hasAccount: true,
      uiStatus: 'ACTION_REQUIRED',
      canCreateOnboardingLink: true,
      needsTrackSelection: false,
      connectTrack: 'PARTICULAR',
    });
    assert.equal(courier.phase, 'resume');
    assert.equal(seller.phase, courier.phase);
    assert.equal(seller.askTrack, false);
  });
});

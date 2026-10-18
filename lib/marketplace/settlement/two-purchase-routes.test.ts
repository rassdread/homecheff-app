import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultPaymentPath,
  validatePaymentPath,
} from '../../proposals/proposal-product-binding';
import {
  productAllowsHomecheffCheckout,
  resolveMarketplaceCtaActions,
  toMarketplaceCtaContext,
} from './settlement-router';

const channels = { hasContactChannels: true, inStock: true, isOwner: false };

describe('two purchase routes', () => {
  it('CASE 1: HomeCheff on and Connect ready shows negotiation and direct checkout', () => {
    const cta = resolveMarketplaceCtaActions(
      toMarketplaceCtaContext(
        { acceptHomeCheffPayment: true, acceptDirectContact: false, priceCents: 1250 },
        { ...channels, stripeConnectReady: true },
      ),
    );
    assert.equal(cta.showProposal, true);
    assert.equal(cta.showCheckout, true);
    assert.equal(cta.showDualPath, true);
    assert.equal(cta.proposalLabelKey, 'marketplace.cta.negotiateWithSeller');
  });

  it('CASE 2: HomeCheff on and Connect not ready keeps negotiation and blocks checkout', () => {
    const cta = resolveMarketplaceCtaActions(
      toMarketplaceCtaContext(
        { acceptHomeCheffPayment: true, acceptDirectContact: false, priceCents: 1250 },
        { ...channels, stripeConnectReady: false },
      ),
    );
    assert.equal(cta.showProposal, true);
    assert.equal(cta.showCheckout, false);
    assert.equal(cta.checkoutNeedsConnect, true);
    assert.equal(
      productAllowsHomecheffCheckout({
        acceptHomeCheffPayment: true,
        priceCents: 1250,
        sellerStripeReady: false,
      }),
      false,
    );
  });

  it('CASE 3: HomeCheff off shows negotiation only', () => {
    const cta = resolveMarketplaceCtaActions(
      toMarketplaceCtaContext(
        { acceptHomeCheffPayment: false, acceptDirectContact: false, priceCents: 1250 },
        { ...channels, stripeConnectReady: true },
      ),
    );
    assert.equal(cta.showProposal, true);
    assert.equal(cta.showCheckout, false);
    assert.equal(cta.checkoutNeedsConnect, false);
  });

  it('cash negotiation stays valid without the direct-contact flag or Stripe', () => {
    const productCtx = {
      acceptHomeCheffPayment: true,
      acceptDirectContact: false,
      sellerStripeReady: false,
    } as never;
    assert.deepEqual(
      validatePaymentPath({
        paymentPath: 'DIRECT_CONTACT',
        settlementMode: 'MONEY',
        productCtx,
        amountCents: 1000,
      }),
      { ok: true },
    );
    assert.equal(validatePaymentPath({
      paymentPath: 'HOMECHEFF_CHECKOUT',
      settlementMode: 'MONEY',
      productCtx,
      amountCents: 1000,
    }).ok, false);
    assert.equal(
      defaultPaymentPath({
        settlementMode: 'MONEY',
        productCtx,
        amountCents: 1000,
      }),
      'DIRECT_CONTACT',
    );
  });
});

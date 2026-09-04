'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { allowedBuyerProposalSettlementModes } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import {
  PROPOSAL_I18N,
  PROPOSAL_POLISH_I18N,
} from '@/lib/proposals/proposal-i18n-keys';
import { resolveProposalPrefill } from '@/lib/proposals/proposal-prefill';
import {
  formValuesToApiPayload,
  validateProposalReadiness,
} from '@/lib/proposals/proposal-readiness';
import {
  canProposalHomeCheffCheckout,
  parseProposalAmountEurosToCents,
} from '@/lib/proposals/proposal-homecheff-eligibility';
import { resolveValuePickerHeadingKey } from '@/lib/proposals/proposal-barter-actor-labels';
import {
  PROPOSAL_FLOW_EVENTS,
  trackProposalFlowEvent,
} from '@/lib/proposals/proposal-analytics';
import type { ProposalDTO } from '@/lib/proposals/proposal-types';
import type { ProposalFieldsProduct } from './ProposalFieldsSection';
import ProposalFieldsSection from './ProposalFieldsSection';
import ProposalSummaryPreview from './ProposalSummaryPreview';

type Props = {
  proposal: ProposalDTO;
  currentUserId: string;
  onCancel: () => void;
  onCountered: (proposal: ProposalDTO) => void;
};

function mapHeaderProduct(
  raw: Record<string, unknown> | null | undefined,
): ProposalFieldsProduct | null {
  if (!raw || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : '',
    priceCents: typeof raw.priceCents === 'number' ? raw.priceCents : null,
    availableStock:
      typeof raw.availableStock === 'number' ? raw.availableStock : null,
    acceptHomeCheffPayment: Boolean(raw.acceptHomeCheffPayment),
    acceptDirectContact: Boolean(raw.acceptDirectContact),
    canHomeCheffCheckout: Boolean(raw.canHomeCheffCheckout),
    sellerStripeReady: Boolean(
      raw.sellerStripeReady ?? raw.canHomeCheffCheckout,
    ),
    homeCheffCheckoutBlockedReason:
      typeof raw.homeCheffCheckoutBlockedReason === 'string'
        ? raw.homeCheffCheckoutBlockedReason
        : null,
    fulfillmentOptions:
      raw.fulfillmentOptions && typeof raw.fulfillmentOptions === 'object'
        ? (raw.fulfillmentOptions as ProposalFieldsProduct['fulfillmentOptions'])
        : undefined,
    delivery: typeof raw.delivery === 'string' ? raw.delivery : null,
    barterOpenness:
      typeof raw.barterOpenness === 'string' ? raw.barterOpenness : null,
    priceModel: typeof raw.priceModel === 'string' ? raw.priceModel : null,
    marketplaceCategory:
      typeof raw.marketplaceCategory === 'string'
        ? raw.marketplaceCategory
        : null,
  };
}

async function loadCounterProduct(
  proposal: ProposalDTO,
): Promise<ProposalFieldsProduct | null> {
  if (!proposal.productId) return null;

  try {
    const convRes = await fetch(`/api/conversations/${proposal.conversationId}`);
    if (convRes.ok) {
      const convData = await convRes.json();
      const header = convData.conversation?.contextHeader;
      if (
        header?.kind === 'PRODUCT' &&
        header.product?.id === proposal.productId
      ) {
        return mapHeaderProduct(header.product);
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(`/api/products/${proposal.productId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const product = (data.product || data) as Record<string, unknown>;
    const paymentStatus = data.paymentStatus as
      | { paymentsReady?: boolean }
      | undefined;
    const acceptsHomeCheff =
      Boolean(product.acceptHomeCheffPayment) &&
      product.orderMethod !== 'CONTACT';
    const sellerStripeReady = Boolean(
      paymentStatus?.paymentsReady ?? data.checkoutAvailable,
    );
    return {
      id: String(product.id),
      title: typeof product.title === 'string' ? product.title : '',
      priceCents:
        typeof product.priceCents === 'number' ? product.priceCents : null,
      availableStock:
        typeof product.stock === 'number'
          ? product.stock
          : typeof product.maxStock === 'number'
            ? product.maxStock
            : null,
      acceptHomeCheffPayment: acceptsHomeCheff,
      acceptDirectContact: Boolean(
        product.acceptDirectContact || product.orderMethod === 'CONTACT',
      ),
      canHomeCheffCheckout: acceptsHomeCheff && sellerStripeReady,
      sellerStripeReady,
      homeCheffCheckoutBlockedReason:
        acceptsHomeCheff && !sellerStripeReady
          ? 'proposal.productBinding.paymentsRequired'
          : null,
      fulfillmentOptions:
        product.fulfillmentOptions &&
        typeof product.fulfillmentOptions === 'object'
          ? (product.fulfillmentOptions as ProposalFieldsProduct['fulfillmentOptions'])
          : undefined,
      delivery: typeof product.delivery === 'string' ? product.delivery : null,
      barterOpenness:
        typeof product.barterOpenness === 'string'
          ? product.barterOpenness
          : null,
      priceModel:
        typeof product.priceModel === 'string' ? product.priceModel : null,
      marketplaceCategory:
        typeof product.marketplaceCategory === 'string'
          ? product.marketplaceCategory
          : null,
    };
  } catch {
    return null;
  }
}

export default function CounterProposalForm({
  proposal,
  currentUserId,
  onCancel,
  onCountered,
}: Props) {
  const { t } = useTranslation();
  const prefill = useMemo(
    () =>
      resolveProposalPrefill({
        source: 'counter',
        parentProposal: proposal,
      }),
    [proposal],
  );
  const [form, setForm] = useState(prefill.form);
  const [product, setProduct] = useState<ProposalFieldsProduct | null>(null);
  const [productLoading, setProductLoading] = useState(
    Boolean(proposal.productId),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!proposal.productId) {
      setProduct(null);
      setProductLoading(false);
      return;
    }
    setProductLoading(true);
    void loadCounterProduct(proposal).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setProductLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [proposal]);

  // Once product seller readiness is known, default payment path for money legs
  // (parity with CreateProposalSheet amount→path coherence).
  useEffect(() => {
    if (!product) return;
    if (
      form.settlementMode !== 'MONEY' &&
      form.settlementMode !== 'MONEY_AND_VALUE'
    ) {
      return;
    }
    if (form.paymentPath !== 'NONE') return;
    const amountCents = parseProposalAmountEurosToCents(form.amountEuros);
    const eligible = canProposalHomeCheffCheckout({
      acceptHomeCheffPayment: product.acceptHomeCheffPayment,
      sellerStripeReady:
        product.sellerStripeReady ?? product.canHomeCheffCheckout,
      settlementMode: form.settlementMode,
      amountCents,
    });
    const nextPath = eligible
      ? 'HOMECHEFF_CHECKOUT'
      : product.acceptDirectContact
        ? 'DIRECT_CONTACT'
        : 'NONE';
    if (nextPath === 'NONE') return;
    setForm((prev) => {
      if (prev.paymentPath !== 'NONE') return prev;
      return { ...prev, paymentPath: nextPath };
    });
  }, [product, form.settlementMode, form.amountEuros, form.paymentPath]);

  const allowedSettlementModes = useMemo(() => {
    return allowedBuyerProposalSettlementModes(product?.barterOpenness ?? null);
  }, [product?.barterOpenness]);

  const showPaymentPath =
    (form.settlementMode === 'MONEY' ||
      form.settlementMode === 'MONEY_AND_VALUE') &&
    Boolean(product);

  const readinessProduct = useMemo(
    () =>
      product
        ? {
            id: product.id,
            barterOpenness: product.barterOpenness ?? null,
            availableStock: product.availableStock,
            acceptHomeCheffPayment: product.acceptHomeCheffPayment,
            acceptDirectContact: product.acceptDirectContact,
            canHomeCheffCheckout: product.canHomeCheffCheckout,
            sellerStripeReady: product.sellerStripeReady,
            isActive: true as const,
            priceModel: product.priceModel,
            marketplaceCategory: product.marketplaceCategory,
            fulfillmentDigital: Boolean(product.fulfillmentOptions?.digital),
          }
        : null,
    [product],
  );

  const liveReadiness = useMemo(
    () =>
      validateProposalReadiness({
        form,
        product: readinessProduct,
        isAuthenticated: true,
        requirePaymentPathForMoney: Boolean(product),
      }),
    [form, readinessProduct, product],
  );

  const submitBlockedReason =
    !busy && !productLoading && !liveReadiness.ok
      ? liveReadiness.errorKey
      : !busy && !productLoading && proposal.productId && !product
        ? 'proposal.errors.listingInactive'
        : null;

  const valuePickerHeadingKey = resolveValuePickerHeadingKey({
    currentUserId,
    buyerId: proposal.buyerId,
    sellerId: proposal.sellerId,
  });

  const handleSubmit = async () => {
    setError(null);
    const formForSubmit =
      product != null ? { ...form, title: product.title } : form;

    const readiness = validateProposalReadiness({
      form: formForSubmit,
      product: readinessProduct,
      isAuthenticated: true,
      requirePaymentPathForMoney: Boolean(product),
    });
    if (!readiness.ok) {
      setError(t(readiness.errorKey));
      return;
    }
    if (proposal.productId && !product) {
      setError(t('proposal.errors.listingInactive'));
      return;
    }

    const payload = formValuesToApiPayload(formForSubmit, {
      productId: proposal.productId,
      showPaymentPath,
    });

    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.error === 'string' && data.error.startsWith('proposal.')
            ? data.error
            : null;
        setError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.countered, {
        source: 'counter',
        listingId: proposal.productId,
        settlementType: form.settlementMode,
        proposalId: data.proposal?.id,
        surface: 'chat',
      });
      if (data.proposal) onCountered(data.proposal);
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-900">
        {t(PROPOSAL_POLISH_I18N.counter.heading)}
      </p>

      <ProposalFieldsSection
        form={form}
        onChange={setForm}
        allowedSettlementModes={allowedSettlementModes}
        product={product}
        lockListingTitle={Boolean(product)}
        idPrefix="counter-proposal"
        valuePickerHeadingKey={valuePickerHeadingKey}
      />

      <ProposalSummaryPreview
        form={form}
        offerLabel={product?.title ?? form.title}
        showPaymentPath={showPaymentPath}
      />

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : submitBlockedReason ? (
        <p className="text-xs text-amber-800" role="status">
          {t(submitBlockedReason)}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || productLoading || !liveReadiness.ok}
          onClick={() => void handleSubmit()}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy || productLoading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            t(PROPOSAL_I18N.actions.sendCounter)
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

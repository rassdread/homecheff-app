"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, ClipboardList } from "lucide-react";
import type { SettlementMode } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { allowedSettlementModesForBarterOpenness } from "@/lib/marketplace/commerce/barter-commerce-alignment";
import {
  PROPOSAL_I18N,
  PROPOSAL_POLISH_I18N,
} from "@/lib/proposals/proposal-i18n-keys";
import { resolveProposalSendLabelKey } from "@/lib/proposals/proposal-send-label";
import type { ResolvedConversationHeader } from "@/lib/communication/resolveConversationHeader";
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from "@/lib/marketplace/exchange/exchange-funnel-analytics";
import {
  PROPOSAL_FLOW_EVENTS,
  trackProposalFlowEvent,
} from "@/lib/proposals/proposal-analytics";
import { resolveProposalPrefill } from "@/lib/proposals/proposal-prefill";
import { consumeProposalPrefill } from "@/lib/proposals/proposal-prefill-storage";
import type { ProposalFormValues } from "@/lib/proposals/proposal-form-types";
import {
  formValuesToApiPayload,
  validateProposalReadiness,
} from "@/lib/proposals/proposal-readiness";
import ProposalProductSummary from "./ProposalProductSummary";
import ProposalFieldsSection from "./ProposalFieldsSection";
import ProposalSummaryPreview from "./ProposalSummaryPreview";

export type { ProposalFormValues as CreateProposalFormValues } from "@/lib/proposals/proposal-form-types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  conversationId: string;
  contextHeader?: ResolvedConversationHeader | null;
};

export default function CreateProposalSheet({
  open,
  onClose,
  onCreated,
  conversationId,
  contextHeader,
}: Props) {
  const { t } = useTranslation();
  const { status: sessionStatus } = useSession();
  const product =
    contextHeader?.kind === "PRODUCT" ? contextHeader.product : null;

  const [form, setForm] = useState<ProposalFormValues>(() =>
    resolveProposalPrefill({ source: "listing", contextHeader }).form,
  );
  const [prefillMeta, setPrefillMeta] = useState(
    () => resolveProposalPrefill({ source: "listing", contextHeader }).meta,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const stored = consumeProposalPrefill();
    const result = resolveProposalPrefill({
      source: stored?.source ?? "listing",
      contextHeader,
      exchangeSuggestion: stored?.exchangeSuggestion,
      parentProposal: stored?.parentProposal,
      reverseDiscoveryOfferIds: stored?.reverseDiscoveryOfferIds,
    });

    if (product) {
      const allowed = allowedSettlementModesForBarterOpenness(
        product.barterOpenness,
      );
      if (!allowed.includes(result.form.settlementMode)) {
        result.form.settlementMode = allowed[0] ?? "MONEY";
      }
    }

    setForm(result.form);
    setPrefillMeta(result.meta);
    setError(null);

    trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.opened, {
      source: result.meta.source,
      listingId: result.meta.listingId,
      settlementType: result.form.settlementMode,
      exchangeSuggestionUsed: result.meta.exchangeSuggestionUsed,
      taxonomyOverlapCount: result.meta.taxonomyOverlapCount,
      surface: "chat",
    });

    if (result.meta.exchangeSuggestionUsed || result.meta.reverseDiscoveryUsed || result.meta.source !== "listing") {
      trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.prefilled, {
        source: result.meta.source,
        listingId: result.meta.listingId,
        settlementType: result.form.settlementMode,
        exchangeSuggestionUsed: result.meta.exchangeSuggestionUsed,
        taxonomyOverlapCount: result.meta.taxonomyOverlapCount,
        surface: "chat",
      });
    }

    if (product) {
      trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.proposalSheetOpened, {
        listingId: product.id,
        barterOpenness: product.barterOpenness,
        acceptedSpecializations: product.acceptedSpecializations,
        orderMethod: product.orderMethod,
        surface: "chat",
        entrypoint: result.meta.exchangeSuggestionUsed
          ? "exchange_suggestion_proposal_sheet"
          : "create_proposal_sheet_open",
      });
    }
  }, [open, contextHeader, product]);

  const allowedSettlementModes = useMemo(() => {
    if (!product) {
      const all: SettlementMode[] = [
        "MONEY",
        "MONEY_AND_VALUE",
        "VALUE_ONLY",
        "FREE",
        "VOLUNTARY",
      ];
      return all;
    }
    return allowedSettlementModesForBarterOpenness(product.barterOpenness);
  }, [product]);

  const showPaymentPath =
    (form.settlementMode === "MONEY" ||
      form.settlementMode === "MONEY_AND_VALUE") &&
    Boolean(product);

  const sendLabelKey = resolveProposalSendLabelKey(product?.marketplaceCategory);
  const maxQuantity = product?.availableStock ?? undefined;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const readiness = validateProposalReadiness({
      form,
      product: product
        ? {
            id: product.id,
            barterOpenness: product.barterOpenness,
            availableStock: product.availableStock,
            acceptHomeCheffPayment: product.acceptHomeCheffPayment,
            acceptDirectContact: product.acceptDirectContact,
            canHomeCheffCheckout: product.canHomeCheffCheckout,
            isActive: true,
          }
        : null,
      isAuthenticated: sessionStatus === "authenticated",
    });
    if (!readiness.ok) {
      setError(t(readiness.errorKey));
      return;
    }

    const payload = formValuesToApiPayload(form, {
      productId: product?.id ?? null,
      showPaymentPath,
    });

    setBusy(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.error === "string" && data.error.startsWith("proposal.")
            ? data.error
            : typeof data.errorKey === "string"
              ? data.errorKey
              : null;
        setError(errKey ? t(errKey) : data.error || t("common.error"));
        return;
      }

      trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.sent, {
        source: prefillMeta.source,
        listingId: product?.id ?? prefillMeta.listingId,
        settlementType: form.settlementMode,
        exchangeSuggestionUsed: prefillMeta.exchangeSuggestionUsed,
        taxonomyOverlapCount: prefillMeta.taxonomyOverlapCount,
        proposalId: data.proposal?.id,
        surface: "chat",
      });

      if (product) {
        trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.proposalSubmitted, {
          listingId: product.id,
          barterOpenness: product.barterOpenness,
          acceptedSpecializations: product.acceptedSpecializations,
          orderMethod: product.orderMethod,
          settlementMode: form.settlementMode,
          surface: "chat",
          entrypoint: prefillMeta.exchangeSuggestionUsed
            ? "exchange_suggestion_submit"
            : "create_proposal_submit",
          hasAcceptedValues: form.acceptedValueTaxonomyIds.length > 0,
        });
      }

      onCreated();
      onClose();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-proposal-title"
    >
      <div className="w-full max-w-md rounded-t-2xl lg:rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2
              id="create-proposal-title"
              className="text-base font-semibold text-gray-900"
            >
              {t("proposal.create.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-4 py-4">
          {product ? <ProposalProductSummary product={product} /> : null}

          {prefillMeta.exchangeSuggestionUsed ? (
            <p className="text-[11px] text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-2">
              {t(PROPOSAL_POLISH_I18N.prefill.fromExchange)}
              {prefillMeta.taxonomyOverlapCount > 0
                ? ` · ${t(PROPOSAL_POLISH_I18N.prefill.overlapApplied, {
                    count: String(prefillMeta.taxonomyOverlapCount),
                  })}`
                : ""}
            </p>
          ) : null}

          <ProposalFieldsSection
            form={form}
            onChange={setForm}
            allowedSettlementModes={allowedSettlementModes}
            product={
              product
                ? {
                    id: product.id,
                    title: product.title,
                    priceCents: product.priceCents,
                    availableStock: product.availableStock,
                    acceptHomeCheffPayment: product.acceptHomeCheffPayment,
                    acceptDirectContact: product.acceptDirectContact,
                    canHomeCheffCheckout: product.canHomeCheffCheckout,
                    homeCheffCheckoutBlockedReason:
                      product.homeCheffCheckoutBlockedReason,
                    fulfillmentOptions: product.fulfillmentOptions,
                    delivery: product.delivery,
                  }
                : null
            }
          />

          <ProposalSummaryPreview
            form={form}
            offerLabel={product?.title ?? form.title}
            showPaymentPath={showPaymentPath}
          />

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || (maxQuantity != null && maxQuantity <= 0)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                …
              </>
            ) : (
              t(sendLabelKey)
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

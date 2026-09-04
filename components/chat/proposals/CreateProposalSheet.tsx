"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2, ClipboardList } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { allowedBuyerProposalSettlementModes } from "@/lib/marketplace/commerce/barter-commerce-alignment";
import {
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
  clearProposalDraft,
  isMeaningfulProposalDraft,
  loadProposalDraft,
  saveProposalDraft,
} from "@/lib/proposals/proposal-draft-storage";
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
  /** Fired when a buyer-private concept draft is saved or cleared. */
  onDraftChanged?: () => void;
  conversationId: string;
  contextHeader?: ResolvedConversationHeader | null;
};

function isFormDirty(
  current: ProposalFormValues,
  initial: ProposalFormValues,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

export default function CreateProposalSheet({
  open,
  onClose,
  onCreated,
  onDraftChanged,
  conversationId,
  contextHeader,
}: Props) {
  const { t } = useTranslation();
  const { status: sessionStatus } = useSession();
  const product =
    contextHeader?.kind === "PRODUCT" ? contextHeader.product : null;
  const submitLockRef = useRef(false);
  const initialFormRef = useRef<ProposalFormValues | null>(null);

  const [form, setForm] = useState<ProposalFormValues>(() =>
    resolveProposalPrefill({ source: "listing", contextHeader }).form,
  );
  const [prefillMeta, setPrefillMeta] = useState(
    () => resolveProposalPrefill({ source: "listing", contextHeader }).meta,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!open) return;

    submitLockRef.current = false;
    const stored = consumeProposalPrefill();
    const existingDraft = loadProposalDraft(conversationId);
    const result = resolveProposalPrefill({
      source: stored?.source ?? "listing",
      contextHeader,
      exchangeSuggestion: stored?.exchangeSuggestion,
      parentProposal: stored?.parentProposal,
      reverseDiscoveryOfferIds: stored?.reverseDiscoveryOfferIds,
    });

    // Prefer explicit exchange/session prefill; otherwise restore buyer concept draft.
    const useDraft =
      !stored &&
      existingDraft &&
      (!product || !existingDraft.productId || existingDraft.productId === product.id);

    if (useDraft && existingDraft) {
      result.form = { ...result.form, ...existingDraft.form };
      setEditingDraft(true);
    } else {
      setEditingDraft(false);
    }

    if (product) {
      const allowed = allowedBuyerProposalSettlementModes(
        product.barterOpenness,
      );
      if (!allowed.includes(result.form.settlementMode)) {
        result.form.settlementMode = allowed[0] ?? "MONEY";
      }
      // Listing identity is immutable for product-bound proposals.
      result.form.title = product.title;
    }

    setForm(result.form);
    initialFormRef.current = result.form;
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
  }, [open, contextHeader, product, conversationId]);

  // Keep sticky CTA above the mobile keyboard (Safari / PWA / Chrome).
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const inset = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop),
      );
      setKeyboardInset(inset);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [open]);

  const allowedSettlementModes = useMemo(() => {
    return allowedBuyerProposalSettlementModes(product?.barterOpenness);
  }, [product?.barterOpenness]);

  const showPaymentPath =
    (form.settlementMode === "MONEY" ||
      form.settlementMode === "MONEY_AND_VALUE") &&
    Boolean(product);

  const sendLabelKey = resolveProposalSendLabelKey(product?.marketplaceCategory);

  const readinessProduct = useMemo(
    () =>
      product
        ? {
            id: product.id,
            barterOpenness: product.barterOpenness,
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
        isAuthenticated: sessionStatus === "authenticated",
        requirePaymentPathForMoney: Boolean(product),
      }),
    [form, readinessProduct, sessionStatus, product],
  );

  const submitBlockedReason =
    !busy && !liveReadiness.ok ? liveReadiness.errorKey : null;

  const persistDraftIfNeeded = (): boolean => {
    const initial = initialFormRef.current;
    if (
      !isMeaningfulProposalDraft(form, initial) &&
      !(initial && isFormDirty(form, initial))
    ) {
      // Empty close: keep existing draft only if still meaningful; else clear nothing new.
      return false;
    }
    saveProposalDraft({
      conversationId,
      form: product ? { ...form, title: product.title } : form,
      productId: product?.id ?? null,
    });
    onDraftChanged?.();
    return true;
  };

  const handleCloseRequest = () => {
    if (busy) return;
    // Closing never sends. Persist buyer-private CONCEPT when there is work to keep.
    persistDraftIfNeeded();
    onClose();
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || busy) return;
    setError(null);

    const formForSubmit =
      product != null ? { ...form, title: product.title } : form;

    const readiness = validateProposalReadiness({
      form: formForSubmit,
      product: readinessProduct,
      isAuthenticated: sessionStatus === "authenticated",
      requirePaymentPathForMoney: Boolean(product),
    });
    if (!readiness.ok) {
      setError(t(readiness.errorKey));
      return;
    }

    const payload = formValuesToApiPayload(formForSubmit, {
      productId: product?.id ?? null,
      showPaymentPath,
    });

    submitLockRef.current = true;
    setBusy(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `proposal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(
        `/api/conversations/${conversationId}/proposals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
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
        submitLockRef.current = false;
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

      clearProposalDraft(conversationId);
      setEditingDraft(false);
      onDraftChanged?.();
      onCreated();
      onClose();
    } catch {
      setError(t("common.error"));
      submitLockRef.current = false;
    } finally {
      setBusy(false);
    }
  };

  const preventImplicitEnterSubmit = (
    e: React.KeyboardEvent<HTMLFormElement>,
  ) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "textarea") return;
    if (tag === "button" && (target as HTMLButtonElement).type === "submit") {
      return;
    }
    // Enter in inputs must not silently send the proposal.
    e.preventDefault();
  };

  const footerPad = `max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem))`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-proposal-title"
      data-hc-proposal-sheet=""
      style={{
        // Lift above soft keyboard without covering the sticky CTA.
        paddingBottom: keyboardInset > 0 ? keyboardInset : undefined,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseRequest();
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl max-h-[min(92dvh,100svh)] lg:rounded-2xl lg:max-h-[min(90dvh,90vh)]"
        data-hc-proposal-sheet-panel=""
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardList className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
              <h2
                id="create-proposal-title"
                className="truncate text-base font-semibold text-gray-900"
              >
                {t("proposal.create.title")}
              </h2>
            </div>
            {editingDraft || isMeaningfulProposalDraft(form, initialFormRef.current) ? (
              <p className="pl-7 text-[11px] font-medium text-amber-800">
                {t("proposal.create.conceptBadge")}
              </p>
            ) : (
              <p className="pl-7 text-[11px] text-gray-500">
                {t("proposal.create.reviewHint")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseRequest}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          onKeyDown={preventImplicitEnterSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {product ? <ProposalProductSummary product={product} /> : null}

            {prefillMeta.exchangeSuggestionUsed ? (
              <p className="rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-2 text-[11px] text-teal-800">
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
              lockListingTitle={Boolean(product)}
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
                      sellerStripeReady: product.sellerStripeReady,
                      homeCheffCheckoutBlockedReason:
                        product.homeCheffCheckoutBlockedReason,
                      fulfillmentOptions: product.fulfillmentOptions,
                      delivery: product.delivery,
                      barterOpenness: product.barterOpenness,
                      priceModel: product.priceModel,
                      marketplaceCategory: product.marketplaceCategory,
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
          </div>

          <div
            className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)]"
            data-hc-proposal-sticky-cta=""
            style={{ paddingBottom: footerPad }}
          >
            <button
              type="submit"
              disabled={busy || !liveReadiness.ok}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              data-hc-proposal-submit=""
              aria-disabled={busy || !liveReadiness.ok}
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
            {!liveReadiness.ok && submitBlockedReason ? (
              <p
                className="mt-1.5 text-center text-[12px] font-medium text-amber-900"
                role="status"
                data-hc-proposal-submit-blocked-reason=""
              >
                {t(submitBlockedReason)}
              </p>
            ) : (
              <p className="mt-1.5 text-center text-[11px] text-gray-500" role="status">
                {t("proposal.create.explicitSendOnly")}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

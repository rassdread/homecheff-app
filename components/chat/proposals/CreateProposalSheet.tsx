"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, ClipboardList } from "lucide-react";
import type { SettlementMode } from "@prisma/client";
import AcceptedValuesPicker from "@/components/products/marketplace/AcceptedValuesPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { deriveSettlementModeFromProduct } from "@/lib/proposals/proposal-settlement";
import { allowedSettlementModesForBarterOpenness } from "@/lib/marketplace/commerce/barter-commerce-alignment";
import { PROPOSAL_I18N } from "@/lib/proposals/proposal-i18n-keys";
import { resolveProposalSendLabelKey } from "@/lib/proposals/proposal-send-label";
import type { ResolvedConversationHeader } from "@/lib/communication/resolveConversationHeader";
import type { ProposalPaymentPath } from "@/lib/proposals/proposal-product-binding";
import { allowedFulfillmentTypes } from "@/lib/proposals/proposal-fulfillment-utils";
import ProposalProductSummary from "./ProposalProductSummary";
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from "@/lib/marketplace/exchange/exchange-funnel-analytics";

export type CreateProposalFormValues = {
  title: string;
  description: string;
  quantity: string;
  amountEuros: string;
  requestedDate: string;
  requestedTimeWindow: string;
  fulfillmentType: "" | "PICKUP" | "DELIVERY";
  settlementMode: SettlementMode;
  paymentPath: ProposalPaymentPath;
  acceptedValueTaxonomyIds: string[];
  requestedValueTaxonomyIds: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  conversationId: string;
  contextHeader?: ResolvedConversationHeader | null;
};

const SETTLEMENT_MODES: SettlementMode[] = [
  "MONEY",
  "MONEY_AND_VALUE",
  "VALUE_ONLY",
  "FREE",
  "VOLUNTARY",
];

const PAYMENT_PATHS: ProposalPaymentPath[] = [
  "HOMECHEFF_CHECKOUT",
  "DIRECT_CONTACT",
  "NONE",
];

function initialFromHeader(
  contextHeader?: ResolvedConversationHeader | null,
): CreateProposalFormValues {
  const base: CreateProposalFormValues = {
    title: "",
    description: "",
    quantity: "1",
    amountEuros: "",
    requestedDate: "",
    requestedTimeWindow: "",
    fulfillmentType: "",
    settlementMode: "MONEY",
    paymentPath: "NONE",
    acceptedValueTaxonomyIds: [],
    requestedValueTaxonomyIds: [],
  };
  if (contextHeader?.kind === "PRODUCT") {
    const product = contextHeader.product;
    const allowed = allowedFulfillmentTypes(product.fulfillmentOptions);
    const defaultFulfillment =
      product.delivery === "DELIVERY" && allowed.includes("DELIVERY")
        ? "DELIVERY"
        : allowed.includes("PICKUP")
          ? "PICKUP"
          : allowed[0] ?? "";
    return {
      ...base,
      title: product.title,
      amountEuros: product.priceCents ? String(product.priceCents / 100) : "",
      quantity: "1",
      fulfillmentType: defaultFulfillment,
      settlementMode: deriveSettlementModeFromProduct({
        priceCents: product.priceCents,
        priceModel: product.priceModel,
        acceptedSpecializations: product.acceptedSpecializations,
        barterOpenness: product.barterOpenness as import("@prisma/client").BarterOpenness | null,
      }),
      paymentPath: product.defaultPaymentPath,
      acceptedValueTaxonomyIds: [...product.acceptedSpecializations],
    };
  }
  return base;
}

export default function CreateProposalSheet({
  open,
  onClose,
  onCreated,
  conversationId,
  contextHeader,
}: Props) {
  const { t } = useTranslation();
  const product =
    contextHeader?.kind === "PRODUCT" ? contextHeader.product : null;

  const [form, setForm] = useState<CreateProposalFormValues>(() =>
    initialFromHeader(contextHeader),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const next = initialFromHeader(contextHeader);
      if (contextHeader?.kind === "PRODUCT") {
        const allowed = allowedSettlementModesForBarterOpenness(
          contextHeader.product.barterOpenness,
        );
        if (!allowed.includes(next.settlementMode)) {
          next.settlementMode = allowed[0] ?? "MONEY";
        }
      }
      setForm(next);
      setError(null);
      if (contextHeader?.kind === "PRODUCT") {
        const p = contextHeader.product;
        trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.proposalSheetOpened, {
          listingId: p.id,
          barterOpenness: p.barterOpenness,
          acceptedSpecializations: p.acceptedSpecializations,
          orderMethod: p.orderMethod,
          surface: "chat",
          entrypoint: "create_proposal_sheet_open",
        });
      }
    }
  }, [open, contextHeader]);

  const allowedSettlementModes = useMemo(() => {
    if (!product) return SETTLEMENT_MODES;
    return allowedSettlementModesForBarterOpenness(product.barterOpenness);
  }, [product]);

  const showMoneyField = useMemo(
    () =>
      form.settlementMode === "MONEY" ||
      form.settlementMode === "MONEY_AND_VALUE",
    [form.settlementMode],
  );
  const showValuePicker = useMemo(
    () =>
      form.settlementMode === "VALUE_ONLY" ||
      form.settlementMode === "MONEY_AND_VALUE",
    [form.settlementMode],
  );
  const showPaymentPath = showMoneyField && Boolean(product);

  const fulfillmentOptions = useMemo(() => {
    if (!product) return ["PICKUP", "DELIVERY"] as const;
    return allowedFulfillmentTypes(product.fulfillmentOptions);
  }, [product]);

  const maxQuantity = product?.availableStock ?? undefined;
  const sendLabelKey = resolveProposalSendLabelKey(product?.marketplaceCategory);

  if (!open) return null;

  const set =
    (key: keyof CreateProposalFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const title = form.title.trim();
    if (!title) {
      setError(t("marketplace.errors.titleDescriptionRequired"));
      return;
    }

    const quantity = form.quantity.trim()
      ? parseInt(form.quantity, 10)
      : undefined;

    if (maxQuantity != null && quantity != null && quantity > maxQuantity) {
      setError(
        t("proposal.productBinding.exceedsStock", { count: maxQuantity }),
      );
      return;
    }
    if (maxQuantity != null && maxQuantity <= 0) {
      setError(t("proposal.productBinding.outOfStock"));
      return;
    }

    const euros = form.amountEuros.trim()
      ? parseFloat(form.amountEuros.replace(",", "."))
      : undefined;
    const amountCents =
      showMoneyField && euros != null && Number.isFinite(euros)
        ? Math.round(euros * 100)
        : null;

    const productId = product?.id;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: form.description.trim() || null,
            quantity: Number.isFinite(quantity!) ? quantity : null,
            amountCents,
            requestedDate: form.requestedDate || null,
            requestedTimeWindow: form.requestedTimeWindow.trim() || null,
            fulfillmentType: form.fulfillmentType || null,
            productId: productId ?? null,
            settlementMode: form.settlementMode,
            paymentPath: showPaymentPath ? form.paymentPath : "NONE",
            acceptedValueTaxonomyIds: form.acceptedValueTaxonomyIds,
            requestedValueTaxonomyIds: form.requestedValueTaxonomyIds,
          }),
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
      if (product) {
        trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.proposalSubmitted, {
          listingId: product.id,
          barterOpenness: product.barterOpenness,
          acceptedSpecializations: product.acceptedSpecializations,
          orderMethod: product.orderMethod,
          settlementMode: form.settlementMode,
          surface: "chat",
          entrypoint: "create_proposal_submit",
          hasAcceptedValues: form.acceptedValueTaxonomyIds.length > 0,
        });
      }
      onCreated();
      onClose();
      setForm(initialFromHeader(contextHeader));
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

          <div>
            <p className="text-xs font-semibold text-gray-900 mb-2">
              {t(PROPOSAL_I18N.settlementHeading)}
            </p>
            <p className="text-[11px] text-gray-500 mb-2">
              {t("proposal.create.settlementHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {allowedSettlementModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, settlementMode: mode }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    form.settlementMode === mode
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  {t(PROPOSAL_I18N.settlement[mode])}
                </button>
              ))}
            </div>
          </div>

          {showPaymentPath ? (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-2">
                {t("deal.paymentHeading")}
              </p>
              <div className="flex flex-col gap-2">
                {PAYMENT_PATHS.filter((path) => {
                  if (path === "HOMECHEFF_CHECKOUT") {
                    return product?.acceptHomeCheffPayment;
                  }
                  if (path === "DIRECT_CONTACT") {
                    return product?.acceptDirectContact;
                  }
                  return false;
                }).map((path) => {
                  const disabled =
                    path === "HOMECHEFF_CHECKOUT" &&
                    !product?.canHomeCheffCheckout;
                  return (
                    <button
                      key={path}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, paymentPath: path }))
                      }
                      className={`rounded-lg border px-3 py-2 text-left text-xs ${
                        form.paymentPath === path
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 text-gray-700"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {t(PROPOSAL_I18N.paymentPath[path])}
                      {disabled && product?.homeCheffCheckoutBlockedReason ? (
                        <span className="mt-0.5 block text-[10px] text-amber-700">
                          {t(product.homeCheffCheckoutBlockedReason)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {form.acceptedValueTaxonomyIds.length > 0 ? (
            <p className="text-[11px] text-emerald-700">
              {t("proposal.create.prefilledAccepted")}
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t("marketplace.form.titleLabel")}
            </label>
            <input
              required
              value={form.title}
              onChange={set("title")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t("marketplace.form.descriptionLabel")}
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {t("productOrder.quantityLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={form.quantity}
                onChange={set("quantity")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {showMoneyField ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t("marketplace.form.priceLabel")}
                </label>
                <input
                  inputMode="decimal"
                  value={form.amountEuros}
                  onChange={set("amountEuros")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            ) : null}
          </div>

          {showValuePicker ? (
            <AcceptedValuesPicker
              value={form.requestedValueTaxonomyIds}
              onChange={(ids) =>
                setForm((prev) => ({ ...prev, requestedValueTaxonomyIds: ids }))
              }
              headingKey="marketplace.acceptedValues.offeredInReturnHeading"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {t("marketplace.form.dateLabel", { defaultValue: "Datum" })}
              </label>
              <input
                type="date"
                value={form.requestedDate}
                onChange={set("requestedDate")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {t("marketplace.form.timeLabel", { defaultValue: "Tijd" })}
              </label>
              <input
                value={form.requestedTimeWindow}
                onChange={set("requestedTimeWindow")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="18:00"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t("marketplace.fulfillment.heading")}
            </label>
            <select
              value={form.fulfillmentType}
              onChange={set("fulfillmentType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">—</option>
              {fulfillmentOptions.includes("PICKUP") ? (
                <option value="PICKUP">
                  {t("marketplace.fulfillment.pickup")}
                </option>
              ) : null}
              {fulfillmentOptions.includes("DELIVERY") ? (
                <option value="DELIVERY">
                  {t("marketplace.fulfillment.delivery")}
                </option>
              ) : null}
            </select>
          </div>

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

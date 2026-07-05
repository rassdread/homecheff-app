"use client";

import { useState } from "react";
import { Loader2, ClipboardList } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import MarketplaceBadgeList from "@/components/marketplace/MarketplaceBadgeList";
import { getMarketplacePriceDisplay } from "@/lib/marketplace/price-display";
import type {
  CommunityOrderDTO,
  ProposalDTO,
} from "@/lib/proposals/proposal-types";
import type { DeliveryRequestDTO } from "@/lib/delivery/delivery-marketplace-types";
import { paymentPathFromSummary } from "@/lib/proposals/proposal-accept-routing";
import { PROPOSAL_I18N } from "@/lib/proposals/proposal-i18n-keys";
import type { SettlementMode } from "@prisma/client";
import DealCard from "./DealCard";

type Props = {
  proposal: ProposalDTO;
  currentUserId: string;
  formatTime: (iso: string) => string;
  messageCreatedAt?: string;
  communityOrder?: CommunityOrderDTO | null;
  deliveryRequest?: DeliveryRequestDTO | null;
  onUpdated?: (
    proposal: ProposalDTO,
    extra?: {
      communityOrder?: CommunityOrderDTO;
      deliveryRequest?: DeliveryRequestDTO | null;
    },
  ) => void;
};

function statusBadgeClass(status: ProposalDTO["status"]): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "COUNTERED":
      return "bg-sky-100 text-sky-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatRequestedDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return null;
  }
}

export default function ProposalCard({
  proposal,
  currentUserId,
  formatTime,
  messageCreatedAt,
  communityOrder,
  deliveryRequest,
  onUpdated,
}: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<"accept" | "reject" | "counter" | null>(
    null,
  );
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState(
    proposal.amountCents != null ? String(proposal.amountCents / 100) : "",
  );
  const [counterTitle, setCounterTitle] = useState(proposal.title);
  const [error, setError] = useState<string | null>(null);

  const isCreator = proposal.createdById === currentUserId;
  const canAct = proposal.status === "PENDING" && !isCreator;
  const canCancel = proposal.status === "PENDING" && isCreator;

  const priceLabel = getMarketplacePriceDisplay(
    {
      priceCents: proposal.amountCents,
      priceModel:
        proposal.settlementMode === "VOLUNTARY"
          ? "VOLUNTARY"
          : proposal.settlementMode === "VALUE_ONLY" ||
              proposal.settlementMode === "FREE"
            ? "ON_REQUEST"
            : "FIXED",
      acceptedSpecializations: proposal.requestedValueTaxonomyIds,
    },
    t,
  );

  const showMoney =
    proposal.settlementMode === "MONEY" ||
    proposal.settlementMode === "MONEY_AND_VALUE";
  const showValue =
    proposal.settlementMode === "VALUE_ONLY" ||
    proposal.settlementMode === "MONEY_AND_VALUE" ||
    proposal.settlementMode === "FREE" ||
    proposal.settlementMode === "VOLUNTARY";

  const runAction = async (
    action: "accept" | "reject" | "counter" | "cancel",
    body?: Record<string, unknown>,
  ) => {
    setError(null);
    setBusy(action === "cancel" ? "reject" : action);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.error === "string" && data.error.startsWith("proposal.")
            ? data.error
            : null;
        setError(errKey ? t(errKey) : data.error || t("common.error"));
        return;
      }
      if (data.proposal) {
        onUpdated?.(data.proposal, {
          communityOrder: data.communityOrder ?? undefined,
          deliveryRequest: data.deliveryRequest ?? undefined,
        });
      }
      setShowCounter(false);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(null);
    }
  };

  const handleCounter = () => {
    const euros = parseFloat(counterAmount.replace(",", "."));
    const amountCents = Number.isFinite(euros)
      ? Math.round(euros * 100)
      : undefined;
    void runAction("counter", {
      title: counterTitle.trim() || proposal.title,
      amountCents,
      settlementMode: proposal.settlementMode,
      requestedValueTaxonomyIds: proposal.requestedValueTaxonomyIds,
      acceptedValueTaxonomyIds: proposal.acceptedValueTaxonomyIds,
    });
  };

  const dateLabel = formatRequestedDate(proposal.requestedDate);
  const fulfillmentLabel =
    proposal.fulfillmentType === "DELIVERY"
      ? t("deal.fulfillment.delivery")
      : proposal.fulfillmentType === "PICKUP"
        ? t("deal.fulfillment.pickup")
        : null;

  const settlementLabel = t(
    PROPOSAL_I18N.settlement[proposal.settlementMode as SettlementMode],
  );

  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);
  const paymentPathLabel =
    paymentPath !== "NONE"
      ? t(PROPOSAL_I18N.paymentPath[paymentPath])
      : null;

  const hasValueHighlight =
    proposal.acceptedValueTaxonomyIds.length > 0 ||
    proposal.requestedValueTaxonomyIds.length > 0;

  return (
    <div className="flex justify-center px-1">
      <div className="w-full max-w-md rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2">
          <ClipboardList className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
            {t(PROPOSAL_I18N.cardHeading)}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(proposal.status)}`}
          >
            {t(PROPOSAL_I18N.status[proposal.status])}
          </span>
        </div>

        <div className="px-3 py-3 space-y-2">
          <p className="text-sm font-semibold text-gray-900">{proposal.title}</p>
          {proposal.description ? (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">
              {proposal.description}
            </p>
          ) : null}

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
              {t(PROPOSAL_I18N.settlementHeading)}
            </p>
            <p className="text-xs font-medium text-indigo-900">{settlementLabel}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(showMoney || showValue) && (
              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                {t(PROPOSAL_I18N.highlights.price)}: {priceLabel}
              </span>
            )}
            {paymentPathLabel ? (
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                {t(PROPOSAL_I18N.highlights.payment)}: {paymentPathLabel}
              </span>
            ) : null}
            {fulfillmentLabel ? (
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                {t(PROPOSAL_I18N.highlights.delivery)}: {fulfillmentLabel}
              </span>
            ) : null}
            {hasValueHighlight ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                {t(PROPOSAL_I18N.highlights.value)}
              </span>
            ) : null}
          </div>

          {proposal.acceptedValueTaxonomyIds.length > 0 ? (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-600">
                {t(PROPOSAL_I18N.acceptsLabel)}
              </p>
              <MarketplaceBadgeList
                specializations={proposal.acceptedValueTaxonomyIds}
                variant="accepted"
                maxVisible={4}
                size="sm"
              />
            </div>
          ) : null}

          {proposal.requestedValueTaxonomyIds.length > 0 ? (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-600">
                {t(PROPOSAL_I18N.seeksLabel)}
              </p>
              <MarketplaceBadgeList
                specializations={proposal.requestedValueTaxonomyIds}
                variant="accepted"
                maxVisible={4}
                size="sm"
              />
            </div>
          ) : null}

          {dateLabel ? (
            <p className="text-xs text-gray-600 capitalize">{dateLabel}</p>
          ) : null}
          {proposal.requestedTimeWindow ? (
            <p className="text-xs text-gray-600">{proposal.requestedTimeWindow}</p>
          ) : null}

          {proposal.status === "ACCEPTED" && communityOrder ? (
            <DealCard
              communityOrder={communityOrder}
              proposal={proposal}
              deliveryRequest={deliveryRequest}
              onDeliveryRequestCreated={(dr) =>
                onUpdated?.(proposal, { deliveryRequest: dr })
              }
            />
          ) : null}

          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {showCounter ? (
            <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <input
                type="text"
                value={counterTitle}
                onChange={(e) => setCounterTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                placeholder={t("marketplace.form.titleLabel")}
              />
              {(proposal.settlementMode === "MONEY" ||
                proposal.settlementMode === "MONEY_AND_VALUE") && (
                <input
                  type="text"
                  inputMode="decimal"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="€"
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void handleCounter()}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {busy === "counter" ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t(PROPOSAL_I18N.actions.sendCounter)
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounter(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : null}

          {canAct && !showCounter ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction("accept")}
                className="flex-1 min-w-[5rem] rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === "accept" ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t(PROPOSAL_I18N.actions.accept)
                )}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setShowCounter(true)}
                className="flex-1 min-w-[5rem] rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t(PROPOSAL_I18N.actions.counter)}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction("reject")}
                className="flex-1 min-w-[5rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {busy === "reject" ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t(PROPOSAL_I18N.actions.reject)
                )}
              </button>
            </div>
          ) : null}

          {canCancel ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runAction("cancel")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {t(PROPOSAL_I18N.actions.cancel)}
            </button>
          ) : null}
        </div>

        {messageCreatedAt ? (
          <p className="px-3 pb-2 text-[10px] text-gray-400">
            {formatTime(messageCreatedAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

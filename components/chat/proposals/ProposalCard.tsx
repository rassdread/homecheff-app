"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from "@/lib/marketplace/exchange/exchange-funnel-analytics";
import { PROPOSAL_I18N, DEAL_COMMITMENT_I18N } from "@/lib/proposals/proposal-i18n-keys";
import {
  resolveAcceptedAlternativesLabelKey,
  resolveBuyerConsiderationLabelKey,
  resolveBuyerConsiderationPhotosLabelKey,
  resolveSellerTargetLabelKey,
} from "@/lib/proposals/proposal-barter-actor-labels";
import { normalizeBarterOfferImageUrls } from "@/lib/proposals/barter-offer-images";
import type { SettlementMode } from "@prisma/client";
import DealCard from "./DealCard";
import CounterProposalForm from "./CounterProposalForm";
import {
  PROPOSAL_FLOW_EVENTS,
  trackProposalFlowEvent,
} from "@/lib/proposals/proposal-analytics";
import ConsumerCommerceDisclosure from "@/components/legal/ConsumerCommerceDisclosure";
import type { ConsumerCommerceContext } from "@/lib/legal/consumer-commerce-context";
import { consumerContextFromProductPayload } from "@/lib/legal/consumer-context-from-product";

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
  const [error, setError] = useState<string | null>(null);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);
  const [consumerCommerce, setConsumerCommerce] =
    useState<ConsumerCommerceContext | null>(null);
  const productPayloadRef = useRef<Record<string, unknown> | null>(null);
  const [serviceStartAck, setServiceStartAck] = useState(false);
  const [serviceStartRequested, setServiceStartRequested] = useState(false);

  const isCreator = proposal.createdById === currentUserId;
  const canAct = proposal.status === "PENDING" && !isCreator;
  const canCancel = proposal.status === "PENDING" && isCreator;
  const viewerIsSeller = currentUserId === proposal.sellerId;
  const loadConsumerCommerce =
    Boolean(proposal.productId) && (canAct || viewerIsSeller);

  const barterActors = {
    currentUserId,
    buyerId: proposal.buyerId,
    sellerId: proposal.sellerId,
    createdById: proposal.createdById,
  };
  const buyerConsiderationLabelKey = resolveBuyerConsiderationLabelKey(
    barterActors,
  );
  const buyerPhotosLabelKey = resolveBuyerConsiderationPhotosLabelKey(
    barterActors,
  );
  const alternativesLabelKey = resolveAcceptedAlternativesLabelKey();
  const targetLabelKey = resolveSellerTargetLabelKey();
  const barterPhotos = normalizeBarterOfferImageUrls(
    proposal.proposalSummary?.barterOfferImageUrls,
  );

  useEffect(() => {
    if (!loadConsumerCommerce || !proposal.productId) {
      setConsumerCommerce(null);
      return;
    }
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/products/${proposal.productId}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const product = (data.product || data) as Record<string, unknown>;
        productPayloadRef.current = product;
        // Overlay proposal money/barter onto product for LEGAL-3 path
        const barter =
          proposal.settlementMode === "VALUE_ONLY"
            ? "BARTER_ONLY"
            : proposal.settlementMode === "MONEY_AND_VALUE"
              ? "MONEY_AND_BARTER"
              : proposal.settlementMode === "FREE" ||
                  proposal.settlementMode === "VOLUNTARY"
                ? "MONEY"
                : "MONEY";
        const priceModel =
          proposal.settlementMode === "VOLUNTARY"
            ? "VOLUNTARY"
            : proposal.settlementMode === "FREE"
              ? "VOLUNTARY"
              : "FIXED";
        setConsumerCommerce(
          consumerContextFromProductPayload(
            {
              ...product,
              priceCents: proposal.amountCents ?? product.priceCents,
              priceModel,
              barterOpenness: barter,
            },
            {
              serviceStartDuringWithdrawalRequested: serviceStartRequested,
            },
          ),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => ac.abort();
  }, [
    loadConsumerCommerce,
    proposal.productId,
    proposal.amountCents,
    proposal.settlementMode,
    serviceStartRequested,
  ]);

  const refreshConsumerCommerce = async () => {
    if (!proposal.productId) return;
    try {
      const res = await fetch(`/api/products/${proposal.productId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      const product = (data.product || data) as Record<string, unknown>;
      productPayloadRef.current = product;
      const barter =
        proposal.settlementMode === "VALUE_ONLY"
          ? "BARTER_ONLY"
          : proposal.settlementMode === "MONEY_AND_VALUE"
            ? "MONEY_AND_BARTER"
            : proposal.settlementMode === "FREE" ||
                proposal.settlementMode === "VOLUNTARY"
              ? "MONEY"
              : "MONEY";
      const priceModel =
        proposal.settlementMode === "VOLUNTARY"
          ? "VOLUNTARY"
          : proposal.settlementMode === "FREE"
            ? "VOLUNTARY"
            : "FIXED";
      setConsumerCommerce(
        consumerContextFromProductPayload(
          {
            ...product,
            priceCents: proposal.amountCents ?? product.priceCents,
            priceModel,
            barterOpenness: barter,
          },
          {
            serviceStartDuringWithdrawalRequested: serviceStartRequested,
          },
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const applyDeclaredCommerce = (declaration: string) => {
    const product = productPayloadRef.current;
    if (!product) {
      void refreshConsumerCommerce();
      return;
    }
    const seller = {
      ...((product.seller as Record<string, unknown> | undefined) ?? {}),
      commerceDeclaration: declaration,
    };
    const barter =
      proposal.settlementMode === "VALUE_ONLY"
        ? "BARTER_ONLY"
        : proposal.settlementMode === "MONEY_AND_VALUE"
          ? "MONEY_AND_BARTER"
          : proposal.settlementMode === "FREE" ||
              proposal.settlementMode === "VOLUNTARY"
            ? "MONEY"
            : "MONEY";
    const priceModel =
      proposal.settlementMode === "VOLUNTARY"
        ? "VOLUNTARY"
        : proposal.settlementMode === "FREE"
          ? "VOLUNTARY"
          : "FIXED";
    const nextPayload = {
      ...product,
      seller,
      priceCents: proposal.amountCents ?? product.priceCents,
      priceModel,
      barterOpenness: barter,
    };
    productPayloadRef.current = nextPayload;
    setConsumerCommerce(
      consumerContextFromProductPayload(nextPayload, {
        serviceStartDuringWithdrawalRequested: serviceStartRequested,
      }),
    );
    void refreshConsumerCommerce();
  };

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
    if (
      action === "cancel" &&
      typeof window !== "undefined" &&
      !window.confirm(t(PROPOSAL_I18N.cancelConfirm))
    ) {
      return;
    }
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
        if (action === "accept" && data.communityOrder && proposal.productId) {
          trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.communityOrderCreated, {
            listingId: proposal.productId,
            settlementMode: proposal.settlementMode,
            surface: "chat",
            entrypoint: "proposal_accept",
            communityOrderId: data.communityOrder.id,
            proposalId: proposal.id,
            hasAcceptedValues: proposal.acceptedValueTaxonomyIds.length > 0,
          });
          trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.accepted, {
            source: "chat",
            listingId: proposal.productId,
            settlementType: proposal.settlementMode,
            proposalId: proposal.id,
            surface: "chat",
          });
        }
        if (action === "reject") {
          trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.rejected, {
            source: "chat",
            listingId: proposal.productId,
            settlementType: proposal.settlementMode,
            proposalId: proposal.id,
            surface: "chat",
          });
        }
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

  const handleAccept = () => {
    if (!commitmentAccepted) {
      setError(t(DEAL_COMMITMENT_I18N.requiredError));
      return;
    }
    if (consumerCommerce?.serviceStartAckRequired && !serviceStartAck) {
      setError(t("legal3.serviceStartAckRequired"));
      return;
    }
    void runAction("accept", {
      commitmentAccepted: true,
      serviceStartDuringWithdrawalAck: serviceStartAck || undefined,
    });
  };

  const handleCountered = (child: ProposalDTO) => {
    onUpdated?.(child);
    setShowCounter(false);
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

  const statusChipKey =
    proposal.status === "PENDING" && canAct
      ? "proposal.status.received"
      : proposal.status === "PENDING" && isCreator
        ? "proposal.status.awaitingResponse"
        : PROPOSAL_I18N.status[proposal.status];

  return (
    <div className="flex justify-center px-1">
      <div className="w-full max-w-md rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2">
          <ClipboardList className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
            {proposal.status === "PENDING" && canAct
              ? t("proposal.card.receivedHeading")
              : proposal.status === "PENDING" && isCreator
                ? t("proposal.card.sentHeading")
                : t(PROPOSAL_I18N.cardHeading)}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(proposal.status)}`}
          >
            {t(statusChipKey)}
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
                {t(alternativesLabelKey)}
              </p>
              <MarketplaceBadgeList
                specializations={proposal.acceptedValueTaxonomyIds}
                variant="accepted"
                maxVisible={4}
                size="sm"
              />
            </div>
          ) : null}

          {proposal.requestedValueTaxonomyIds.length > 0 ||
          showMoney ||
          barterPhotos.length > 0 ? (
            <div className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/80 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                {t(buyerConsiderationLabelKey)}
              </p>
              {showMoney &&
              proposal.amountCents != null &&
              proposal.amountCents > 0 ? (
                <p className="text-xs font-semibold text-gray-900">
                  {priceLabel}
                </p>
              ) : null}
              {proposal.requestedValueTaxonomyIds.length > 0 ? (
                <MarketplaceBadgeList
                  specializations={proposal.requestedValueTaxonomyIds}
                  variant="accepted"
                  maxVisible={4}
                  size="sm"
                />
              ) : null}
              {barterPhotos.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-gray-600">
                    {t(buyerPhotosLabelKey)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {barterPhotos.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-14 w-14 overflow-hidden rounded-md border border-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {proposal.title ? (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-gray-600">
                {t(targetLabelKey)}
              </p>
              <p className="text-xs font-medium text-gray-900">{proposal.title}</p>
            </div>
          ) : null}

          {dateLabel ? (
            <p className="text-xs text-gray-600 capitalize">{dateLabel}</p>
          ) : null}
          {proposal.requestedTimeWindow ? (
            <p className="text-xs text-gray-600">{proposal.requestedTimeWindow}</p>
          ) : null}

          {paymentPath === "DIRECT_CONTACT" ? (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              {t(DEAL_COMMITMENT_I18N.directRisk)}
            </p>
          ) : null}

          {proposal.status === "PENDING" && isCreator && !showCounter ? (
            <p className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2">
              {t("proposal.card.awaitingCounterpart")}
            </p>
          ) : null}

          {proposal.status === "ACCEPTED" && communityOrder ? (
            <DealCard
              communityOrder={communityOrder}
              proposal={proposal}
              deliveryRequest={deliveryRequest}
              currentUserId={currentUserId}
              onDeliveryRequestCreated={(dr) =>
                onUpdated?.(proposal, { deliveryRequest: dr })
              }
              onCommunityOrderUpdated={(order) =>
                onUpdated?.(proposal, { communityOrder: order })
              }
            />
          ) : null}

          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {showCounter ? (
            <CounterProposalForm
              proposal={proposal}
              currentUserId={currentUserId}
              onCancel={() => setShowCounter(false)}
              onCountered={handleCountered}
            />
          ) : null}

          {canAct && !showCounter ? (
            <div className="space-y-2 pt-1">
              {consumerCommerce?.showConsumerDisclosure ? (
                <div className="space-y-2">
                  <ConsumerCommerceDisclosure
                    context={
                      serviceStartRequested
                        ? {
                            ...consumerCommerce,
                            serviceStartAckRequired:
                              consumerCommerce.isProfessionalSellerPath &&
                              consumerCommerce.isService,
                          }
                        : consumerCommerce
                    }
                    variant="proposal"
                    serviceStartAckChecked={serviceStartAck}
                    onServiceStartAckChange={setServiceStartAck}
                    allowInlineDeclaration={
                      viewerIsSeller && consumerCommerce.isUndeclaredPath
                    }
                    onCommerceDeclared={(declaration) => {
                      applyDeclaredCommerce(declaration);
                    }}
                  />
                  {consumerCommerce.isService &&
                  consumerCommerce.isProfessionalSellerPath ? (
                    <label className="flex items-start gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={serviceStartRequested}
                        onChange={(e) => {
                          setServiceStartRequested(e.target.checked);
                          if (!e.target.checked) setServiceStartAck(false);
                        }}
                        data-hc-legal3-service-start-request=""
                      />
                      <span>{t("legal3.serviceStartRequest")}</span>
                    </label>
                  ) : null}
                </div>
              ) : null}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitmentAccepted}
                  onChange={(e) => {
                    setCommitmentAccepted(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-700">
                  {t(DEAL_COMMITMENT_I18N.acceptLabel)}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null || !commitmentAccepted}
                onClick={handleAccept}
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
            </div>
          ) : null}

          {!canAct &&
          viewerIsSeller &&
          consumerCommerce?.showConsumerDisclosure &&
          consumerCommerce.isUndeclaredPath ? (
            <ConsumerCommerceDisclosure
              context={consumerCommerce}
              variant="proposal"
              allowInlineDeclaration
              onCommerceDeclared={(declaration) => {
                applyDeclaredCommerce(declaration);
              }}
            />
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

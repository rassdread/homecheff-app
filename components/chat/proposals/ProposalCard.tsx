"use client";

import { useState } from "react";
import { Loader2, ClipboardList } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ProposalDTO } from "@/lib/proposals/proposal-types";

type Props = {
  proposal: ProposalDTO;
  currentUserId: string;
  formatTime: (iso: string) => string;
  messageCreatedAt?: string;
  onUpdated?: (proposal: ProposalDTO) => void;
};

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

function statusLabel(status: ProposalDTO["status"]): string {
  switch (status) {
    case "PENDING":
      return "In afwachting";
    case "ACCEPTED":
      return "Geaccepteerd";
    case "REJECTED":
      return "Afgewezen";
    case "COUNTERED":
      return "Tegenvoorstel gedaan";
    case "EXPIRED":
      return "Verlopen";
    case "CANCELLED":
      return "Geannuleerd";
    default:
      return status;
  }
}

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

export default function ProposalCard({
  proposal,
  currentUserId,
  formatTime,
  messageCreatedAt,
  onUpdated,
}: Props) {
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
        setError(data.error || "Actie mislukt");
        return;
      }
      if (data.proposal) onUpdated?.(data.proposal);
      setShowCounter(false);
    } catch {
      setError("Actie mislukt");
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
    });
  };

  const dateLabel = formatRequestedDate(proposal.requestedDate);
  const fulfillmentLabel =
    proposal.fulfillmentType === "DELIVERY"
      ? "Bezorging"
      : proposal.fulfillmentType === "PICKUP"
        ? "Afhalen"
        : null;

  return (
    <div className="flex justify-center px-1">
      <div className="w-full max-w-md rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2">
          <ClipboardList className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
            Voorstel
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(proposal.status)}`}
          >
            {statusLabel(proposal.status)}
          </span>
        </div>

        <div className="px-3 py-3 space-y-2">
          <p className="text-sm font-semibold text-gray-900">{proposal.title}</p>
          {proposal.description ? (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">
              {proposal.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-800">
            {proposal.quantity != null ? (
              <span>{proposal.quantity}x</span>
            ) : null}
            {proposal.amountCents != null ? (
              <span className="font-semibold text-indigo-700">
                {formatPrice(proposal.amountCents)}
              </span>
            ) : null}
          </div>

          {dateLabel ? (
            <p className="text-xs text-gray-600 capitalize">{dateLabel}</p>
          ) : null}
          {proposal.requestedTimeWindow ? (
            <p className="text-xs text-gray-600">{proposal.requestedTimeWindow}</p>
          ) : null}
          {fulfillmentLabel ? (
            <p className="text-xs font-medium text-gray-700">{fulfillmentLabel}</p>
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
                placeholder="Titel"
              />
              <input
                type="text"
                inputMode="decimal"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Bedrag (€)"
              />
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
                    "Verstuur tegenvoorstel"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounter(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
                >
                  Annuleer
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
                  "Accepteren"
                )}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setShowCounter(true)}
                className="flex-1 min-w-[5rem] rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Tegenvoorstel
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
                  "Afwijzen"
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
              Voorstel annuleren
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

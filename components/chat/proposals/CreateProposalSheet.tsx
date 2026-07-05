"use client";

import { useState } from "react";
import { X, Loader2, ClipboardList } from "lucide-react";
import type { ResolvedConversationHeader } from "@/lib/communication/resolveConversationHeader";

export type CreateProposalFormValues = {
  title: string;
  description: string;
  quantity: string;
  amountEuros: string;
  requestedDate: string;
  requestedTimeWindow: string;
  fulfillmentType: "" | "PICKUP" | "DELIVERY";
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  conversationId: string;
  contextHeader?: ResolvedConversationHeader | null;
};

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
  };
  if (contextHeader?.kind === "PRODUCT") {
    const product = contextHeader.product;
    return {
      ...base,
      title: product.title,
      amountEuros: product.priceCents
        ? String(product.priceCents / 100)
        : "",
      quantity: "1",
      fulfillmentType:
        product.delivery === "DELIVERY"
          ? "DELIVERY"
          : product.delivery === "PICKUP"
            ? "PICKUP"
            : "",
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
  const [form, setForm] = useState<CreateProposalFormValues>(() =>
    initialFromHeader(contextHeader),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const set =
    (key: keyof CreateProposalFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const title = form.title.trim();
    if (!title) {
      setError("Titel is verplicht");
      return;
    }

    const quantity = form.quantity.trim()
      ? parseInt(form.quantity, 10)
      : undefined;
    const euros = form.amountEuros.trim()
      ? parseFloat(form.amountEuros.replace(",", "."))
      : undefined;
    const amountCents =
      euros != null && Number.isFinite(euros)
        ? Math.round(euros * 100)
        : undefined;

    const productId =
      contextHeader?.kind === "PRODUCT"
        ? contextHeader.product.id
        : undefined;

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
            amountCents: amountCents ?? null,
            requestedDate: form.requestedDate || null,
            requestedTimeWindow: form.requestedTimeWindow.trim() || null,
            fulfillmentType: form.fulfillmentType || null,
            productId: productId ?? null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Voorstel kon niet worden aangemaakt");
        return;
      }
      onCreated();
      onClose();
      setForm(initialFromHeader(contextHeader));
    } catch {
      setError("Voorstel kon niet worden aangemaakt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-proposal-title"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 id="create-proposal-title" className="text-base font-semibold text-gray-900">
              Voorstel maken
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Sluiten"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-4 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Titel
            </label>
            <input
              required
              value={form.title}
              onChange={set("title")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Bijv. 3x Lasagna"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Omschrijving (optioneel)
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
                Aantal
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={set("quantity")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Bedrag (€)
              </label>
              <input
                inputMode="decimal"
                value={form.amountEuros}
                onChange={set("amountEuros")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="36"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Datum
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
                Tijd
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
              Afhandeling
            </label>
            <select
              value={form.fulfillmentType}
              onChange={set("fulfillmentType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">—</option>
              <option value="PICKUP">Afhalen</option>
              <option value="DELIVERY">Bezorging</option>
            </select>
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig…
              </>
            ) : (
              "Voorstel versturen"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

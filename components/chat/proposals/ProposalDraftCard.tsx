"use client";

import Link from "next/link";
import { ClipboardList, ExternalLink, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProposalBuyerDraft } from "@/lib/proposals/proposal-draft-storage";

type Props = {
  draft: ProposalBuyerDraft;
  listingTitle?: string | null;
  productId?: string | null;
  onEdit: () => void;
};

function draftSummary(draft: ProposalBuyerDraft): string {
  const amount = draft.form.amountEuros.trim();
  if (amount) {
    const normalized = amount.replace(",", ".");
    return `€${normalized}`;
  }
  if (draft.form.settlementMode === "VALUE_ONLY") return "Ruil";
  if (draft.form.settlementMode === "MONEY_AND_VALUE") return "Geld + ruil";
  if (draft.form.description.trim()) {
    const d = draft.form.description.trim();
    return d.length > 80 ? `${d.slice(0, 77)}…` : d;
  }
  return "";
}

/**
 * Buyer-private CONCEPT card — never a server-delivered proposal.
 * Seller must not see this; ChatBox only renders it for the current buyer.
 */
export default function ProposalDraftCard({
  draft,
  listingTitle,
  productId,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const summary = draftSummary(draft);
  const productHref = productId ? `/product/${productId}` : null;
  const title =
    listingTitle?.trim() ||
    draft.form.title.trim() ||
    t("proposal.card.heading");

  return (
    <div
      className="flex justify-center px-1"
      id="proposal-draft-concept"
      data-hc-proposal-draft-card=""
      data-hc-proposal-draft-private="1"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/90 shadow-sm">
        <div className="flex items-center gap-2 border-b border-amber-200/80 bg-amber-100/80 px-3 py-2">
          <ClipboardList
            className="h-4 w-4 shrink-0 text-amber-800"
            aria-hidden
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-950">
            {t("proposal.card.heading")}
          </span>
          <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
            {t("proposal.status.concept")}
          </span>
        </div>

        <div className="space-y-2 px-3 py-3">
          <p className="text-[11px] font-semibold text-amber-900">
            {t("proposal.card.notSentYet")}
          </p>
          <p className="text-[10px] text-amber-800/90">
            {t("proposal.card.draftPrivateHint")}
          </p>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {summary ? (
            <p className="text-xs text-gray-700">{summary}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-800 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-900"
              data-hc-proposal-edit-draft=""
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("proposal.actions.editDraft")}
            </button>
            {productHref ? (
              <Link
                href={productHref}
                className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {t("proposal.actions.viewItem")}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

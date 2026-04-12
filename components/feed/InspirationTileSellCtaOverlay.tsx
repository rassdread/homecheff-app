"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useCreateFlow } from "@/components/create/CreateFlowContext";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  detailHref: string;
  headline?: string;
  bekijkLabel?: string;
  sellLabel?: string;
  /** Guest flows: e.g. prevent navigation and open login from parent. */
  onDetailClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Inspiratie-tegels: CTA in onderbalk bij hover/focus-within (desktop) of via ⋯ (mobiel).
 */
export default function InspirationTileSellCtaOverlay({
  detailHref,
  headline,
  bekijkLabel,
  sellLabel,
  onDetailClick,
}: Props) {
  const { t } = useTranslation();
  const headlineText = headline ?? t("feed.tileCtaHeadline");
  const bekijkText = bekijkLabel ?? t("feed.tileCtaBekijk");
  const sellText = sellLabel ?? t("feed.tileCtaSell");
  const [open, setOpen] = useState(false);
  const { openCreateFlow } = useCreateFlow();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const panelClass = [
    "absolute inset-x-0 bottom-0 z-20 rounded-t-xl border border-stone-200/90 bg-white/95 p-3 shadow-md backdrop-blur-[2px] transition-opacity duration-200",
    open
      ? "max-md:pointer-events-auto max-md:opacity-100"
      : "max-md:pointer-events-none max-md:opacity-0",
    "md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100",
    "md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100",
  ].join(" ");

  return (
    <>
      <button
        type="button"
        className="md:hidden absolute bottom-3 right-3 z-[25] flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-600 shadow-sm ring-1 ring-black/[0.04] transition hover:bg-stone-50 active:scale-[0.98]"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("feed.tileMoreActionsAria")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      <div
        role="dialog"
        aria-label={headlineText}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-stone-800 mb-2">{headlineText}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={detailHref}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
            onClick={(e) => {
              onDetailClick?.(e);
              close();
            }}
          >
            {bekijkText}
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
              openCreateFlow();
            }}
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600/70 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50/90 transition-colors"
          >
            {sellText}
          </button>
        </div>
      </div>
    </>
  );
}

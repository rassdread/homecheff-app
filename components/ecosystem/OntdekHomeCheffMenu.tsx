"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ECOSYSTEM_BRAND_MARK_URL,
  ECOSYSTEM_HUB_HREF,
  ECOSYSTEM_HUB_LABEL,
  ECOSYSTEM_MASTER_SLOGAN,
  ECOSYSTEM_NAV_LABEL,
  ECOSYSTEM_PANEL_HEADING,
  ECOSYSTEM_PANEL_SUPPORT,
  ECOSYSTEM_PRODUCTS,
  ecosystemCurrentModuleLabel,
  ecosystemProductHref,
  type EcosystemNavSurface,
  type EcosystemProductId,
} from "@/lib/ecosystem-navigation/contract";
import {
  trackEcosystemMenuOpen,
  trackEcosystemProductClick,
} from "@/lib/ecosystem-navigation/analytics";

type Props = {
  currentProduct?: EcosystemProductId;
  authenticated: boolean;
  surface: EcosystemNavSurface;
  variant?: "sidebar" | "compact" | "inline";
  className?: string;
};

const PANEL_WIDTH = 320;
const PANEL_EST_HEIGHT = 520;
const VIEWPORT_PAD = 8;

function computePanelStyle(
  trigger: DOMRect,
  preferUp: boolean,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - trigger.bottom - VIEWPORT_PAD;
  const spaceAbove = trigger.top - VIEWPORT_PAD;
  const openUp =
    preferUp ||
    (spaceBelow < PANEL_EST_HEIGHT && spaceAbove > spaceBelow);

  let top = openUp
    ? Math.max(VIEWPORT_PAD, trigger.top - PANEL_EST_HEIGHT - VIEWPORT_PAD)
    : trigger.bottom + VIEWPORT_PAD;
  if (!openUp && top + PANEL_EST_HEIGHT > vh - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, vh - PANEL_EST_HEIGHT - VIEWPORT_PAD);
  }

  let left = trigger.right - PANEL_WIDTH;
  left = Math.min(Math.max(VIEWPORT_PAD, left), vw - PANEL_WIDTH - VIEWPORT_PAD);
  return { top, left };
}

export function OntdekHomeCheffMenu({
  currentProduct = "homecheff",
  authenticated,
  surface,
  variant = "compact",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const preferUp = surface === "sidebar" || surface === "account_menu";

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        trackEcosystemMenuOpen({
          sourceProduct: currentProduct,
          authenticated,
          surface,
        });
      }
      return next;
    });
  }, [authenticated, currentProduct, surface]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      if (!buttonRef.current) return;
      setPanelPos(computePanelStyle(buttonRef.current.getBoundingClientRect(), preferUp));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, preferUp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  const triggerClass =
    variant === "inline"
      ? "flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
      : "inline-flex items-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

  const panel =
    open && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label={ECOSYSTEM_PANEL_HEADING}
        className="fixed z-[99999] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
        style={{ top: panelPos.top, left: panelPos.left }}
      >
        <div className="mb-2 flex items-start gap-2 border-b border-gray-100 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ECOSYSTEM_BRAND_MARK_URL}
            alt=""
            width={28}
            height={28}
            className="mt-0.5 h-7 w-7 shrink-0 rounded-md"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{ECOSYSTEM_PANEL_HEADING}</p>
            <p className="text-[11px] font-medium tracking-wide text-emerald-800">
              {ECOSYSTEM_MASTER_SLOGAN}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
              {ECOSYSTEM_PANEL_SUPPORT}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Nu: {ecosystemCurrentModuleLabel(currentProduct)}
            </p>
          </div>
        </div>
        {authenticated ? (
          <a
            href={ECOSYSTEM_HUB_HREF}
            className="mb-2 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            onClick={() => close()}
          >
            <span>{ECOSYSTEM_HUB_LABEL}</span>
            <span className="text-[11px] font-medium text-emerald-700">Open →</span>
          </a>
        ) : null}
        <ul className="flex flex-col gap-1" role="list">
          {ECOSYSTEM_PRODUCTS.map((product) => {
            const isCurrent = product.id === currentProduct;
            if (isCurrent) {
              return (
                <li key={product.id}>
                  <div
                    className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2.5"
                    aria-current="true"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-emerald-950">{product.name}</p>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        Je bent hier
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-emerald-900/80">{product.benefit}</p>
                  </div>
                </li>
              );
            }
            return (
              <li key={product.id}>
                <a
                  href={ecosystemProductHref(product, surface)}
                  className="block rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  onClick={() => {
                    trackEcosystemProductClick({
                      sourceProduct: currentProduct,
                      targetProduct: product.id,
                      authenticated,
                      surface,
                    });
                    close();
                  }}
                >
                  <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{product.benefit}</p>
                  <span className="mt-1.5 inline-block text-[11px] font-medium text-emerald-700">
                    Open →
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ECOSYSTEM_BRAND_MARK_URL}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded"
        />
        <span className="min-w-0 truncate">
          {ECOSYSTEM_NAV_LABEL}
          <span className="ml-1 font-normal text-gray-400">
            · {ecosystemCurrentModuleLabel(currentProduct ?? "homecheff")}
          </span>
        </span>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}

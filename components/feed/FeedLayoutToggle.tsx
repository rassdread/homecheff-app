"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { FeedLayoutMode } from "@/lib/feed/feedLayoutPreference";

type FeedLayoutToggleProps = {
  mode: FeedLayoutMode;
  onChange: (mode: FeedLayoutMode) => void;
  compact?: boolean;
};

export default function FeedLayoutToggle({
  mode,
  onChange,
  compact = false,
}: FeedLayoutToggleProps) {
  const { t } = useTranslation();

  const btn = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors touch-manipulation ${
      compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
    } ${
      active
        ? "bg-[#006D52] text-white shadow-sm"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div
      role="group"
      aria-label={t("feed.layoutModeLabel")}
      className={`inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm ${compact ? "shrink-0" : ""}`}
    >
      <button
        type="button"
        className={btn(mode === "cards")}
        aria-pressed={mode === "cards"}
        onClick={() => onChange("cards")}
        title={t("feed.layoutCardsHint")}
      >
        <Rows3 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">
          {t("feed.layoutCards")}
        </span>
      </button>
      <button
        type="button"
        className={btn(mode === "discover")}
        aria-pressed={mode === "discover"}
        onClick={() => onChange("discover")}
        title={t("feed.layoutDiscoverHint")}
      >
        <LayoutGrid className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">
          {t("feed.layoutDiscover")}
        </span>
      </button>
    </div>
  );
}

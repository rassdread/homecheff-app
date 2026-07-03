"use client";

import { Columns2, LayoutGrid, Square } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { HomeDesktopFeedColumns } from "@/lib/feed/homeDesktopFeedColumns";

type Props = {
  columns: HomeDesktopFeedColumns;
  onChange: (cols: HomeDesktopFeedColumns) => void;
};

export default function FeedDesktopColumnToggle({ columns, onChange }: Props) {
  const { t } = useTranslation();

  const btn = (active: boolean) =>
    `inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
      active
        ? "bg-[#006D52] text-white shadow-sm"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div
      role="group"
      aria-label={t("feed.desktopColumnsLabel")}
      className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm shrink-0"
    >
      <button
        type="button"
        className={btn(columns === 1)}
        aria-pressed={columns === 1}
        onClick={() => onChange(1)}
        title={t("feed.desktopColumns1Hint")}
      >
        <Square className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("feed.desktopColumns1")}</span>
      </button>
      <button
        type="button"
        className={btn(columns === 2)}
        aria-pressed={columns === 2}
        onClick={() => onChange(2)}
        title={t("feed.desktopColumns2Hint")}
      >
        <Columns2 className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("feed.desktopColumns2")}</span>
      </button>
      <button
        type="button"
        className={btn(columns === 3)}
        aria-pressed={columns === 3}
        onClick={() => onChange(3)}
        title={t("feed.desktopColumns3Hint")}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("feed.desktopColumns3")}</span>
      </button>
    </div>
  );
}

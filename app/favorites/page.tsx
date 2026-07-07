'use client';

import React from "react";
import FansAndFollowsList from "@/components/FansAndFollowsList";
import { useTranslation } from "@/hooks/useTranslation";

export default function FavoritesPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {t('favoritesHub.pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t('favoritesHub.pageIntro')}</p>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <FansAndFollowsList initialTab="favorites" />
      </section>
    </main>
  );
}

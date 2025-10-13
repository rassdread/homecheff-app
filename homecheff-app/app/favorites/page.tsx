'use client';

import React, { useState } from "react";
import Link from "next/link";
import FansAndFollowsList from "@/components/FansAndFollowsList";

export default function FollowsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Fan van & Fans</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4 text-sm text-gray-600 bg-blue-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Hier zie je alle verkopers waarvan je fan bent en je eigen fans. Je krijgt notificaties wanneer verkopers waarvan je fan bent nieuwe producten plaatsen!
        </div>
        {loading && <div>Bezig met laden...</div>}
        <FansAndFollowsList />
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Dash = {
  ok?: boolean;
  kpis?: {
    pendingCents: number;
    availableCents: number;
    paidCents: number;
    reversedCents: number;
    totalEarnedCents: number;
  };
  productBreakdownCents?: Record<string, number>;
};

function eur(c: number) {
  return `€${(c / 100).toFixed(2)}`;
}

/** Ecosystem ledger panel inside HomeCheff affiliate shell. */
export function HomecheffEcosystemAffiliatePanel() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    void fetch("/api/affiliate/ecosystem-dashboard?source=marketplace", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j: Dash) => setData(j))
      .catch(() => setData({ ok: false }));
  }, []);

  if (!data?.kpis) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Ecosysteem-inkomsten laden…
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Affiliate & netwerk</h2>
      <p className="mt-1 text-xs text-slate-600">
        Eén keer iemand uitnodigen is genoeg. Als iemand uit jouw geldige netwerk later op een
        andere manier actief wordt binnen HomeCheff, kan daar opnieuw affiliate-inkomsten uit
        ontstaan — alleen op eligible HomeCheff-platformomzet, geen garantie.
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        Eén netwerk voor Marketplace, Bezorging, Studio en Growth. Resultaten verschillen per
        activiteit en attributionregels.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Totaal", data.kpis.totalEarnedCents],
          ["Pending", data.kpis.pendingCents],
          ["Beschikbaar", data.kpis.availableCents],
          ["Uitbetaald", data.kpis.paidCents],
        ].map(([l, c]) => (
          <div key={l as string} className="rounded-lg bg-slate-50 p-2">
            <p className="text-[11px] text-slate-500">{l as string}</p>
            <p className="text-sm font-semibold">{eur(c as number)}</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-xs">
        {Object.entries(data.productBreakdownCents ?? {}).map(([p, c]) => (
          <li key={p} className="flex justify-between">
            <span>{p}</span>
            <span>{eur(c)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs">
        <Link href="/affiliate" className="font-medium text-emerald-800 underline-offset-2 hover:underline">
          Hoe werkt affiliate verdienen op HomeCheff?
        </Link>
      </p>
    </section>
  );
}

'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react";

type FeedItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  createdAt: string | Date;
  seller?: { id?: string | null; name?: string | null; username?: string | null; avatar?: string | null } | null;
};

export default function HomePage() {
  const [username, setUsername] = useState<string>("");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [q, setQ] = useState<string>("");
  const [radius, setRadius] = useState<number>(10);
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    // Haal (display)naam op – vervang endpoint indien nodig
    (async () => {
      try {
        const r = await fetch("/api/profile?userId=me", { cache: "no-store" });
        if (r.ok) {
          const { user } = await r.json();
          if (user?.name) setUsername(user.name);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Feed laden
    (async () => {
      try {
        const r = await fetch("/api/products", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { items: FeedItem[] };
        setItems(data?.items ?? []);
      } catch {}
    })();
  }, []);

  // Client-side filter (demo). Category hangt af van jouw data; hier filteren we alleen op titel/omschrijving.
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((it) => {
      if (!term) return true;
      const hay = `${it.title ?? ""} ${it.description ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
    // radius en category zijn placeholders; pas aan als je geo/categorie hebt
    return list;
  }, [items, q, category, radius]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-primary to-secondary py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="leading-tight font-bold text-3xl md:text-5xl text-white drop-shadow-md">
            Wat mag het vandaag worden{username ? `, ${username}` : ""}?
          </h1>
          <p className="mt-2 text-white/90 md:text-lg drop-shadow-sm">
            Huisgemaakt, lokaal en vers—vind gerechten en producten van mensen bij jou in de buurt.
          </p>

          {/* Filterbar */}
          <div className="mt-8 rounded-2xl bg-white/90 text-gray-900 shadow-lg backdrop-blur-lg p-6">
            <div className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto] items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-12 rounded-xl border px-4 outline-none w-full bg-gray-50 text-gray-900"
                placeholder="Zoeken naar gerechten of producten…"
              />
              <div className="flex items-center gap-3 px-2">
                <label className="text-sm whitespace-nowrap">Straal</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-sm w-[3.5ch] text-right">{radius} km</span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 rounded-xl border px-4 bg-gray-50 text-gray-900"
              >
                <option value="all">Alles</option>
                <option value="cheff">HomeCheff</option>
                <option value="garden">HomeGarden</option>
                <option value="designer">HomeDesigner</option>
              </select>
              <button
                className="h-12 px-6 rounded-xl text-white font-semibold border border-white/20 bg-primary shadow"
                onClick={() => {
                  // placeholder voor submit/filter call
                }}
              >
                Zoeken
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold" style={{ color: "#0b1220" }}>
            Aanbevolen in jouw buurt
          </h2>
          <a href="/profile" className="text-sm underline" style={{ color: "#0067B1" }}>
            Naar mijn profiel
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="text-gray-600">Niets gevonden. Probeer een andere zoekterm.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((it) => (
              <article key={it.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                {it.image ? (
                  <img src={it.image} alt={it.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-gray-100" />
                )}
                <div className="p-4">
                  <h3 className="font-medium leading-snug">{it.title}</h3>
                  <div className="mt-1 text-sm text-gray-600 line-clamp-2">{it.description}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-semibold">€{(it.priceCents / 100).toFixed(2)}</div>
                    <div className="flex items-center gap-2">
                      {it.seller?.avatar ? (
                        <img
                          src={it.seller.avatar}
                          alt={it.seller?.name ?? "Verkoper"}
                          className="w-7 h-7 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 border" />
                      )}
                      <div className="text-sm text-gray-700">
                        {it.seller?.name ?? it.seller?.username ?? "Anoniem"}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

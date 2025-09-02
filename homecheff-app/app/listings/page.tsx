'use client';
"use client";
import React, { useState, useEffect } from "react";

type Listing = {
  id: string;
  title: string;
  url: string;
};

type ListingsData = {
  activeListings: Listing[];
  expiredListings: Listing[];
};

export default function ListingsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListingsData>({
    activeListings: [],
    expiredListings: [],
  });

  useEffect(() => {
    // Simuleer API call
    setTimeout(() => {
      setData({
        activeListings: [
          { id: "1", title: "Verse tomaten uit eigen tuin", url: "/products/1" },
          { id: "2", title: "Ambachtelijk brood HomeCheff", url: "/products/2" },
        ],
        expiredListings: [
          { id: "3", title: "Biologische kruidenmix", url: "/products/3" },
        ],
      });
      setLoading(false);
    }, 800);
  }, []);

  const handleShare = (url: string) => {
    if (navigator.share) {
      navigator.share({ url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
    }
  };

  const handleEdit = (id: string) => {
    // Future: route naar edit page
    window.location.href = `/edit-listing/${id}`;
  };

  const handleRemove = (id: string) => {
    // Future: API call om te verwijderen
    setData((prev) => ({
      ...prev,
      activeListings: prev.activeListings.filter((l) => l.id !== id),
    }));
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Mijn advertenties</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Hier vind je een overzicht van je actieve en verlopen advertenties. Gebruik de knoppen om te delen, bewerken of verwijderen. Voor een optimale ervaring: houd je advertenties up-to-date!
        </div>
        {loading && <div>Bezig met laden...</div>}
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Actieve advertenties</h2>
          <ul className="space-y-2">
            {data.activeListings.map((l: any) => (
              <li key={l.id}>
                {l.title}
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--secondary)" }} onClick={() => handleShare(l.url)}>
                  Delen
                </button>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--success)" }} onClick={() => handleEdit(l.id)}>
                  Bewerken
                </button>
                <button className="ml-2 px-2 py-1 rounded text-black" style={{ background: "var(--accent)" }} onClick={() => handleRemove(l.id)}>
                  Verwijderen
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Verlopen advertenties</h2>
          <ul className="space-y-2">
            {data.expiredListings.map((l: any) => (
              <li key={l.id}>{l.title}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
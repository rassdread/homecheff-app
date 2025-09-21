'use client';

import React, { useState } from "react";
import Link from "next/link";

async function fetchFavorites() {
  const res = await fetch("/api/favorites", { cache: "no-store" });
  if (!res.ok) return { purchases: [], favoriteSellers: [], favoriteProducts: [] };
  return res.json();
}

async function removeFavorite(listingId: string) {
  await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

async function addFavorite(listingId: string) {
  await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

function handleShare(url: string) {
  if (navigator.share) {
    navigator.share({ url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Link gekopieerd!");
  }
}

function handleWhatsApp(url: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
}

export default function FavoritesPage() {
  const [data, setData] = useState<any>({ purchases: [], favoriteSellers: [], favoriteProducts: [] });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    fetchFavorites().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleRemove = async (listingId: string) => {
    setLoading(true);
    await removeFavorite(listingId);
    const d = await fetchFavorites();
    setData(d);
    setLoading(false);
  };

  const handleAdd = async (listingId: string) => {
    setLoading(true);
    await addFavorite(listingId);
    const d = await fetchFavorites();
    setData(d);
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Favorieten</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Hier vind je een overzicht van je laatste aankopen, favoriete verkopers en opgeslagen producten. Gebruik de knoppen om te delen of te verwijderen. Voor een optimale ervaring: voeg producten en verkopers toe aan je favorieten!
        </div>
        {loading && <div>Bezig met laden...</div>}
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Laatste 5 aankopen</h2>
          <ul className="space-y-2">
            {data.purchases.map((p: any) => (
              <li key={p.id}>{p.name} ({new Date(p.date).toLocaleDateString()})</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Favoriete verkopers</h2>
          <ul className="space-y-2">
            {data.favoriteSellers.map((s: any) => (
              <li key={s.id}>
                <Link 
                  href={`/seller/${s.id}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {s.name}
                </Link>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--secondary)" }} onClick={() => handleShare(`http://localhost:3000/seller-profile/${s.id}`)}>
                  Delen
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Opgeslagen producten</h2>
          <ul className="space-y-2">
            {data.favoriteProducts.map((product: any) => (
              <li key={product.id}>
                {product.name}
                <button className="ml-2 px-2 py-1 rounded text-black" style={{ background: "var(--accent)" }} onClick={() => handleRemove(product.id)}>
                  Verwijder uit favorieten
                </button>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--secondary)" }} onClick={() => handleShare(product.url)}>
                  Delen
                </button>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--success)" }} onClick={() => handleWhatsApp(product.url)}>
                  WhatsApp
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

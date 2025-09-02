"use client";

import { useEffect, useState } from "react";

type Favorite = {
  id: string;
  createdAt: string;
  listing?: { id: string; title?: string | null; price?: number | null; image?: string | null };
};

export default function FavoritesGrid() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile/favorites");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="rounded-xl border p-4 bg-white animate-pulse h-32" />;
  if (!items.length) return <div className="rounded-xl border p-4 bg-white text-sm text-muted-foreground">Nog geen favorieten.</div>;

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(f => (
        <div key={f.id} className="rounded-xl border bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.listing?.image ?? "/placeholder.webp"} alt="listing" className="w-full h-36 object-cover" />
          <div className="p-3 space-y-1">
            <p className="font-medium truncate">{f.listing?.title ?? "Item"}</p>
            <p className="text-sm text-muted-foreground">€ {((f.listing?.price ?? 0) / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Toegevoegd: {new Date(f.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

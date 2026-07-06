"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import MarketplaceTileMini from "@/components/marketplace/tiles/MarketplaceTileMini";
import {
  mapFavoriteRecordToTileModel,
  type FavoriteApiRecord,
} from "@/lib/marketplace/tiles";

type FavoriteRow = FavoriteApiRecord & { id: string; createdAt: string };

export default function FavoritesGrid() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FavoriteRow[]>([]);
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

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl border bg-white p-4" />;
  }
  if (!items.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
        Nog geen favorieten.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((f) => {
        const model = mapFavoriteRecordToTileModel(f, null);
        if (!model) return null;
        return <MarketplaceTileMini key={f.id} model={model} t={t} />;
      })}
    </div>
  );
}

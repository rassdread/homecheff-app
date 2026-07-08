"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import EmptyState from "@/components/ui/EmptyState";
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
      <EmptyState
        icon={<Heart />}
        title={t("emptyState.favoritesTitle")}
        description={t("emptyState.favoritesDesc")}
        actionLabel={t("emptyState.favoritesAction")}
        actionHref="/"
      />
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

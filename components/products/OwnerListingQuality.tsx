"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ListingQualityCard } from "@/components/products/ListingQualityCard";

type Payload = {
  score: number;
  bandNl: string;
  bandEn: string;
  hints: Array<{ nl: string; en: string }>;
  summaryNl: string;
  summaryEn: string;
};

export function OwnerListingQuality({ productId }: { productId: string }) {
  const { language } = useTranslation();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/products/${productId}/quality`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as Payload;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!data) return null;
  return (
    <div className="mb-4">
      <ListingQualityCard {...data} language={language} />
    </div>
  );
}

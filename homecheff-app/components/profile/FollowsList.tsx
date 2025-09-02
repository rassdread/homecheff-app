"use client";

import { useEffect, useState } from "react";

type Follow = { id: string; seller?: { id: string; name?: string | null; image?: string | null } };

export default function FollowsList() {
  const [items, setItems] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile/follows");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />;

  if (!items.length) {
    return (
      <div className="rounded-xl border p-4 bg-white text-sm text-muted-foreground">
        Nog niemand gevolgd. Zodra de follow-relatie in je database staat, verschijnt het hier.
      </div>
    );
  }

  return (
    <ul className="rounded-xl border bg-white divide-y">
      {items.map(f => (
        <li key={f.id} className="p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.seller?.image ?? "/avatar-placeholder.png"} alt="" className="w-8 h-8 rounded-full object-cover border" />
          <span className="font-medium">{f.seller?.name ?? "Verkoper"}</span>
        </li>
      ))}
    </ul>
  );
}

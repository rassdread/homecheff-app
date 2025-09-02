"use client";

import { useEffect, useState } from "react";

type FeedItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  deliveryMode: "PICKUP" | "DELIVERY" | "BOTH" | null;
  place: string | null;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  createdAt: string;
  distanceKm?: number;
};

export default function GeoFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(null);
  const [radius, setRadius] = useState(25);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        await new Promise<void>((resolve) => {
          if (!navigator.geolocation) return resolve();
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; setCoords({lat, lng}); resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 6000 }
          );
        });
      } catch {}
      const params = new URLSearchParams();
      if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
        params.set("radius", String(radius));
      }
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    })();
  }, [radius, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium">Radius (km)</label>
          <input type="number" min={1} max={100} value={radius} onChange={e => setRadius(Math.max(1, Math.min(100, Number(e.target.value))))} className="mt-1 w-28 rounded-xl border px-3 py-2" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Zoeken</label>
          <input value={q} onChange={e => setQ(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="bv. pasta, soep, bagels" />
        </div>
        {coords ? <p className="text-xs text-muted-foreground ml-auto">Jouw locatie: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}</p> : <p className="text-xs text-muted-foreground ml-auto">Geen locatie: sorteren op nieuwste</p>}
      </div>

      {loading ? (
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      ) : !items.length ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">Geen resultaten in deze radius. Probeer groter of zoekterm leegmaken.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(it => (
            <div key={it.id} className="rounded-xl border bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.photo ?? "/placeholder.webp"} alt="" className="w-full h-36 object-cover" />
              <div className="p-3 space-y-1">
                <p className="font-medium truncate">{it.title ?? "Gerecht"}</p>
                {it.priceCents ? <p className="text-sm">€ {(it.priceCents/100).toFixed(2)}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {it.place ?? "Onbekende locatie"}{(it.distanceKm != null && it.distanceKm !== Infinity) ? ` • ${it.distanceKm.toFixed(1)} km` : ""}
                </p>
                <p className="text-xs">{it.deliveryMode === "PICKUP" ? "Afhalen" : it.deliveryMode === "DELIVERY" ? "Bezorgen" : it.deliveryMode === "BOTH" ? "Afhalen of bezorgen" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

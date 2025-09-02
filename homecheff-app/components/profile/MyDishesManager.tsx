"use client";

import { useEffect, useMemo, useState } from "react";

type Dish = {
  id: string;
  title: string | null;
  description: string | null;
  status: "PRIVATE" | "PUBLISHED";
  createdAt: string;
  priceCents?: number | null;
  deliveryMode?: "PICKUP" | "DELIVERY" | "BOTH" | null;
  place?: string | null;
  photos: { id: string; url: string; idx: number }[];
};

export default function MyDishesManager() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Dish[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(false);
  const [priceEuro, setPriceEuro] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"PICKUP" | "DELIVERY" | "BOTH">("PICKUP");
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const canAdd = useMemo(() => {
    if (title.trim().length === 0 || files.length === 0) return false;
    if (publish) {
      const n = Number(priceEuro.replace(/[^0-9,\.]/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) return false;
    }
    return true;
  }, [title, files, publish, priceEuro]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/profile/dishes");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function ensureCoords(): Promise<{lat:number,lng:number} | null> {
    if (!useMyLocation) return null;
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
      );
    });
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filesArr = Array.from(e.target.files || []).slice(0, 5);
    setFiles(filesArr);
  }

  async function createDish() {
    if (!canAdd) return;
    const got = await ensureCoords();
    if (got) setCoords(got);

    const uploadedUrls: string[] = [];
    for (const f of files) {
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: f.name, type: f.type || "image/jpeg" })
      });
      if (!presign.ok) { alert("Kon upload-URL niet krijgen"); return; }
      const { url, publicUrl } = await presign.json();
      const put = await fetch(url, { method: "PUT", body: f, headers: { "Content-Type": f.type || "image/jpeg" } });
      if (!put.ok) { alert("Uploaden mislukt"); return; }
      uploadedUrls.push(publicUrl);
    }

    const payload: any = {
      title,
      description,
      status: publish ? "PUBLISHED" : "PRIVATE",
      photos: uploadedUrls,
    };
    if (publish) {
      payload.priceEuro = priceEuro;
      payload.deliveryMode = deliveryMode;
    }
    if (useMyLocation && (got || coords)) {
      const c = got || coords;
      payload.lat = c?.lat;
      payload.lng = c?.lng;
      payload.place = place || null;
    } else if (place) {
      payload.place = place;
    }

    const res = await fetch("/api/profile/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setTitle(""); setDescription(""); setPublish(false);
      setPriceEuro(""); setDeliveryMode("PICKUP"); setFiles([]);
      await load();
    } else {
      const j = await res.json().catch(() => ({} as any));
      alert(j?.error ?? "Opslaan mislukt");
    }
  }

  async function togglePublish(id: string, next: boolean) {
    const res = await fetch(`/api/profile/dishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next ? "PUBLISHED" : "PRIVATE" })
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="bv. Surinaamse Roti" />
          </div>
          <div>
            <label className="block text-sm font-medium">Foto's (max 5)</label>
            <input type="file" accept="image/*" multiple onChange={onFilesChange} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Beschrijving</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} placeholder="Korte omschrijving..." />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Publiceren</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)} />
              Publiceer direct (anders privé)
            </label>

            <div className={`grid grid-cols-2 gap-2 transition ${publish ? "opacity-100" : "opacity-60 pointer-events-none"}`}>
              <div>
                <label className="block text-sm font-medium">Prijs (€)</label>
                <input value={priceEuro} onChange={e => setPriceEuro(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="bijv. 9,99" />
              </div>
              <div>
                <label className="block text-sm font-medium">Afhalen/Bezorgen</label>
                <select value={deliveryMode} onChange={e => setDeliveryMode(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2">
                  <option value="PICKUP">Alleen afhalen</option>
                  <option value="DELIVERY">Alleen bezorgen</option>
                  <option value="BOTH">Beide opties</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Locatie</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useMyLocation} onChange={e => setUseMyLocation(e.target.checked)} />
              Gebruik mijn huidige locatie
            </label>
            <input value={place} onChange={e => setPlace(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder="Plaatsnaam (optioneel)" />
            <p className="text-xs text-muted-foreground">Locatie helpt om je gerecht in de feed op afstand te sorteren.</p>
          </div>
          <div className="flex items-end justify-end">
            <button onClick={createDish} disabled={!canAdd} className="rounded-xl px-4 py-2 border shadow-sm hover:shadow transition">
              Opslaan
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      ) : !items.length ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">Nog geen gerechten opgeslagen.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(d => (
            <div key={d.id} className="rounded-xl border bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.photos?.[0]?.url ?? "/placeholder.webp"} alt="" className="w-full h-36 object-cover" />
              <div className="p-3 space-y-1">
                <p className="font-medium truncate">{d.title ?? "Gerecht"}</p>
                {d.priceCents ? <p className="text-sm">€ {(d.priceCents/100).toFixed(2)}</p> : null}
                {d.place ? <p className="text-xs text-muted-foreground">{d.place}</p> : null}
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${d.status === "PUBLISHED" ? "bg-green-50" : "bg-gray-50"}`}>
                    {d.status === "PUBLISHED" ? "Gepubliceerd" : "Privé"}
                  </span>
                  <button onClick={() => togglePublish(d.id, d.status !== "PUBLISHED")} className="text-xs underline">
                    {d.status === "PUBLISHED" ? "Maak privé" : "Publiceer"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

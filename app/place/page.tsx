"use client";
import { useState } from "react";
import { uploadImage } from "@/lib/upload";

export default function PlaceListing() {
  const [state, set] = useState({ title: "", description: "", price: "", place: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let imageUrl = "";
      if (file) imageUrl = (await uploadImage(file)).url;
      const priceCents = Math.round(Number(state.price) * 100);
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          priceCents,
          imageUrl,
          place: state.place,
        }),
      });
      if (!res.ok) throw new Error("Failed to create listing");
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3 p-4">
      <input className="w-full border p-2 rounded" placeholder="Titel"
        value={state.title} onChange={(e)=>set(s=>({...s,title:e.target.value}))}/>
      <textarea className="w-full border p-2 rounded" placeholder="Korte beschrijving"
        value={state.description} onChange={(e)=>set(s=>({...s,description:e.target.value}))}/>
      <input className="w-full border p-2 rounded" type="number" step="0.01" placeholder="Prijs (€)"
        value={state.price} onChange={(e)=>set(s=>({...s,price:e.target.value}))}/>
      <input className="w-full border p-2 rounded" placeholder="Plaats (optioneel)"
        value={state.place} onChange={(e)=>set(s=>({...s,place:e.target.value}))}/>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)}/>
      <button disabled={busy} className="px-4 py-2 rounded bg-black text-white">
        {busy ? "Bezig..." : "Plaatsen"}
      </button>
    </form>
  );
}

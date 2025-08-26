"use client";

import { useState } from "react";

const CATEGORIES = ["CHEFF","GROWN","DESIGNER"] as const;
const UNITS = ["PORTION","STUK","HUNDRED_G","KG","BOSJE","SET","METER","CM","M2"] as const;
const DELIVERY = ["PICKUP","DELIVERY","BOTH"] as const;

export default function NewProductPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CHEFF");
  const [unit, setUnit] = useState("PORTION");
  const [delivery, setDelivery] = useState("PICKUP");
  const [price, setPrice] = useState("9.95");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, description, price, unit, delivery }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data?.error || "Fout");
    else setMsg("Product geplaatst! Ga terug naar de feed.");
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] py-10 px-6">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 border border-gray-200">
        <h1 className="text-xl font-semibold mb-4">Nieuw product</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-700">Categorie</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2" value={category} onChange={e=>setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <input className="w-full border rounded-lg px-3 py-2" placeholder="Titel"
                 value={title} onChange={e=>setTitle(e.target.value)} />

          <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Beschrijving (optioneel)"
                    rows={3} value={description} onChange={e=>setDescription(e.target.value)} />

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1">
              <span className="text-sm text-gray-700">Prijs (€)</span>
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={price}
                     onChange={e=>setPrice(e.target.value)} />
            </label>

            <label className="col-span-1">
              <span className="text-sm text-gray-700">Eenheid</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2" value={unit} onChange={e=>setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>

            <label className="col-span-1">
              <span className="text-sm text-gray-700">Aanbieden</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2" value={delivery} onChange={e=>setDelivery(e.target.value)}>
                {DELIVERY.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>

          <button className="w-full rounded-lg bg-[#006D52] text-white py-2 font-medium">
            Plaatsen
          </button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </main>
  );
}

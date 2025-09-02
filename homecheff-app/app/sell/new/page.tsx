"use client";
import React, { useState } from "react";

type HomeCheffProductState = {
  name: string;
  description: string;
  price: string;
  error: string | null;
  success: boolean;
};

export default function HomeCheffProductNieuwPage() {
  const [state, setState] = useState<HomeCheffProductState>({
    name: "",
    description: "",
    price: "",
    error: null,
    success: false,
  });

  const handleSave = () => {
    if (!state.name || !state.description || !state.price) {
      setState({ ...state, error: "Vul alle velden in.", success: false });
      return;
    }
    setState({ ...state, error: null, success: true });
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Nieuw HomeCheff product</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Vul de gegevens van je nieuwe HomeCheff product in. Zorg voor een duidelijke omschrijving en prijs.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <input type="text" value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="Productnaam" className="mb-4 px-3 py-2 border rounded w-full" />
          <textarea value={state.description} onChange={e => setState({ ...state, description: e.target.value })} placeholder="Omschrijving" className="mb-4 px-3 py-2 border rounded w-full" />
          <input type="text" value={state.price} onChange={e => setState({ ...state, price: e.target.value })} placeholder="Prijs (€)" className="mb-4 px-3 py-2 border rounded w-full" />
          <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleSave}>
            Opslaan
          </button>
          {state.error && <div className="mt-2 text-red-600">{state.error}</div>}
          {state.success && <div className="mt-2 text-green-600">Product succesvol toegevoegd!</div>}
        </div>
      </section>
    </main>
  );
}

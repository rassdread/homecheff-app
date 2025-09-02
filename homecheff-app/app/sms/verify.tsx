"use client";
import React, { useState } from "react";

type SmsVerifyState = {
  code: string;
  verified: boolean;
  error: string | null;
};

export default function SmsVerifyPage() {
  const [state, setState] = useState<SmsVerifyState>({ code: "", verified: false, error: null });

  const handleVerify = () => {
    if (state.code === "123456") {
      setState({ ...state, verified: true, error: null });
    } else {
      setState({ ...state, verified: false, error: "Ongeldige code. Probeer opnieuw." });
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>SMS verificatie</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Vul de ontvangen code in om je telefoonnummer te verifiëren. Gebruik testcode 123456 voor demo.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <input type="text" value={state.code} onChange={e => setState({ ...state, code: e.target.value })} placeholder="Verificatiecode" className="mb-4 px-3 py-2 border rounded w-full" />
          <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleVerify}>
            Verifiëren
          </button>
          {state.error && <div className="mt-2 text-red-600">{state.error}</div>}
          {state.verified && <div className="mt-2 text-green-600">Nummer succesvol geverifieerd!</div>}
        </div>
      </section>
    </main>
  );
}

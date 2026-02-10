"use client";
import React, { useState } from "react";

type SmsState = {
  sent: boolean;
  verified: boolean;
  error: string | null;
};

export default function SmsSendPage() {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<SmsState>({ sent: false, verified: false, error: null });

  const handleSend = () => {
    if (!phone.match(/^\+31[0-9]{9}$/)) {
      setState({ sent: false, verified: false, error: "Voer een geldig NL-nummer in (bijv. +31612345678)" });
      return;
    }
    setState({ sent: true, verified: false, error: null });
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>SMS versturen</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Vul je telefoonnummer in om een verificatiecode te ontvangen. Alleen Nederlandse nummers worden geaccepteerd.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+31612345678" className="mb-4 px-3 py-2 border rounded w-full" />
          <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleSend}>
            Verstuur SMS
          </button>
          {state.error && <div className="mt-2 text-red-600">{state.error}</div>}
          {state.sent && <div className="mt-2 text-green-600">SMS is verstuurd!</div>}
        </div>
      </section>
    </main>
  );
}

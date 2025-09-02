"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const subscriptionOptions = [
  { label: "Basic – €39 p/m (7% fee)", value: "basic" },
  { label: "Pro – €99 p/m (4% fee)", value: "pro" },
  { label: "Premium – €199 p/m (2% fee)", value: "premium" },
];

type RegisterState = {
  name: string;
  email: string;
  password: string;
  isBusiness: boolean;
  kvk: string;
  btw: string;
  company: string;
  subscription: string;
  error: string | null;
  success: boolean;
  showSubscriptions: boolean;
};

function RegisterPage() {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>({
    name: "",
    email: "",
    password: "",
    isBusiness: false,
    kvk: "",
    btw: "",
    company: "",
    subscription: "",
    error: null,
    success: false,
    showSubscriptions: false,
  });

  function handleBusinessToggle() {
    setState((prev) => ({
      ...prev,
      isBusiness: !prev.isBusiness,
      showSubscriptions: !prev.isBusiness,
      kvk: "",
      btw: "",
      company: "",
      subscription: "",
    }));
  }

  function handleRegister() {
    if (!state.name || !state.email || !state.password) {
      setState({ ...state, error: "Vul alle velden in.", success: false });
      return;
    }
    if (!state.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setState({ ...state, error: "Voer een geldig e-mailadres in.", success: false });
      return;
    }
    // ...add registration logic here...
    setState({ ...state, error: null, success: true });
  }
  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Registreren</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Maak een account aan om te kunnen kopen, verkopen en berichten te sturen. Vul je gegevens hieronder in.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <input type="text" value={state.name} onChange={e => setState({ ...state, name: e.target.value })} placeholder="Naam" className="mb-4 px-3 py-2 border rounded w-full" />
          <input type="email" value={state.email} onChange={e => setState({ ...state, email: e.target.value })} placeholder="E-mail" className="mb-4 px-3 py-2 border rounded w-full" />
          <input type="password" value={state.password} onChange={e => setState({ ...state, password: e.target.value })} placeholder="Wachtwoord" className="mb-4 px-3 py-2 border rounded w-full" />
          <label className="flex items-center gap-2 mb-4">
            <input type="checkbox" checked={state.isBusiness} onChange={handleBusinessToggle} />
            <span>Ik schrijf me in als zakelijke verkoper (KVK)</span>
          </label>
          {state.isBusiness && (
            <div className="mb-4 p-4 bg-gray-50 rounded border" style={{ borderColor: "var(--secondary)" }}>
              <input type="text" value={state.kvk} onChange={e => setState({ ...state, kvk: e.target.value })} placeholder="KVK nummer" className="mb-2 px-3 py-2 border rounded w-full" />
              <input type="text" value={state.btw} onChange={e => setState({ ...state, btw: e.target.value })} placeholder="BTW nummer" className="mb-2 px-3 py-2 border rounded w-full" />
              <input type="text" value={state.company} onChange={e => setState({ ...state, company: e.target.value })} placeholder="Bedrijfsnaam" className="mb-2 px-3 py-2 border rounded w-full" />
              <div className="mt-4">
                <button type="button" className="w-full px-4 py-2 rounded text-white font-semibold mb-2" style={{ background: "var(--accent)" }} onClick={() => setState(s => ({ ...s, showSubscriptions: !s.showSubscriptions }))}>
                  {state.showSubscriptions ? "Abonnementsopties verbergen" : "Abonnementsopties tonen"}
                </button>
                {state.showSubscriptions && (
                  <div className="mt-2 p-2 bg-white border rounded" style={{ borderColor: "var(--accent)" }}>
                    <div className="font-semibold mb-2" style={{ color: "var(--primary)" }}>Kies een abonnementsvorm:</div>
                    {subscriptionOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 mb-2">
                        <input type="radio" name="subscription" value={opt.value} checked={state.subscription === opt.value} onChange={e => setState({ ...state, subscription: e.target.value })} />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <button className="px-4 py-2 rounded text-white w-full" style={{ background: "var(--primary)" }} onClick={handleRegister}>
            Registreren
          </button>
          {state.error && <div className="mt-2 text-red-600">{state.error}</div>}
          {state.success && <div className="mt-2 text-green-600">Account succesvol aangemaakt!</div>}
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;

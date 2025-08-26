"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Fout");
    else setMsg("Account aangemaakt! Ga naar /login om in te loggen.");
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] py-12 px-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <h1 className="text-xl font-semibold mb-4">Account aanmaken</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Wachtwoord" type="password"
                 value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full rounded-lg bg-[#006D52] text-white py-2 font-medium">
            Registreren
          </button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </main>
  );
}

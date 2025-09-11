'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    gender: "",
    email: "",
    password: "",
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{error?: string; success?: string}>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registratie mislukt");
      setMsg({ success: "Account aangemaakt." });
      router.push("/login");
    } catch (err: any) {
      setMsg({ error: err.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-md mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6" style={{color: "var(--primary)"}}>Registreren</h1>
        <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border bg-white p-6">
          <input
            type="text"
            placeholder="Naam"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            className="border rounded p-2 w-full"
            required
          />
          <div>
            <label className="block mb-1 font-medium">Geslacht</label>
            <select
              value={form.gender}
              onChange={e => setForm({...form, gender: e.target.value})}
              className="border rounded p-2 w-full"
            >
              <option value="">Maak een keuze</option>
              <option value="man">Man</option>
              <option value="vrouw">Vrouw</option>
            </select>
          </div>
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="border rounded p-2 w-full"
            required
          />
          <button
            className="px-4 py-2 rounded text-white"
            style={{background: "var(--primary)"}}
            disabled={pending}
            type="submit"
          >
            {pending ? "Bezig..." : "Registreren"}
          </button>
          {msg.error && <div className="text-red-600">{msg.error}</div>}
          {msg.success && <div className="text-green-600">{msg.success}</div>}
        </form>
      </div>
    </main>
  );
}

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isCompany, setIsCompany] = useState(false);
  const [company, setCompany] = useState({
    name: "",
    kvkNumber: "",
    vatNumber: "",
    address: "",
    city: "",
    country: "NL",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isCompany, company: isCompany ? company : undefined }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      router.push(data.next || (isCompany ? "/sell" : "/"));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registratie mislukt");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow w-full max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Registreren</h1>

        <input
          type="text"
          placeholder="Naam"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2 w-full"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="border rounded p-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="Wachtwoord"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="border rounded p-2 w-full"
          required
        />

        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
          />
          <span>Ik ben een bedrijf</span>
        </label>

        {isCompany && (
          <div className="mt-3 space-y-2 border rounded-xl p-3 bg-gray-50">
            <input
              type="text"
              placeholder="Bedrijfsnaam"
              value={company.name}
              onChange={e => setCompany({ ...company, name: e.target.value })}
              className="border rounded p-2 w-full"
              required
            />
            <input
              type="text"
              placeholder="KvK-nummer (optioneel)"
              value={company.kvkNumber}
              onChange={e => setCompany({ ...company, kvkNumber: e.target.value })}
              className="border rounded p-2 w-full"
            />
            <input
              type="text"
              placeholder="BTW-nummer (EU VAT, optioneel)"
              value={company.vatNumber}
              onChange={e => setCompany({ ...company, vatNumber: e.target.value })}
              className="border rounded p-2 w-full"
            />
            <input
              type="text"
              placeholder="Adres"
              value={company.address}
              onChange={e => setCompany({ ...company, address: e.target.value })}
              className="border rounded p-2 w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Plaats"
                value={company.city}
                onChange={e => setCompany({ ...company, city: e.target.value })}
                className="border rounded p-2 w-full"
              />
              <input
                type="text"
                placeholder="Land"
                value={company.country}
                onChange={e => setCompany({ ...company, country: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>
            <p className="text-xs text-gray-600">We doen een automatische bedrijf-check (KvK/VIES) na het aanmelden.</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Bezig..." : (isCompany ? "Aanmelden als bedrijf" : "Account aanmaken")}
        </Button>

        <p className="text-sm text-gray-600">
          Al een account? <Link className="underline" href="/auth/login">Inloggen</Link>
        </p>
      </form>
    </div>
  );
}

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/",
    });
  }

  return (
    <main className="min-h-screen bg-[#F6F8FA] py-12 px-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <h1 className="text-xl font-semibold mb-4">Inloggen</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full rounded-lg bg-[#0067B1] text-white py-2 font-medium">
            Inloggen
          </button>
        </form>
      </div>
    </main>
  );
}

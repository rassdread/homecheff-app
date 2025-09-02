"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type LoginState = {
  email: string;
  password: string;
  error: string | null;
  success: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    error: null,
    success: false,
  });

  const handleLogin = () => {
    if (!state.email || !state.password) {
      setState({ ...state, error: "Vul alle velden in.", success: false });
      return;
    }
    if (!state.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setState({
        ...state,
        error: "Voer een geldig e-mailadres in.",
        success: false,
      });
      return;
    }
    signIn("credentials", {
      redirect: false,
      email: state.email,
      password: state.password,
    }).then((result) => {
      if (result?.error) {
        setState({ ...state, error: "Login mislukt.", success: false });
        return;
      }
      setState({ ...state, error: null, success: true });
      router.push("/");
    });
  };

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <header
        className="w-full border-b"
        style={{ borderColor: "#e5e7eb", background: "#fff" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--primary)" }}
          >
            Inloggen
          </span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div
          className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded"
          style={{ borderColor: "var(--accent)" }}
        >
          Log in om toegang te krijgen tot je account, favorieten en berichten.
          Vul je gegevens hieronder in.
        </div>
        <div
          className="rounded-xl bg-white p-6 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <input
            type="email"
            value={state.email}
            onChange={(e) =>
              setState({ ...state, email: e.target.value })
            }
            placeholder="E-mail"
            className="mb-4 px-3 py-2 border rounded w-full"
          />
          <input
            type="password"
            value={state.password}
            onChange={(e) =>
              setState({ ...state, password: e.target.value })
            }
            placeholder="Wachtwoord"
            className="mb-4 px-3 py-2 border rounded w-full"
          />
          <button
            className="px-4 py-2 rounded text-white"
            style={{ background: "var(--primary)" }}
            onClick={handleLogin}
          >
            Inloggen
          </button>
          {state.error && (
            <div className="mt-2 text-red-600">{state.error}</div>
          )}
          {state.success && (
            <div className="mt-2 text-green-600">Succesvol ingelogd!</div>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";
import React, { useState } from "react";

type VerificationData = {
  status: "pending" | "approved" | "rejected";
  message: string;
};

export default function StripeIdentityPage() {
  const [data, setData] = useState<VerificationData>({
    status: "pending",
    message: "Je verificatie is in behandeling. Je ontvangt een update zodra deze is beoordeeld door ons team.",
  });

  const handleRetry = () => {
    setData({
      status: "pending",
      message: "Je hebt opnieuw een verificatie aangevraagd. Wacht op beoordeling."
    });
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Identiteitsverificatie</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Verifieer je identiteit via Stripe. Dit is nodig om te kunnen verkopen en betalingen te ontvangen. Je status en instructies vind je hieronder.
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Status</h2>
          <div className="mb-2">
            <span className={`px-3 py-1 rounded text-white ${data.status === "approved" ? "bg-success" : data.status === "rejected" ? "bg-error" : "bg-info"}`}>{data.status}</span>
          </div>
          <div className="mb-4 text-gray-700">{data.message}</div>
          {data.status === "rejected" ? (
            <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleRetry}>
              Opnieuw proberen
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

"use client";
import React, { useState, useEffect } from "react";

type Reservation = {
  id: string;
  title: string;
  url: string;
};

type ReservationsData = {
  upcomingReservations: Reservation[];
  completedReservations: Reservation[];
};

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReservationsData>({
    upcomingReservations: [],
    completedReservations: [],
  });

  useEffect(() => {
    setTimeout(() => {
      setData({
        upcomingReservations: [
          { id: "1", title: "Reservering HomeCheff diner", url: "/reservations/1" },
          { id: "2", title: "Tuinadvies afspraak", url: "/reservations/2" },
        ],
        completedReservations: [
          { id: "3", title: "Designer consult afgerond", url: "/reservations/3" },
        ],
      });
      setLoading(false);
    }, 800);
  }, []);

  const handleConfirm = (id: string) => {
    // Future: API call om te bevestigen
    setData((prev) => ({
      ...prev,
      upcomingReservations: prev.upcomingReservations.filter((r) => r.id !== id),
      completedReservations: [
        ...prev.completedReservations,
        ...prev.upcomingReservations.filter((r) => r.id === id),
      ],
    }));
  };

  const handleCancel = (id: string) => {
    // Future: API call om te annuleren
    setData((prev) => ({
      ...prev,
      upcomingReservations: prev.upcomingReservations.filter((r) => r.id !== id),
    }));
  };

  const handleShare = (url: string) => {
    if (navigator.share) {
      navigator.share({ url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Reserveringen</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Hier vind je een overzicht van je aankomende en afgeronde reserveringen. Gebruik de knoppen om te delen, annuleren of bevestigen. Voor een optimale ervaring: bevestig je reserveringen tijdig!
        </div>
        {loading && <div>Bezig met laden...</div>}
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Aankomende reserveringen</h2>
          <ul className="space-y-2">
            {data.upcomingReservations.map((r: any) => (
              <li key={r.id}>
                {r.title}
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--success)" }} onClick={() => handleConfirm(r.id)}>
                  Bevestigen
                </button>
                <button className="ml-2 px-2 py-1 rounded text-black" style={{ background: "var(--accent)" }} onClick={() => handleCancel(r.id)}>
                  Annuleren
                </button>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--secondary)" }} onClick={() => handleShare(r.url)}>
                  Delen
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Afgeronde reserveringen</h2>
          <ul className="space-y-2">
            {data.completedReservations.map((r: any) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

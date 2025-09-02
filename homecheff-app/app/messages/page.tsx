"use client";
import React, { useState, useEffect } from "react";

type Conversation = {
  id: string;
  title: string;
  url: string;
};

type MessagesData = {
  activeConversations: Conversation[];
  archivedConversations: Conversation[];
};

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MessagesData>({
    activeConversations: [],
    archivedConversations: [],
  });

  useEffect(() => {
    setTimeout(() => {
      setData({
        activeConversations: [
          { id: "1", title: "Vraag over HomeCheff brood", url: "/messages/1" },
          { id: "2", title: "Interesse in tuinproducten", url: "/messages/2" },
        ],
        archivedConversations: [
          { id: "3", title: "Afgeronde bestelling designer", url: "/messages/3" },
        ],
      });
      setLoading(false);
    }, 800);
  }, []);

  const handleReply = (id: string) => {
    window.location.href = `/messages/${id}`;
  };

  const handleShare = (url: string) => {
    if (navigator.share) {
      navigator.share({ url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
    }
  };

  const handleArchive = (id: string) => {
    setData((prev) => ({
      ...prev,
      activeConversations: prev.activeConversations.filter((c) => c.id !== id),
      archivedConversations: [
        ...prev.archivedConversations,
        ...prev.activeConversations.filter((c) => c.id === id),
      ],
    }));
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Berichten</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Hier vind je je gesprekken met kopers en verkopers. Gebruik de knoppen om te reageren, delen of archiveren. Voor een optimale ervaring: houd je berichten overzichtelijk!
        </div>
        {loading && <div>Bezig met laden...</div>}
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Actieve gesprekken</h2>
          <ul className="space-y-2">
            {data.activeConversations.map((c: any) => (
              <li key={c.id}>
                {c.title}
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--secondary)" }} onClick={() => handleReply(c.id)}>
                  Reageren
                </button>
                <button className="ml-2 px-2 py-1 rounded text-white" style={{ background: "var(--success)" }} onClick={() => handleShare(c.url)}>
                  Delen
                </button>
                <button className="ml-2 px-2 py-1 rounded text-black" style={{ background: "var(--accent)" }} onClick={() => handleArchive(c.id)}>
                  Archiveren
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-lg mb-2" style={{ color: "var(--primary)" }}>Gearchiveerde gesprekken</h2>
          <ul className="space-y-2">
            {data.archivedConversations.map((c: any) => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

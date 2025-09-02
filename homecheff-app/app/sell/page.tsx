
'use client';
import React from "react";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type Plan = 'BASIC' | 'PRO' | 'PREMIUM';

export default function SellPage() {
  const [loading, setLoading] = useState<Plan | null>(null);
  const plans: { key: Plan; title: string; price: string; fee: string; perks: string[] }[] = [
    { key: 'BASIC', title: 'Basic', price: '€39 / maand', fee: '7% fee', perks: ['Start voor kleine speciaalzaken', 'Basis zichtbaarheid'] },
    { key: 'PRO', title: 'Pro', price: '€99 / maand', fee: '4% fee', perks: ['Verhoogde zichtbaarheid', 'Aanbevolen in categorie'] },
    { key: 'PREMIUM', title: 'Premium', price: '€199 / maand', fee: '2% fee', perks: ['Toppositie', 'Uitgelichte promoties'] },
  ];
  const router = useRouter();

  async function start(plan: Plan) {
    setLoading(plan);
    try {
      const userId = 'anon'; // TODO: vervang door userId uit sessie
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }
  return (
    <React.Suspense fallback={null}>
      <SellPageContent
        plans={plans}
        loading={loading}
        setLoading={setLoading}
        router={router}
        start={start}
      />
    </React.Suspense>
  );
}

// Verwijderd: dubbele declaratie SellPageContent
function SellPageContent({ plans, loading, setLoading, router, start }: {
  plans: { key: Plan; title: string; price: string; fee: string; perks: string[] }[];
  loading: Plan | null;
  setLoading: (plan: Plan | null) => void;
  router: any;
  start: (plan: Plan) => void;
}) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get('success') === '1') {
      router.replace('/');
    }
  }, [params, router]);
  return (
    <main className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Verkoop je gerechten of producten</h1>
      <p className="text-center text-gray-600 mb-10">Kies je pakket. Abonnement + lage fee. Je kunt maandelijks opzeggen.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.key} className="rounded-2xl border shadow-sm p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
            <p className="text-2xl font-bold mb-1">{p.price}</p>
            <p className="text-sm text-gray-600 mb-4">{p.fee}</p>
            <ul className="text-sm text-gray-700 space-y-1 mb-6">
              {p.perks.map((x) => <li key={x}>• {x}</li>)}
            </ul>
            <Button onClick={() => start(p.key)} disabled={loading === p.key} className="mt-auto">
              {loading === p.key ? 'Bezig...' : 'Start ' + p.title}
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}

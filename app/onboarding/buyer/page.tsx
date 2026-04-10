'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function BuyerOnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">Stap 1 van 3</p>
        <h1 className="text-2xl font-bold mb-2">Wat wil je doen?</h1>
        <p className="text-gray-600 mb-6">Kies je startpunt. Je kunt later altijd wisselen.</p>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => router.push('/onboarding/seller')}
            className="text-left p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">Geld verdienen</p>
            <p className="text-sm text-gray-600">Start met verkopen in jouw buurt.</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dorpsplein')}
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <p className="font-semibold text-gray-900">Iets ontdekken</p>
            <p className="text-sm text-gray-600">Bekijk direct aanbod van makers uit jouw buurt.</p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push('/')}>Nu overslaan</Button>
        </div>
      </section>
    </main>
  );
}

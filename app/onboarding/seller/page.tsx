'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SellerOnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">Stap 2 van 3</p>
        <h1 className="text-2xl font-bold mb-2">Wat wil je aanbieden?</h1>
        <p className="text-gray-600 mb-6">Kies wat je als eerste wilt verkopen.</p>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=CHEFF')}
            className="text-left p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">Eten</p>
            <p className="text-sm text-gray-600">Kook je? Start met je eerste gerecht.</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=GARDEN')}
            className="text-left p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">Producten</p>
            <p className="text-sm text-gray-600">Verkoop lokale producten uit jouw buurt.</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=DESIGNER')}
            className="text-left p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">Creatief</p>
            <p className="text-sm text-gray-600">Toon je design en vind direct klanten.</p>
          </button>
        </div>

        <div className="mt-6 flex justify-between">
          <Button onClick={() => router.push('/onboarding/buyer')} variant="outline">Vorige stap</Button>
          <Button onClick={() => router.push('/sell/new')}>Stap 3: Start met verkopen</Button>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Investor overview – HomeCheff',
  description: 'HomeCheff investor pitch deck and company overview for interested investors.',
  robots: 'noindex, nofollow',
};

const PITCH_PDF_PATH = '/HomeCheff_Investor_PitchDeck_website.pdf';

export default function PitchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
          Terug naar home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Investor overview – HomeCheff
            </h1>
          </div>
          <a
            href={PITCH_PDF_PATH}
            download="Investor pitch HomeCheff.pdf"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          >
            <FileDown className="w-4 h-4" aria-hidden />
            Download PDF
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <iframe
            src={`${PITCH_PDF_PATH}#view=FitH`}
            title="HomeCheff Investor Pitch Deck"
            className="w-full min-h-[70vh] sm:min-h-[80vh] border-0"
          />
        </div>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Werkt de viewer niet in je browser? Gebruik de knop &quot;Download PDF&quot; om het document te openen of op te slaan.
        </p>
      </div>
    </main>
  );
}

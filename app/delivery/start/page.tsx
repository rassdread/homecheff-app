'use client';

import Link from 'next/link';
import { Bike, Building2, UserRound } from 'lucide-react';

/**
 * Delivery onboarding chooser — individual / company / driver-for-company.
 */
export default function DeliveryStartPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/80 to-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Bezorgen via HomeCheff
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Hoe wil je bezorgen?
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Kies wat bij jou past. Je kunt later altijd je instellingen aanpassen.
            HomeCheff is geen werkgever — jij of jouw bedrijf levert als zelfstandige
            bezorgpartner.
          </p>
        </header>

        <div className="grid gap-4">
          <Link
            href="/delivery/signup"
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Bike className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-900">Ik bezorg zelf</span>
              <span className="mt-1 block text-sm text-gray-600">
                Persoonlijk bezorgprofiel: beschikbaarheid, werkgebied, tarieven en
                opdrachten.
              </span>
            </span>
          </Link>

          <Link
            href="/delivery/company/signup"
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Building2 className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-900">
                Ik heb een bezorgbedrijf
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                Bedrijfsprofiel met chauffeurs, planning, bedrijfs-tarief en verdiensten.
              </span>
            </span>
          </Link>

          <Link
            href="/delivery/invite"
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <UserRound className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-900">
                Ik werk voor een bezorgbedrijf
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                Heb je een uitnodiging ontvangen? Accepteer die om als chauffeur te starten.
              </span>
            </span>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500">
          Al bezorgpartner?{' '}
          <Link href="/delivery/dashboard" className="font-medium text-emerald-700 underline">
            Ga naar je bezorgdashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

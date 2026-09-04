'use client';

import Link from 'next/link';

/** Landing when invite token is missing — point users to email link. */
export default function DeliveryInviteIndexPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-12 text-center">
      <h1 className="text-xl font-bold">Ik werk voor een bezorgbedrijf</h1>
      <p className="text-sm text-gray-600">
        Open de uitnodigingslink uit je e-mail, of vraag de eigenaar van het bezorgbedrijf om
        je opnieuw uit te nodigen.
      </p>
      <Link href="/delivery/start" className="text-emerald-700 underline">
        Terug naar start
      </Link>
    </div>
  );
}

import { Suspense } from 'react';
import AffiliateCompanyPageClient from './page-client';

export default function AffiliateCompanyPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-600">Laden…</main>
      }
    >
      <AffiliateCompanyPageClient />
    </Suspense>
  );
}

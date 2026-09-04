import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import BetaDownloadPageClient from '@/components/beta/BetaDownloadPageClient';
import { getGooglePlayOpenTestingUrl } from '@/lib/app-distribution';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HomeCheff-app — Google Play',
  description:
    'Installeer HomeCheff via Google Play. Ontdek nieuwe functies, verdien HCP en support lokale makers in jouw buurt.',
};

export default async function BetaAppDownloadPage({
  searchParams,
}: {
  searchParams: { code?: string; ref?: string };
}) {
  const jar = await cookies();
  const refFromCookie = jar.get('hc_ref')?.value?.trim() || null;
  const playStoreUrl = getGooglePlayOpenTestingUrl() || null;
  const versionLabel = process.env.NEXT_PUBLIC_ANDROID_BETA_VERSION?.trim() || null;
  const codeParam = searchParams.code?.trim() || searchParams.ref?.trim() || null;

  return (
    <BetaDownloadPageClient
      playStoreUrl={playStoreUrl}
      versionLabel={versionLabel}
      initialRefLabel={refFromCookie}
      initialCodeParam={codeParam}
    />
  );
}

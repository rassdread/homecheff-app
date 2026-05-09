import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import BetaDownloadPageClient from '@/components/beta/BetaDownloadPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Download de HomeCheff Beta-app',
  description:
    'Download de Android beta-app van HomeCheff. Alleen via homecheff.eu — testversie met HCP en makers bij jou in de buurt.',
};

export default async function BetaAppDownloadPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const jar = await cookies();
  const refFromCookie = jar.get('hc_ref')?.value?.trim() || null;
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_BETA_APK_URL?.trim() || null;
  const versionLabel = process.env.NEXT_PUBLIC_ANDROID_BETA_VERSION?.trim() || null;
  const codeParam = searchParams.code?.trim() || null;

  return (
    <BetaDownloadPageClient
      apkUrl={apkUrl}
      versionLabel={versionLabel}
      initialRefLabel={refFromCookie}
      initialCodeParam={codeParam}
    />
  );
}

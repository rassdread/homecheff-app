import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import VerdienCheckErrorBoundary from '@/components/verdiencheck/VerdienCheckErrorBoundary';
import VerdienCheckWizard from '@/components/verdiencheck/VerdienCheckWizard';
import { isVerdienCheckPublicRouteVisible } from '@/lib/verdiencheck/flags';
import { verdiencheckPageMetadata } from '@/lib/verdiencheck/public-seo';
import { getVerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import { referrerPathFromUrl, resolveVerdienCheckReturnPath } from '@/lib/verdiencheck/return-path';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return verdiencheckPageMetadata();
}

function oneParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function requestOrigin(headerList: Headers): string {
  const host = (headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'homecheff.eu')
    .split(',')[0]
    ?.trim();
  const proto = (headerList.get('x-forwarded-proto') ?? 'https').split(',')[0]?.trim() || 'https';
  return `${proto}://${host || 'homecheff.eu'}`;
}

export default async function VerdienCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; returnTo?: string | string[] }> | {
    from?: string | string[];
    returnTo?: string | string[];
  };
}) {
  if (!isVerdienCheckPublicRouteVisible()) {
    notFound();
  }
  const language = await getCurrentLanguage();
  const query = await searchParams;
  const headerList = await headers();
  const initialReturnPath = resolveVerdienCheckReturnPath({
    returnTo: oneParam(query.returnTo),
    from: oneParam(query.from),
    referrerPath: referrerPathFromUrl(headerList.get('referer'), requestOrigin(headerList)),
  });
  return (
    <VerdienCheckErrorBoundary>
      <VerdienCheckWizard
        copy={getVerdienCheckCopy(language)}
        language={language}
        initialReturnPath={initialReturnPath}
      />
    </VerdienCheckErrorBoundary>
  );
}

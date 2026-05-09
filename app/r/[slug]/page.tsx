import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';

export const dynamic = 'force-dynamic';

/**
 * Korte referral-route: `?campaign=app` stuurt naar de beta-downloadpagina met attributie.
 * Zonder campaign: zelfde stille cookie-flow als /welkom/[code] naar de homepage.
 */
export default async function ReferralShortLinkPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { campaign?: string };
}) {
  const slug = params.slug?.trim();
  if (!slug) {
    redirect('/');
  }

  if (searchParams.campaign === 'app') {
    const affiliateId = await getAffiliateIdFromCode(slug);
    if (affiliateId) {
      redirect(
        `/api/affiliate/referral?code=${encodeURIComponent(slug)}&redirect=${encodeURIComponent('/app')}&androidBeta=1`,
      );
    }
    redirect(`/app?code=${encodeURIComponent(slug)}`);
  }

  redirect(
    `/api/affiliate/referral?code=${encodeURIComponent(slug)}&redirect=${encodeURIComponent('/')}`,
  );
}

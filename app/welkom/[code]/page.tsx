import { redirect } from 'next/navigation';
import { getAffiliateIdFromCode } from '@/lib/affiliate-attribution';
import { cookies } from 'next/headers';
import WelkomClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function WelkomPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;

  if (!code) {
    redirect('/inspiratie');
  }

  // Validate referral code
  const affiliateId = await getAffiliateIdFromCode(code);
  
  if (affiliateId) {
    // Set referral cookie (30 days)
    const cookieStore = await cookies();
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    cookieStore.set('hc_ref', code, {
      expires,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Needs to be accessible from client-side
    });
  }

  // Show welcome page instead of immediate redirect
  return <WelkomClient code={code} isValid={!!affiliateId} language="nl" />;
}


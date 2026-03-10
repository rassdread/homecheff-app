import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { hasSellerAccess } from '@/lib/seller-access';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import SellerRevenuePageClient from './page-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');

  let lang: 'nl' | 'en' = 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    lang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    lang = languageCookie.value as 'nl' | 'en';
  }

  if (lang === 'en') {
    return { title: 'Revenue & Payouts | HomeCheff' };
  }
  return { title: 'Omzet & Uitbetalingen | HomeCheff' };
}

export default async function SellerRevenuePageWrapper() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check if user has seller access
  const hasAccess = await hasSellerAccess(userId);

  if (!hasAccess) {
    redirect('/');
  }

  return <SellerRevenuePageClient />;
}


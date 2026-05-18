import type { Metadata } from 'next';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { SAFETY_STANDARDS_URL } from '@/lib/legal/policy-urls';

const TITLE = 'Safety Standards | HomeCheff';
const DESCRIPTION = 'HomeCheff safety standards and child safety policy.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${MAIN_DOMAIN}${SAFETY_STANDARDS_URL}`,
  },
  alternates: {
    canonical: `${MAIN_DOMAIN}${SAFETY_STANDARDS_URL}`,
    languages: seoHreflangLanguagesOnEu(SAFETY_STANDARDS_URL),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

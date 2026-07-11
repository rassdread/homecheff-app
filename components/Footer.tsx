'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Logo from '@/components/Logo';
import { FileText, Shield, Mail, Info, HelpCircle, MessageSquare, BookOpen, Trophy, TrendingUp, ShieldAlert, Users, Scroll, Library, BarChart3, Scale } from 'lucide-react';
import { COMMUNITY_GUIDELINES_URL, SAFETY_STANDARDS_URL } from '@/lib/legal/policy-urls';
import { isCompactMobileFooterPath } from '@/lib/layout/compactFooterRoutes';

export default function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const compactPath = isCompactMobileFooterPath(pathname);

  const links = [
    { href: '/affiliate', label: t('siteFooter.affiliateProgram'), icon: TrendingUp },
    { href: '/docs', label: t('siteFooter.openDocs'), icon: Library },
    { href: '/evidence', label: t('siteFooter.evidence'), icon: BarChart3 },
    { href: '/seo-hub', label: t('siteFooter.seoHub'), icon: BookOpen },
    { href: '/privacy', label: t('siteFooter.privacy'), icon: Shield },
    { href: '/terms', label: t('siteFooter.terms'), icon: FileText },
    { href: COMMUNITY_GUIDELINES_URL, label: t('siteFooter.communityGuidelines'), icon: Users },
    { href: SAFETY_STANDARDS_URL, label: t('siteFooter.safety'), icon: ShieldAlert },
    { href: '/contact', label: t('siteFooter.contact'), icon: Mail },
    { href: '/over-ons', label: t('siteFooter.overOns'), icon: Info },
    { href: '/constitution', label: t('siteFooter.constitution'), icon: Scale },
    { href: '/manifest', label: t('siteFooter.manifest'), icon: Scroll },
    { href: '/faq', label: t('siteFooter.faq'), icon: HelpCircle },
    { href: '/hcp-ranglijsten', label: t('siteFooter.hcpRankings'), icon: Trophy },
    { href: '/contact?subject=feedback', label: t('siteFooter.feedback'), icon: MessageSquare },
  ];

  const compactMobileBar = compactPath ? (
    <div className="flex md:hidden items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors shrink-0 min-w-0">
        <Logo size="sm" showText={true} />
      </Link>
      <nav
        className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-gray-500 max-w-[65%]"
        aria-label="Footer navigatie"
      >
        <Link href="/privacy" className="hover:text-emerald-600 whitespace-nowrap">
          {t('siteFooter.privacy')}
        </Link>
        <span className="text-gray-300" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="hover:text-emerald-600 whitespace-nowrap">
          {t('siteFooter.terms')}
        </Link>
        <span className="text-gray-300" aria-hidden>
          ·
        </span>
        <Link href="/contact" className="hover:text-emerald-600 whitespace-nowrap">
          {t('siteFooter.contact')}
        </Link>
      </nav>
    </div>
  ) : null;

  const fullFooterInner = (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors w-fit">
          <Logo size="sm" showText={true} />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer navigatie">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-500">{t('siteFooter.companyLine')}</p>
      </div>
    </>
  );

  return (
    <footer
      data-homecheff-site-footer
      className="mt-auto border-t border-gray-200 bg-white"
    >
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 ${
          compactPath ? 'py-3 md:py-8' : 'py-8'
        }`}
      >
        {compactMobileBar}
        <div className={compactPath ? 'hidden md:block' : ''}>{fullFooterInner}</div>
      </div>
    </footer>
  );
}

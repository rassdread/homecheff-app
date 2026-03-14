'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import Logo from '@/components/Logo';
import { FileText, Shield, Mail, Info, HelpCircle, MessageSquare } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  const links = [
    { href: '/privacy', label: t('siteFooter.privacy'), icon: Shield },
    { href: '/terms', label: t('siteFooter.terms'), icon: FileText },
    { href: '/contact', label: t('siteFooter.contact'), icon: Mail },
    { href: '/over-ons', label: t('siteFooter.overOns'), icon: Info },
    { href: '/faq', label: t('siteFooter.faq'), icon: HelpCircle },
    { href: '/contact?subject=feedback', label: t('siteFooter.feedback'), icon: MessageSquare },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
          <p className="text-xs text-gray-500">
            {t('siteFooter.companyLine')}
          </p>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { Shield, FileText, Mail, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type MobileProps = {
  variant: 'mobile';
  mobileNavRowClass: string;
  onNavigate?: () => void;
};

type DropdownProps = {
  variant: 'dropdown';
  onNavigate?: () => void;
};

export type NavbarLegalContactLinksProps = MobileProps | DropdownProps;

export function NavbarLegalContactLinks(props: NavbarLegalContactLinksProps) {
  const { variant, onNavigate } = props;
  const { t } = useTranslation();

  const rowClass =
    variant === 'mobile'
      ? props.mobileNavRowClass
      : cn(
          'flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
        );

  return (
    <div
      className={
        variant === 'mobile' ? 'mt-2 border-t border-gray-200 pt-2' : 'border-t border-gray-100 pt-1'
      }
    >
      <p
        className={
          variant === 'mobile'
            ? 'px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500'
            : 'px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500'
        }
      >
        {t('navbar.legalAndContact')}
      </p>
      <nav className="flex flex-col" aria-label={t('navbar.legalNavAria')}>
        <Link
          href="/privacy"
          prefetch={false}
          className={rowClass}
          onClick={() => onNavigate?.()}
        >
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('siteFooter.privacy')}</span>
        </Link>
        <Link
          href="/terms"
          prefetch={false}
          className={rowClass}
          onClick={() => onNavigate?.()}
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('siteFooter.terms')}</span>
        </Link>
        <Link
          href="/contact"
          prefetch={false}
          className={rowClass}
          onClick={() => onNavigate?.()}
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('siteFooter.contact')}</span>
        </Link>
        <Link
          href="/faq"
          prefetch={false}
          className={rowClass}
          onClick={() => onNavigate?.()}
        >
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('siteFooter.faq')}</span>
        </Link>
      </nav>
    </div>
  );
}

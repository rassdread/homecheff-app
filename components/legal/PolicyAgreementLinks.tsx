'use client';

import Link from 'next/link';
import {
  COMMUNITY_GUIDELINES_URL,
  PRIVACY_URL,
  SAFETY_STANDARDS_URL,
  TERMS_URL,
} from '@/lib/legal/policy-urls';
import { useTranslation } from '@/hooks/useTranslation';

const linkClass =
  'text-[#006D52] hover:text-[#005a44] underline font-medium';

type PolicyAgreementLinksProps = {
  /** Compact inline links for checkbox labels */
  variant?: 'inline' | 'block';
};

/**
 * Linked policy names for signup / onboarding acceptance copy.
 */
export function PolicyAgreementLinks({ variant = 'inline' }: PolicyAgreementLinksProps) {
  const { t } = useTranslation();
  const wrap = variant === 'block' ? 'flex flex-wrap gap-x-1 gap-y-1' : '';

  return (
    <span className={wrap}>
      <Link href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('legalPolicies.terms')}
      </Link>
      {variant === 'inline' ? ', ' : null}
      <Link href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('legalPolicies.privacy')}
      </Link>
      {variant === 'inline' ? ', ' : null}
      <Link
        href={COMMUNITY_GUIDELINES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {t('legalPolicies.communityGuidelines')}
      </Link>
      {variant === 'inline' ? ' ' : null}
      {t('legalPolicies.and')}{' '}
      <Link href={SAFETY_STANDARDS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('legalPolicies.safetyStandards')}
      </Link>
    </span>
  );
}

export function PolicyPageFooterLinks() {
  const { t } = useTranslation();

  return (
    <nav
      className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"
      aria-label={t('legalPolicies.relatedPoliciesAria')}
    >
      <Link href={PRIVACY_URL} className={linkClass}>
        {t('legalPolicies.privacy')}
      </Link>
      <Link href={TERMS_URL} className={linkClass}>
        {t('legalPolicies.terms')}
      </Link>
      <Link href={COMMUNITY_GUIDELINES_URL} className={linkClass}>
        {t('legalPolicies.communityGuidelines')}
      </Link>
      <Link href={SAFETY_STANDARDS_URL} className={linkClass}>
        {t('legalPolicies.safetyStandards')}
      </Link>
    </nav>
  );
}

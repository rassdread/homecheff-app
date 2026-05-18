'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { PolicyAgreementLinks } from '@/components/legal/PolicyAgreementLinks';

/** Checkbox label: “I agree to the …” with linked policies (signup / onboarding). */
export function PolicyAgreementTermsLabel() {
  const { t } = useTranslation();

  return (
    <span className="text-sm text-gray-700">
      {t('legalPolicies.acceptPrefix')}{' '}
      <PolicyAgreementLinks />
      <span className="text-red-600" aria-hidden>
        {' '}
        *
      </span>
    </span>
  );
}

'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type SuspensionNoticeProps = {
  suspendReason?: string | null;
  suspendedAt?: string | null;
};

export default function SuspensionNotice({ suspendReason, suspendedAt }: SuspensionNoticeProps) {
  const { t } = useTranslation();

  return (
    <div
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4"
      role="alert"
      data-testid="suspension-notice"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-2 text-sm text-amber-950">
          <p className="font-semibold">{t('accountSuspension.title')}</p>
          <p>{t('accountSuspension.body')}</p>
          {suspendReason ? (
            <p>
              <span className="font-medium">{t('accountSuspension.reasonLabel')}:</span> {suspendReason}
            </p>
          ) : null}
          {suspendedAt ? (
            <p className="text-xs text-amber-800">
              {t('accountSuspension.sinceLabel')}: {new Date(suspendedAt).toLocaleString()}
            </p>
          ) : null}
          <p className="text-xs text-amber-800">{t('accountSuspension.readOnlyNote')}</p>
          <Link href="/contact" className="inline-block text-xs font-medium text-emerald-700 hover:text-emerald-800">
            {t('accountSuspension.appealLink')} →
          </Link>
        </div>
      </div>
    </div>
  );
}

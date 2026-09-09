'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { OrgMembershipSummary } from '@/lib/share/resolve-marketplace-share-url';

type Props = {
  memberships: OrgMembershipSummary[];
  onChoosePersonal: () => void;
  onChooseCompany: (organizationId: string) => void;
  busy?: boolean;
  className?: string;
};

/**
 * Human dual-context chooser — only when personal + company attribution differ.
 * No binder / referral-type / "Delen als" technical wording.
 */
export default function AffiliatePromoteChooser({
  memberships,
  onChoosePersonal,
  onChooseCompany,
  busy = false,
  className = '',
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-xs font-medium text-gray-700">{t('share.chooseContext')}</p>
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-emerald-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        onClick={onChoosePersonal}
      >
        {t('share.shareForMyself')}
      </button>
      {memberships.map((m) => (
        <button
          key={m.organizationId}
          type="button"
          disabled={busy}
          className="rounded-lg bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          onClick={() => onChooseCompany(m.organizationId)}
        >
          {t('share.shareForCompany', {
            company: m.displayName || m.companyName,
          })}
        </button>
      ))}
    </div>
  );
}

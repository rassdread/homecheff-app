'use client';

import type { OrgMembershipSummary } from '@/lib/share/resolve-marketplace-share-url';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  memberships: OrgMembershipSummary[];
  onChoosePersonal: () => void;
  onChooseCompany: (organizationId: string) => void;
  busy?: boolean;
  className?: string;
};

/**
 * Human dual-context chooser — only when personal + company attribution differ.
 * Always shows fallback Dutch/English text so the panel is never blank before i18n loads.
 */
export default function AffiliatePromoteChooser({
  memberships,
  onChoosePersonal,
  onChooseCompany,
  busy = false,
  className = '',
}: Props) {
  const { t, isReady, language } = useTranslation();
  const nl = language !== 'en';
  const heading =
    (isReady && t('share.chooseContext')) ||
    (nl ? 'Voor wie promoot je?' : 'Who are you promoting for?');
  const forMyself =
    (isReady && t('share.shareForMyself')) ||
    (nl ? 'Voor mezelf' : 'For myself');
  const forCompanyTpl =
    (isReady && t('share.shareForCompany')) ||
    (nl ? 'Voor mijn bedrijf: {company}' : 'For my company: {company}');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-sm font-semibold text-slate-900">{heading}</p>
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-emerald-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60 min-h-[44px]"
        onClick={onChoosePersonal}
      >
        {forMyself}
      </button>
      {memberships.map((m) => {
        const company = m.displayName || m.companyName;
        const label = forCompanyTpl.replace('{company}', company);
        return (
          <button
            key={m.organizationId}
            type="button"
            disabled={busy}
            className="rounded-lg bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60 min-h-[44px]"
            onClick={() => onChooseCompany(m.organizationId)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

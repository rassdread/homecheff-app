'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
  HOMEPAGE_INFO_MORE_GROUPS,
  HOMEPAGE_INFO_PRIMARY_LINKS,
} from '@/lib/home/homepage-info-chrome';
import { getLegalOperatorDisplay } from '@/lib/seo/legal-operator-display';

type ChromeVariant = 'rail' | 'nav' | 'workspace';

type Props = {
  variant: ChromeVariant;
  onNavigate?: () => void;
};

function CompanyIdentity({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const identity = getLegalOperatorDisplay();

  return (
    <p
      data-hc-homepage-company-identity=""
      className={cn(
        'text-[10px] leading-snug text-gray-500',
        compact ? 'truncate' : 'space-y-0.5',
      )}
    >
      <span className="font-medium text-gray-600">{identity.brandMark}</span>
      <span className="text-gray-300" aria-hidden>
        {' · '}
      </span>
      <span>{identity.legalName}</span>
      <span className="text-gray-300" aria-hidden>
        {' · '}
      </span>
      <span>
        {t('homepageInfo.kvkLine', { kvk: identity.kvk })}
        {' · '}
        {identity.locality}
      </span>
    </p>
  );
}

function MorePanel({
  open,
  onClose,
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledById={titleId}
      lockScroll
      overlayClassName="fixed inset-0 z-[160] bg-black/40 flex items-end justify-center p-0 sm:items-center sm:p-4"
      overlayProps={{ 'data-hc-homepage-info-more-overlay': '1' }}
    >
      <div
        data-hc-homepage-info-more=""
        className="flex max-h-[min(85vh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-gray-900">
            {t('homepageInfo.moreTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          >
            {t('buttons.close')}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {HOMEPAGE_INFO_MORE_GROUPS.map((group) => (
            <section key={group.id} className="mb-4 last:mb-0">
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t(group.titleKey)}
              </h3>
              <ul className="grid gap-0.5">
                {group.links.map((link) => (
                  <li key={`${group.id}:${link.id}`}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="block rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-800"
                      onClick={onClose}
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <CompanyIdentity />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function HomepageInfoChrome({ variant, onNavigate }: Props) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const titleId = useId();
  const isRail = variant === 'rail';
  const isWorkspace = variant === 'workspace';
  const isCompact = isRail || isWorkspace;

  const closeAndNavigate = () => {
    setMoreOpen(false);
    onNavigate?.();
  };

  return (
    <div
      data-hc-homepage-info-chrome={variant}
      suppressHydrationWarning
      className={cn(
        isRail &&
          'sticky bottom-0 mt-auto border-t border-gray-100 bg-white/95 pt-2.5 pb-1 backdrop-blur-[2px]',
        isWorkspace && 'bg-white px-0.5 py-0.5',
        variant === 'nav' && 'mt-2 border-t border-gray-200 pt-2',
      )}
    >
      {isWorkspace ? null : isRail ? (
        <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {t('homepageInfo.navAria')}
        </p>
      ) : (
        <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t('homepageInfo.navAria')}
        </p>
      )}
      <nav
        aria-label={t('homepageInfo.navAria')}
        className={cn(
          isCompact
            ? 'flex flex-wrap items-center gap-x-2 gap-y-0.5 px-0.5 text-[11px] leading-relaxed text-gray-500'
            : 'flex flex-col',
        )}
      >
        {HOMEPAGE_INFO_PRIMARY_LINKS.map((link, index) => (
          <span
            key={link.id}
            className={isCompact ? 'inline-flex items-center gap-2' : 'contents'}
          >
            {isCompact && index > 0 ? (
              <span className="text-gray-300" aria-hidden>
                ·
              </span>
            ) : null}
            <Link
              href={link.href}
              prefetch={false}
              className={
                isCompact
                  ? 'hover:text-emerald-800 hover:underline'
                  : 'flex min-h-[44px] items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
              }
              onClick={closeAndNavigate}
            >
              {t(link.labelKey)}
            </Link>
          </span>
        ))}
        {isCompact ? (
          <>
            <span className="text-gray-300" aria-hidden>
              ·
            </span>
            <button
              type="button"
              className="hover:text-emerald-800 hover:underline"
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
            >
              {t('homepageInfo.more')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="flex min-h-[44px] items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            onClick={() => setMoreOpen(true)}
          >
            {t('homepageInfo.more')}
          </button>
        )}
      </nav>
      <div className={isCompact ? 'mt-1 px-0.5' : 'px-3 pb-2 pt-1'}>
        <CompanyIdentity compact={isCompact} />
      </div>
      <MorePanel
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        titleId={titleId}
      />
    </div>
  );
}

/** Kept for seals/tests — must not be mounted in homepage orientation chrome. */
export function HomepageWorkspaceInfoBar() {
  return (
    <div data-hc-homepage-info-workspace="" hidden aria-hidden="true">
      <HomepageInfoChrome variant="workspace" />
    </div>
  );
}

'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { PROFILE_V2_TABS } from '@/lib/profile/profile-v2/tabs';
import type { ProfileV2TabId } from '@/lib/profile/profile-v2/types';
import { cn } from '@/lib/utils';

type Props = {
  activeTab: ProfileV2TabId;
  onTabChange: (tab: ProfileV2TabId) => void;
};

export default function ProfileV2TabNav({ activeTab, onTabChange }: Props) {
  const { t } = useTranslation();

  return (
    <nav
      className="sticky z-10 mb-0"
      style={{ top: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 3rem))' }}
      aria-label={t('profileV2.tabs.navLabel')}
    >
      <div
        className="hc-profile-v2-tab-pill flex gap-1.5 overflow-x-auto rounded-2xl border border-primary-brand/10 bg-white/90 p-1.5 shadow-sm backdrop-blur-md scrollbar-hide snap-x snap-mandatory"
        role="tablist"
      >
        {PROFILE_V2_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'hc-profile-v2-filter-chip shrink-0 snap-start whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition touch-manipulation sm:px-4',
                active
                  ? 'bg-primary-brand text-white shadow-sm'
                  : 'text-gray-600 hover:bg-primary-50/60 hover:text-gray-900',
              )}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

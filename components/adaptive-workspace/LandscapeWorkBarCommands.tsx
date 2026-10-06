'use client';

/**
 * WX 1B.4.1 / mobile-actions — Commands hosted in the short-landscape work bar.
 * Reuses CreateFlow + GuestAuthGate; menu opens via NavBar command bus.
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Menu, Plus, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { navDebug } from '@/lib/nav-debug';
import {
  subscribeNavbarMobileMenuOpen,
  toggleNavbarMobileMenu,
} from '@/lib/nav/navbar-command-bus';

type Props = {
  contextLabel: string;
  className?: string;
};

export default function LandscapeWorkBarCommands({
  contextLabel,
  className,
}: Props) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const user = session?.user;
  const { openCreateFlow } = useCreateFlow();
  const { requireAuthAction } = useGuestAuthGate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => subscribeNavbarMobileMenuOpen(setMenuOpen), []);

  const createLabel = t('homePhase1.ctaOfferCompact');

  return (
    <div
      data-wx-workbar-commands=""
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2',
        className,
      )}
    >
      <div
        data-wx-workbar-logo=""
        className="hc-wx-workbar-logo shrink-0 [&_.relative]:!h-7 [&_.relative]:!w-7"
      >
        <Logo size="sm" showText={false} />
      </div>

      <p
        data-wx-workbar-context=""
        className="min-w-0 flex-1 truncate text-[clamp(0.65rem,1.5vw,0.75rem)] font-semibold leading-none tracking-tight text-[var(--hc-text)]"
        title={contextLabel}
      >
        {contextLabel}
      </p>

      <button
        type="button"
        data-wx-primary-action=""
        data-wx-landscape-create=""
        data-wx-workbar-create=""
        className={cn(
          'inline-flex shrink-0 items-center justify-center gap-1',
          'rounded-lg px-2.5 py-1.5 min-h-[40px]',
          'hc-btn-primary text-[13px] font-semibold whitespace-nowrap leading-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hc-focus)]',
          'touch-manipulation select-none',
        )}
        onClick={() => {
          if (user) {
            openCreateFlow();
          } else {
            requireAuthAction('create', '/sell/new');
          }
          navDebug('workbar:landscape-create', { action: 'create' });
        }}
        aria-label={createLabel}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{createLabel}</span>
      </button>

      <button
        type="button"
        data-wx-workbar-menu=""
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          'rounded-lg min-h-[44px] min-w-[44px]',
          'text-[var(--hc-text)] hover:bg-[var(--hc-surface-subtle)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hc-focus)]',
          'touch-manipulation',
        )}
        onClick={() => {
          toggleNavbarMobileMenu();
          navDebug('workbar:landscape-menu', { action: 'toggle-menu' });
        }}
        aria-expanded={menuOpen}
        aria-controls="navbar-mobile-menu"
        aria-label={menuOpen ? t('buttons.close') : 'Menu'}
      >
        {menuOpen ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}

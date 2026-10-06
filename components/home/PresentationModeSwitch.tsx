'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { HomePresentationMode } from '@/lib/home/presentation-mode';

type Props = {
  mode: HomePresentationMode;
  onChange: (mode: HomePresentationMode) => void;
  /** Header placement drops the page label so the switch sits in the nav row. */
  placement?: 'page' | 'header';
};

export default function PresentationModeSwitch({
  mode,
  onChange,
  placement = 'page',
}: Props) {
  const { tOr } = useTranslation();
  const label = tOr('home.presentation.label', 'View', 'Weergave');
  const marketplace = tOr(
    'home.presentation.marketplace',
    'Marketplace',
    'Marketplace',
  );
  const workspace = tOr('home.presentation.workspace', 'Workspace', 'Werkruimte');

  return (
    <div
      className={
        placement === 'header'
          ? 'flex items-center'
          : 'flex items-center justify-end gap-2 px-2 py-1 sm:px-3'
      }
      data-hc-presentation-switch={placement}
    >
      {placement === 'page' ? (
        <span className="text-[11px] font-medium text-[var(--hc-text-secondary)]">{label}</span>
      ) : null}
      <div
        role="group"
        aria-label={label}
        className="inline-flex overflow-hidden rounded-lg border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)]"
      >
        <ModeButton
          pressed={mode === 'marketplace'}
          onClick={() => onChange('marketplace')}
          compact={placement === 'header'}
        >
          {marketplace}
        </ModeButton>
        <ModeButton
          pressed={mode === 'workspace'}
          onClick={() => onChange('workspace')}
          compact={placement === 'header'}
        >
          {workspace}
        </ModeButton>
      </div>
    </div>
  );
}

function ModeButton({
  pressed,
  onClick,
  compact,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  compact?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        pressed
          ? compact
            ? 'hc-nav-selected px-2 py-1 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hc-focus)]'
            : 'hc-nav-selected px-2.5 py-1 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hc-focus)]'
          : compact
            ? 'px-2 py-1 text-[11px] font-medium text-[var(--hc-text-secondary)] hover:bg-[var(--hc-surface-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hc-focus)]'
            : 'px-2.5 py-1 text-xs font-medium text-[var(--hc-text-secondary)] hover:bg-[var(--hc-surface-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hc-focus)]'
      }
    >
      {children}
    </button>
  );
}

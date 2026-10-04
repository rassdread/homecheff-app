'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { HomePresentationMode } from '@/lib/home/presentation-mode';

type Props = {
  mode: HomePresentationMode;
  onChange: (mode: HomePresentationMode) => void;
};

export default function PresentationModeSwitch({ mode, onChange }: Props) {
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
      className="flex items-center justify-end gap-2 px-2 py-1 sm:px-3"
      data-hc-presentation-switch=""
    >
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        <ModeButton
          pressed={mode === 'marketplace'}
          onClick={() => onChange('marketplace')}
        >
          {marketplace}
        </ModeButton>
        <ModeButton
          pressed={mode === 'workspace'}
          onClick={() => onChange('workspace')}
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
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        pressed
          ? 'bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-900'
          : 'px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50'
      }
    >
      {children}
    </button>
  );
}

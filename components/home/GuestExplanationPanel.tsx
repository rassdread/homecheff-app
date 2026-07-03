'use client';

import Link from 'next/link';
import {
  X,
  Compass,
  Plus,
  ChefHat,
  Sprout,
  Palette,
  Briefcase,
  MessageCircle,
  User,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { GuestExplanationNamespace } from '@/lib/guest/guest-explanation-panels';
import { cn } from '@/lib/utils';

const MAX_BULLETS = 6;

type PanelVisual = {
  Icon: LucideIcon;
  gradient: string;
  accentBg: string;
  emoji: string;
};

const PANEL_VISUALS: Record<string, PanelVisual> = {
  discover: {
    Icon: Compass,
    gradient: 'from-secondary-brand via-[#0077c2] to-primary-brand',
    accentBg: 'bg-secondary-50',
    emoji: '🧭',
  },
  share: {
    Icon: Plus,
    gradient: 'from-primary-brand via-[#007a5c] to-secondary-brand',
    accentBg: 'bg-primary-50',
    emoji: '✨',
  },
  cheff: {
    Icon: ChefHat,
    gradient: 'from-orange-500 via-primary-brand to-secondary-brand',
    accentBg: 'bg-orange-50',
    emoji: '🍲',
  },
  garden: {
    Icon: Sprout,
    gradient: 'from-emerald-500 via-primary-brand to-secondary-brand',
    accentBg: 'bg-emerald-50',
    emoji: '🌱',
  },
  designer: {
    Icon: Palette,
    gradient: 'from-purple-500 via-secondary-brand to-primary-brand',
    accentBg: 'bg-purple-50',
    emoji: '🎨',
  },
  earn: {
    Icon: Briefcase,
    gradient: 'from-amber-500 via-primary-brand to-secondary-brand',
    accentBg: 'bg-amber-50',
    emoji: '💼',
  },
  create: {
    Icon: Plus,
    gradient: 'from-primary-brand to-secondary-brand',
    accentBg: 'bg-primary-50',
    emoji: '➕',
  },
  messages: {
    Icon: MessageCircle,
    gradient: 'from-secondary-brand via-primary-brand to-purple-600',
    accentBg: 'bg-secondary-50',
    emoji: '💬',
  },
  profile: {
    Icon: User,
    gradient: 'from-primary-brand via-[#007a5c] to-secondary-brand',
    accentBg: 'bg-primary-50',
    emoji: '👤',
  },
  reputation: {
    Icon: Award,
    gradient: 'from-amber-500 via-primary-brand to-secondary-brand',
    accentBg: 'bg-amber-50',
    emoji: '🤝',
  },
};

const DEFAULT_VISUAL: PanelVisual = {
  Icon: Compass,
  gradient: 'from-primary-brand to-secondary-brand',
  accentBg: 'bg-primary-50',
  emoji: '✨',
};

type Props = {
  namespace: GuestExplanationNamespace;
  panel: string | null;
  onClose: () => void;
  registerHref?: string;
  loginHref?: string;
};

export default function GuestExplanationPanel({
  namespace,
  panel,
  onClose,
  registerHref = '/register',
  loginHref = '/login',
}: Props) {
  const { t } = useTranslation();
  if (!panel) return null;

  const base = `${namespace}.${panel}`;
  const title = t(`${base}.title`);
  const body = t(`${base}.body`);
  const visual = PANEL_VISUALS[panel] ?? DEFAULT_VISUAL;
  const { Icon, gradient, accentBg, emoji } = visual;

  const bullets = Array.from({ length: MAX_BULLETS }, (_, i) => t(`${base}.bullet${i + 1}`)).filter(
    (line) => line && !line.startsWith(`${base}.bullet`)
  );

  const ctaRegister = t(`${namespace}.ctaRegister`);
  const ctaLogin = t(`${namespace}.ctaLogin`);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-explanation-panel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#faf8f4] shadow-2xl border border-gray-200/80 overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className={cn('relative px-6 pt-8 pb-10 sm:pt-10 sm:pb-12 bg-gradient-to-br text-white', gradient)}>
          <div
            className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_80%_20%,white_0%,transparent_50%)]"
            aria-hidden
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 shrink-0 rounded-full p-2 text-white/90 hover:bg-white/20 transition-colors"
            aria-label={t('buttons.close') || 'Sluiten'}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative flex flex-col items-center text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 ring-2 ring-white/30 shadow-xl backdrop-blur-sm">
              <Icon className="h-10 w-10 text-white" aria-hidden />
            </div>
            <span className="text-3xl" aria-hidden>
              {emoji}
            </span>
            <h2
              id="guest-explanation-panel-title"
              className="text-2xl sm:text-[1.65rem] font-extrabold text-white leading-tight tracking-tight max-w-sm"
            >
              {title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-6 sm:py-8 space-y-5 -mt-4 relative">
          <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-base text-gray-700 leading-relaxed font-medium">{body}</p>
          </div>

          {bullets.length > 0 ? (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {bullets.map((line) => (
                <li
                  key={line}
                  className={cn(
                    'flex gap-2.5 rounded-xl border border-gray-200/70 px-3.5 py-3 text-sm text-gray-800 shadow-sm',
                    accentBg
                  )}
                >
                  <span className="text-primary-brand shrink-0 font-bold text-base" aria-hidden>
                    ✓
                  </span>
                  <span className="leading-snug font-medium">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={registerHref}
              onClick={onClose}
              className="hc-btn-primary min-h-[50px] flex-1 rounded-2xl text-base"
            >
              {ctaRegister}
            </Link>
            <Link
              href={loginHref}
              onClick={onClose}
              className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-2.5 text-base font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              {ctaLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

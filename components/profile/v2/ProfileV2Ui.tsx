'use client';

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Panel heading — zelfde hiërarchie als homepage secties. */
export function ProfileV2PanelHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn('space-y-1', className)}>
      <h2 className="hc-section-title">{title}</h2>
      {subtitle ? <p className="hc-meta-text text-sm text-gray-600">{subtitle}</p> : null}
    </header>
  );
}

/** Card wrapper — parity met hc-dorpsplein-card / feed cards. */
export function ProfileV2SectionCard({
  children,
  className,
  padding = 'default',
}: {
  children: ReactNode;
  className?: string;
  padding?: 'default' | 'compact';
}) {
  return (
    <section
      className={cn(
        'hc-profile-v2-section hc-dorpsplein-card border-primary-brand/10 bg-white shadow-sm',
        padding === 'compact' ? 'p-4 sm:p-5' : 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Warme empty state met optionele CTA. */
export function ProfileV2EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="hc-profile-v2-empty rounded-2xl border border-dashed border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30 px-5 py-8 text-center sm:px-8">
      {icon ? <div className="mb-3 flex justify-center text-emerald-600">{icon}</div> : null}
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="hc-btn-primary mt-5 inline-flex items-center gap-2"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <button type="button" onClick={onAction} className="hc-btn-primary mt-5 inline-flex items-center gap-2">
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** Filter chips — parity met homepage feed chips. */
export function ProfileV2FilterChips<T extends string>({
  options,
  value,
  onChange,
  labelKey,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelKey: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'hc-profile-v2-filter-chip rounded-full px-3.5 py-1.5 text-xs font-semibold transition touch-manipulation',
              active
                ? 'bg-primary-brand text-white shadow-sm'
                : 'border border-gray-200/90 bg-white text-gray-700 hover:border-primary-brand/30 hover:bg-primary-50/50',
            )}
          >
            {labelKey(opt)}
          </button>
        );
      })}
    </div>
  );
}

/** Sectie-previewkaart op Overzicht-tab. */
export function ProfileV2PreviewCard({
  title,
  description,
  icon,
  onClick,
  ctaLabel,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  ctaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hc-profile-v2-preview hc-card-lift group w-full rounded-2xl border border-primary-brand/10 bg-white p-5 text-left shadow-sm transition"
    >
      <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-primary-50 to-emerald-50/80 p-2.5 text-primary-brand">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-brand">
        {ctaLabel}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
}

/** Social proof strip — community / vertrouwen. */
export function ProfileV2SocialProofStrip({
  items,
}: {
  items: Array<{ label: string; value: string | number; accent?: boolean }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-xl border px-3 py-2 text-center sm:min-w-[5.5rem]',
            item.accent
              ? 'border-amber-200/80 bg-amber-50/60'
              : 'border-gray-100 bg-gray-50/80',
          )}
        >
          <p className="text-lg font-bold tabular-nums text-gray-900">{item.value}</p>
          <p className="text-[11px] font-medium text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Rol-pills onder naam. */
export function ProfileV2RolePills({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 xl:justify-start">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-900"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

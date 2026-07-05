'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function WidgetCard({
  title,
  children,
  className,
  variant = 'default',
}: {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'growth' | 'network';
}) {
  const variantClass =
    variant === 'growth'
      ? 'border-emerald-200/50 bg-gradient-to-br from-emerald-50/40 to-white'
      : variant === 'network'
        ? 'border-violet-200/50 bg-gradient-to-br from-violet-50/30 to-white'
        : 'border-primary-brand/10 bg-gradient-to-br from-primary-50/30 to-white';

  return (
    <section
      className={cn('hc-dorpsplein-card px-3 py-3', variantClass, className)}
    >
      <h3 className="hc-section-title mb-2 text-sm">{title}</h3>
      {children}
    </section>
  );
}

export function WidgetLine({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === '') return null;
  return (
    <p className="text-xs text-gray-700">
      <span className="font-medium text-gray-900">{value}</span>{' '}
      <span className="text-gray-600">{label}</span>
    </p>
  );
}

export function WidgetCta({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'mt-2 inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition',
        primary
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-gray-200 bg-white text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/40',
      )}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

export function WidgetActionButton({
  label,
  onClick,
  primary,
  icon,
  className,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
        primary
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-gray-200 bg-white text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/40',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="hc-dorpsplein-card animate-pulse px-3 py-3">
      <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
      <div className="h-16 rounded-lg bg-gray-100" />
    </div>
  );
}

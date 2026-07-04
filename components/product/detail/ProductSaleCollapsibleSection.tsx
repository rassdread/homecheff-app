'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export default function ProductSaleCollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2 text-base font-semibold text-gray-900">
          {icon}
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-gray-500 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">{children}</div>
      ) : null}
    </div>
  );
}

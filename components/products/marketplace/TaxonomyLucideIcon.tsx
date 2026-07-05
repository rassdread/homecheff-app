'use client';

import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type Props = {
  name: string;
  className?: string;
};

export function TaxonomyLucideIcon({ name, className = 'h-4 w-4 shrink-0' }: Props) {
  const Icon = (LucideIcons as Record<string, LucideIcon | undefined>)[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}

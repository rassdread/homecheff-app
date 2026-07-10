'use client';

import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
import { resolveTaxonomyIconClass } from '@/lib/marketplace/marketplace-icon-colors';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  className?: string;
  tone?: TaxonomyTone | null;
};

export function TaxonomyLucideIcon({
  name,
  className = 'h-4 w-4 shrink-0',
  tone,
}: Props) {
  const Icon = (LucideIcons as Record<string, LucideIcon | undefined>)[name];
  if (!Icon) return null;
  return (
    <Icon
      className={cn(className, tone ? resolveTaxonomyIconClass(tone) : undefined)}
      aria-hidden
    />
  );
}

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

function isLucideIcon(value: unknown): value is LucideIcon {
  return (
    typeof value === "object" &&
    value !== null &&
    "render" in value &&
    typeof value.render === "function"
  );
}

function lucideIconByName(name: string): LucideIcon | null {
  if (!(name in LucideIcons)) return null;
  const candidate: unknown = Reflect.get(LucideIcons, name);
  return isLucideIcon(candidate) ? candidate : null;
}

export function TaxonomyLucideIcon({
  name,
  className = 'h-4 w-4 shrink-0',
  tone,
}: Props) {
  const Icon = lucideIconByName(name);
  if (!Icon) return null;
  return (
    <Icon
      className={cn(className, tone ? resolveTaxonomyIconClass(tone) : undefined)}
      aria-hidden
    />
  );
}

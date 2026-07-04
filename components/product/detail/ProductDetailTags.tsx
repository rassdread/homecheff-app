'use client';

import { cn } from '@/lib/utils';

const MAX_TAGS = 8;

type Props = {
  tags?: string[] | null;
  subcategory?: string | null;
  className?: string;
};

export default function ProductDetailTags({ tags, subcategory, className }: Props) {
  const visibleTags = (tags ?? []).filter((t) => t && t.trim()).slice(0, MAX_TAGS);
  const hasSub = Boolean(subcategory?.trim());

  if (!hasSub && visibleTags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {hasSub ? (
        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
          {subcategory}
        </span>
      ) : null}
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex rounded-full border border-primary-brand/15 bg-primary-50/60 px-2 py-0.5 text-xs font-medium text-primary-brand/90"
        >
          #{tag.replace(/^#/, '')}
        </span>
      ))}
    </div>
  );
}

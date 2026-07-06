'use client';

export default function TilePriceLine({
  line,
  className = 'truncate text-sm font-semibold tabular-nums text-primary-brand',
}: {
  line: string | null | undefined;
  className?: string;
}) {
  if (!line) return null;
  return <p className={className}>{line}</p>;
}

'use client';

import JsonLdScript from '@/components/seo/JsonLdScript';

interface StructuredDataProps {
  data: object;
}

/** SSR-safe structured data — prefer JsonLdScript directly in server components. */
export default function StructuredData({ data }: StructuredDataProps) {
  const type = (data as { '@type'?: string })?.['@type'] || 'default';
  return <JsonLdScript id={`structured-data-${type}`} data={data as Record<string, unknown>} />;
}

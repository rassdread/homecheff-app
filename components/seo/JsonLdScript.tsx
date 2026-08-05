/**
 * Crawler-visible JSON-LD: plain script tag in HTML source.
 * Do not use next/script — that queues via self.__next_s and is invisible to many AI crawlers.
 */
export default function JsonLdScript({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[] | string;
}) {
  const html = typeof data === 'string' ? data : JSON.stringify(data);
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

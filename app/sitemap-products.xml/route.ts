import {
  buildSitemapXmlFromEntries,
  type SitemapUrlEntry,
} from '@/lib/seo/sitemapXml';
import { collectPublicListingSitemapEntries } from '@/lib/seo/public-listing-sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const listings = await collectPublicListingSitemapEntries();
  const entries: SitemapUrlEntry[] = listings.map((row) => ({
    loc: row.loc,
    lastmod: row.lastmod,
  }));
  const xml = buildSitemapXmlFromEntries(entries);
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

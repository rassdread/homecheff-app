import { buildSitemapXmlDocument } from "@/lib/seo/sitemapXml";

export const dynamic = "force-static";

export async function GET() {
  const xml = buildSitemapXmlDocument(new Date());
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

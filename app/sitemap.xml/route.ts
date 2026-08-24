import { buildSitemapXmlDocumentAsync } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const xml = await buildSitemapXmlDocumentAsync(new Date());
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Suggestion = {
  label: string;
  street: string;
  houseNumber: string;
  addition: string;
  postcode: string;
  city: string;
};

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 3) return NextResponse.json({ suggestions: [] });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(query)}&fq=type:adres&rows=6&fl=weergavenaam,straatnaam,huisnummer,huisletter,huisnummertoevoeging,postcode,woonplaatsnaam`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    if (!response.ok) return NextResponse.json({ suggestions: [] });
    const data = await response.json();
    const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
    const suggestions: Suggestion[] = docs.map((doc: Record<string, string>) => {
      const addition = [doc.huisletter, doc.huisnummertoevoeging].filter(Boolean).join('-');
      return {
        label: String(doc.weergavenaam || ''),
        street: String(doc.straatnaam || ''),
        houseNumber: String(doc.huisnummer || ''),
        addition,
        postcode: String(doc.postcode || ''),
        city: String(doc.woonplaatsnaam || ''),
      };
    }).filter((item: Suggestion) => item.street && item.houseNumber && item.postcode);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  } finally {
    clearTimeout(timer);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import en from '@/public/i18n/en.json';
import nl from '@/public/i18n/nl.json';

function requestLanguage(req: NextRequest): 'nl' | 'en' {
  const header = req.headers.get('x-homecheff-language');
  if (header === 'nl' || header === 'en') return header;
  const cookie = req.cookies.get('hc_locale')?.value || req.cookies.get('homecheff-language')?.value;
  if (cookie === 'nl' || cookie === 'en') return cookie;
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  if (country === 'NL' || country === 'BE') return 'nl';
  return 'en';
}

function page(lang: 'nl' | 'en') {
  const copy = (lang === 'nl' ? nl : en).notFound;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex, nofollow, noarchive"/>
  <title>${copy.title}</title>
  <style>
    body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#f9fafb;color:#111827}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .box{text-align:center;max-width:28rem}
    h1{font-size:3.75rem;margin:0 0 1rem}
    h2{font-size:1.5rem;font-weight:600;color:#374151;margin:0 0 1rem}
    p{color:#4b5563;margin:0 0 2rem}
    .row{display:flex;flex-direction:column;gap:1rem;justify-content:center}
    @media(min-width:640px){.row{flex-direction:row}}
    a{display:inline-block;padding:.75rem 1.5rem;border-radius:.5rem;text-decoration:none}
    .home{background:#059669;color:#fff}
    .insp{background:#e5e7eb;color:#374151}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="box">
      <h1>404</h1>
      <h2>${copy.title}</h2>
      <p>${copy.description}</p>
      <div class="row">
        <a class="home" href="/">${copy.home}</a>
        <a class="insp" href="/?chip=inspiration#homecheff-feed">${copy.inspiratie}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'cache-control': 'private, no-store',
};

/** Internal rewrite target so unknown `[seoSlug]` paths can return HTTP 404. */
export function GET(req: NextRequest) {
  const lang = requestLanguage(req);
  return new NextResponse(page(lang), { status: 404, headers: HEADERS });
}

export function HEAD() {
  return new NextResponse(null, { status: 404, headers: HEADERS });
}

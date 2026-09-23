/**
 * SEO snapshot (read-only): status, title, meta description, robots (meta + X-Robots-Tag), canonical,
 * hreflang, OG, H1/H2, JSON-LD types + hash, internal link set.
 * Env: BASE (default https://homecheff.eu), PATHS (comma list) or PATHS_FILE (one path per line),
 * LANG_COOKIE (nl|en), OUT (json path).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE = (process.env.BASE || 'https://homecheff.eu').replace(/\/$/, '');
const PATHS = process.env.PATHS_FILE
  ? fs.readFileSync(process.env.PATHS_FILE, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
  : (process.env.PATHS || '/,/werken-bij,/hoe-homecheff-werkt,/faq,/wat-is-homecheff').split(',');
const LANG = process.env.LANG_COOKIE || 'nl';
const OUT = process.env.OUT || '/tmp/hc-seo-snapshot.json';

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

const results = {};
for (const p of PATHS) {
  const res = await fetch(`${BASE}${p}`, { headers: { cookie: `homecheff-language=${LANG}` }, redirect: 'follow' });
  const html = await res.text();
  const jsonLd = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const types = jsonLd.flatMap((raw) => {
    try {
      const j = JSON.parse(raw);
      const items = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j];
      return items.map((i) => i['@type']);
    } catch {
      return ['<unparseable>'];
    }
  });
  const links = [...new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))].sort();
  results[p] = {
    status: res.status,
    finalUrl: res.url,
    xRobotsTag: res.headers.get('x-robots-tag'),
    title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/),
    description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/),
    robots: pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/),
    canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/),
    hreflang: [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hrefLang="([^"]+)"[^>]+href="([^"]+)"/gi)].map((m) => `${m[1]}=${m[2]}`).sort(),
    ogTitle: pick(html, /<meta[^>]+property="og:title"[^>]+content="([^"]*)"/),
    ogDescription: pick(html, /<meta[^>]+property="og:description"[^>]+content="([^"]*)"/),
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1])),
    h2: [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => strip(m[1])),
    jsonLdTypes: types,
    jsonLdHash: sha(jsonLd.join('\n')),
    internalLinks: links.length,
    internalLinksHash: sha(links.join('\n')),
    internalLinkList: links,
  };
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`${Object.keys(results).length} pages -> ${OUT}`);

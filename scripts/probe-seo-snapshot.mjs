/**
 * SEO snapshot (read-only): title, meta description, robots, canonical, H1/H2, JSON-LD types + hash, internal link count.
 * Env: BASE (default https://homecheff.eu), PATHS (comma list), LANG_COOKIE (nl|en), OUT (json path).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE = (process.env.BASE || 'https://homecheff.eu').replace(/\/$/, '');
const PATHS = (process.env.PATHS || '/,/werken-bij,/hoe-homecheff-werkt,/faq,/wat-is-homecheff').split(',');
const LANG = process.env.LANG_COOKIE || 'nl';
const OUT = process.env.OUT || '/tmp/hc-seo-snapshot.json';

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};

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
  results[p] = {
    status: res.status,
    finalUrl: res.url,
    title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/),
    description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/),
    robots: pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/),
    canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/),
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1])),
    h2: [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => strip(m[1])).slice(0, 20),
    jsonLdTypes: types,
    jsonLdHash: crypto.createHash('sha1').update(jsonLd.join('\n')).digest('hex').slice(0, 12),
    internalLinks: [...new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))].length,
  };
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

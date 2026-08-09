/**
 * Phase 1/2: map production feed items → taxonomy → href → HTTP probe.
 * Read-only.
 */
import { resolveFeedItemHref } from '../lib/feed/feed-item-href';
import { deriveFeedTaxonomy } from '../lib/feed/feed-taxonomy';
import { publicProfileHref, isPublicUsername } from '../lib/user/public-profile';

async function probe(path: string) {
  const url = path.startsWith('http')
    ? path
    : `https://homecheff.eu${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { Accept: 'text/html,application/json', 'User-Agent': 'HomeCheffRouteAudit/1.0' },
  });
  const ct = res.headers.get('content-type') || '';
  let bodyHint = '';
  let title = '';
  if (ct.includes('text/html')) {
    const text = await res.text();
    title = (text.match(/<title[^>]*>([^<]+)/i)?.[1] || '').trim().slice(0, 100);
    if (/Application error|Unhandled Runtime Error|__NEXT_ERROR__/i.test(text)) bodyHint = 'next_error';
    else if (/niet gevonden|Not Found|Could not load listing|Product Not Found/i.test(title + text.slice(0, 5000)))
      bodyHint = 'not_found_ui';
    else bodyHint = 'ok';
  } else if (ct.includes('json')) {
    const j = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
    bodyHint = j?.id ? 'json_ok' : j?.error ? `json_err:${j.error}` : 'json_other';
  }
  return { status: res.status, bodyHint, title };
}

async function main() {
  const feed = await fetch('https://homecheff.eu/api/feed?scope=national&take=40').then((r) =>
    r.json()
  );
  const items = (feed.items || []) as Record<string, any>[];
  const rows = [];
  for (const i of items) {
    const tax = deriveFeedTaxonomy(i as any);
    const href = resolveFeedItemHref(i as any, tax);
    const username = i.User?.username || i.seller?.username || null;
    const uid = i.User?.id || i.seller?.id || '';
    const profileHref = publicProfileHref(uid, username);
    const page = await probe(href.endsWith('/') ? href : `${href}/`);
    const api = await probe(`/api/products/${i.id}`);
    const profile = profileHref ? await probe(profileHref.endsWith('/') ? profileHref : `${profileHref}/`) : null;
    rows.push({
      id: i.id,
      type: i.type,
      feedSource: i.feedSource,
      category: i.category,
      listingIntent: i.listingIntent,
      taxKind: tax.kind,
      href,
      page,
      api: { status: api.status, bodyHint: api.bodyHint },
      username,
      isPublicUsername: isPublicUsername(username),
      profileHref,
      profile,
      title: String(i.title || '').slice(0, 40),
    });
  }

  const failures = rows.filter(
    (r) =>
      r.page.bodyHint === 'next_error' ||
      r.page.bodyHint === 'not_found_ui' ||
      r.page.status >= 400 ||
      (r.profile && (r.profile.bodyHint === 'next_error' || r.profile.status >= 400 || r.profile.bodyHint === 'not_found_ui'))
  );

  console.log(
    JSON.stringify(
      {
        total: rows.length,
        failureCount: failures.length,
        failures,
        sample: rows.slice(0, 12),
        all: rows,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Phase 2 probe: feed hrefs → production listing/profile HTTP results.
 * Read-only. Does not mutate production data.
 */
import { resolveFeedItemHref } from '../lib/feed/feed-item-href';
import { publicProfileHref, isPublicUsername } from '../lib/user/public-profile';

async function probe(path: string) {
  const url = path.startsWith('http') ? path : `https://homecheff.eu${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/json',
        'User-Agent': 'HomeCheffRouteAudit/1.0',
      },
    });
    const loc = res.headers.get('location');
    let bodyHint = '';
    const ct = res.headers.get('content-type') || '';
    if (res.status === 200 && ct.includes('text/html')) {
      const text = await res.text();
      if (/Application error|Unhandled Runtime Error|Something went wrong/i.test(text)) {
        bodyHint = 'next_error_page';
      } else if (/Could not load listing|ListingDetailUnavailable|Product Niet Gevonden|niet gevonden/i.test(text)) {
        bodyHint = 'unavailable_or_not_found_ui';
      } else if (/__NEXT_ERROR__/i.test(text)) {
        bodyHint = 'next_error_marker';
      } else {
        bodyHint = 'html_200';
      }
    } else if (res.status === 200 && ct.includes('json')) {
      const j = await res.json().catch(() => null);
      bodyHint = j?.error ? `json_error:${j.error}` : j?.id ? 'json_ok' : 'json_other';
    }
    return { status: res.status, loc, bodyHint };
  } catch (e: unknown) {
    return { status: 0, error: String(e instanceof Error ? e.message : e) };
  }
}

async function main() {
  const feed = await fetch('https://homecheff.eu/api/feed?scope=national&take=40').then((r) =>
    r.json()
  );
  const items = (feed.items || []) as any[];
  const results: any[] = [];

  for (const i of items.slice(0, 16)) {
    const href = resolveFeedItemHref(i);
    const username = i.User?.username || i.seller?.username || i.sellerUsername || null;
    const sellerId = i.User?.id || i.seller?.id || i.sellerUserId || null;
    const profileHref = publicProfileHref(sellerId || '', username);
    const listing = await probe(href.endsWith('/') ? href : `${href}/`);
    const listingBare = await probe(href);
    const api = await probe(`/api/products/${i.id}`);
    const profile = await probe(profileHref || `/user/${sellerId}`);
    results.push({
      id: i.id,
      type: i.type || i.feedSource,
      category: i.category || i.marketplaceCategory,
      title: (i.title || '').slice(0, 45),
      hasImage: Boolean(i.image || i.Image?.[0] || i.photos?.[0]),
      listingHref: href,
      username,
      isPublicUsername: isPublicUsername(username),
      profileHref: profileHref || `/user/${sellerId}`,
      listingTrailingSlash: listing,
      listingBare,
      api,
      profile,
    });
  }

  const extraProfiles = [
    'Kunstgalerij',
    'Lioness010',
    'Michelle',
    'TonyB',
    'temp_1777716708506_1tlo6e7r8',
    'kunstgalerij',
  ];
  const profiles: any[] = [];
  for (const u of extraProfiles) {
    profiles.push({ path: `/user/${u}`, ...(await probe(`/user/${u}`)) });
  }

  // Broken legacy path from FansAndFollowsList
  const legacyListing = await probe(`/listing/${items[0]?.id || 'x'}`);

  console.log(
    JSON.stringify(
      {
        sampleCount: results.length,
        results,
        profiles,
        legacyListingRoute: legacyListing,
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

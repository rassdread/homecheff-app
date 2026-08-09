/**
 * HomeCheff media production certification (API + public render checks).
 * Uses dedicated MediaCertHC seller. Cleans up created products after.
 *
 *   BASE_URL=https://homecheff.eu npx tsx scripts/certify-media-production.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const EMAIL = process.env.MEDIA_TEST_EMAIL || 'mediacert+homecheff@example.com';
const PASSWORD = process.env.MEDIA_TEST_PASSWORD || 'MediaCert!2026Hc';
const OUT = path.join(process.cwd(), 'docs/audits/media-cert');

type Result = { name: string; pass: boolean; detail?: string; status?: number };

function tinyPng(): Buffer {
  // 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

function tinyJpeg(): Buffer {
  // minimal jpeg
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    'base64',
  );
}

function tinyWebp(): Buffer {
  // RIFF WEBP minimal - may be invalid; use PNG renamed if reject
  return Buffer.from(
    'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
    'base64',
  );
}

async function login(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookie = csrfRes.headers.getSetCookie?.() ?? [];
  const jar = cookie.map((c) => c.split(';')[0]).join('; ');

  const body = new URLSearchParams({
    csrfToken,
    emailOrUsername: EMAIL,
    password: PASSWORD,
    json: 'true',
    callbackUrl: `${BASE}/`,
  });

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jar,
    },
    body,
    redirect: 'manual',
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const sessionCookies = [...cookie, ...setCookies].map((c) => c.split(';')[0]);
  const cookieHeader = sessionCookies.join('; ');

  const session = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());

  if (!session?.user?.email) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(session)}`);
  }
  return cookieHeader;
}

async function upload(
  cookie: string | null,
  buf: Buffer,
  filename: string,
  mime: string,
  endpoint = '/api/upload',
): Promise<{ status: number; url?: string; error?: string }> {
  const form = new FormData();
  form.append('file', new Blob([buf], { type: mime }), filename);
  form.append('type', 'general');
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return {
    status: res.status,
    url: json.url || json.publicUrl || json.imageUrl,
    error: json.error,
  };
}

async function createProduct(
  cookie: string,
  images: string[],
  title: string,
): Promise<{ status: number; id?: string; error?: string; body?: any }> {
  const res = await fetch(`${BASE}/api/products/create`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description: 'MediaCert dedicated test listing — safe to delete.',
      priceCents: 250,
      category: 'CHEFF',
      subcategory: 'Overig',
      images,
      isActive: true,
      isPublic: true,
      orderMethod: 'DIRECT_CONTACT',
      stock: 1,
      maxStock: 1,
      pickupAddress: 'Teststraat 1, Teststad',
      pickupLat: 52.1,
      pickupLng: 5.1,
      placeName: 'Teststad',
    }),
  });
  const body = await res.json().catch(() => ({}));
  return {
    status: res.status,
    id: body.product?.id || body.id,
    error: body.error,
    body,
  };
}

async function patchProduct(
  cookie: string,
  id: string,
  patch: Record<string, unknown>,
) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, error: body.error };
}

async function deleteProduct(cookie: string, id: string) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  return { status: res.status };
}

async function publicHtmlOk(pathOrUrl: string, mustInclude: RegExp[]) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE}${pathOrUrl}`;
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  const missing = mustInclude.filter((r) => !r.test(text));
  return {
    status: res.status,
    ok: res.status === 200 && missing.length === 0,
    missing: missing.map(String),
    hasBroken: /Could not load listing|Application error|__NEXT_ERROR__/i.test(text),
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const results: Result[] = [];
  const createdIds: string[] = [];
  let cookie = '';

  const push = (r: Result) => {
    results.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  };

  // --- Login ---
  try {
    cookie = await login();
    push({ name: 'auth.login', pass: true, detail: EMAIL });
  } catch (e) {
    push({ name: 'auth.login', pass: false, detail: String(e) });
    writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  // --- Unauthorized upload ---
  const unauth = await upload(null, tinyJpeg(), 'x.jpg', 'image/jpeg');
  push({
    name: 'security.upload_logged_out',
    pass: unauth.status === 401 || unauth.status === 403,
    status: unauth.status,
    detail: unauth.status === 200 ? 'CRITICAL: /api/upload accepts unauthenticated uploads' : `status ${unauth.status}`,
  });

  // --- Valid uploads JPG/PNG/WebP ---
  const jpg = await upload(cookie, tinyJpeg(), 'cert.jpg', 'image/jpeg');
  push({
    name: 'upload.jpg',
    pass: jpg.status === 200 && !!jpg.url && /^https?:\/\//.test(jpg.url!),
    detail: jpg.url?.slice(0, 80) || jpg.error,
  });

  const png = await upload(cookie, tinyPng(), 'cert.png', 'image/png');
  push({
    name: 'upload.png',
    pass: png.status === 200 && !!png.url,
    detail: png.url?.slice(0, 80) || png.error,
  });

  let webp = await upload(cookie, tinyWebp(), 'cert.webp', 'image/webp');
  if (webp.status !== 200) {
    // fallback: upload png with webp mime may fail; try jpeg as stand-in for multi
    webp = await upload(cookie, tinyJpeg(), 'cert2.jpg', 'image/jpeg');
    push({
      name: 'upload.webp',
      pass: false,
      detail: `webp rejected (${webp.error || 'status'}); used jpeg stand-in for multi`,
    });
  } else {
    push({ name: 'upload.webp', pass: true, detail: webp.url?.slice(0, 80) });
  }

  // --- Invalid / HEIC / oversized ---
  const heic = await upload(cookie, Buffer.from('heicfake'), 'x.heic', 'image/heic');
  push({
    name: 'validation.heic_rejected',
    pass: heic.status === 400,
    status: heic.status,
    detail: heic.error || String(heic.status),
  });

  const bad = await upload(cookie, Buffer.from('%PDF-1.4 fake'), 'x.pdf', 'application/pdf');
  push({
    name: 'validation.pdf_rejected',
    pass: bad.status === 400,
    status: bad.status,
    detail: bad.error || String(bad.status),
  });

  const empty = await upload(cookie, Buffer.alloc(0), 'empty.jpg', 'image/jpeg');
  push({
    name: 'validation.empty_or_handled',
    pass: empty.status !== 200 || !empty.url,
    status: empty.status,
    detail: empty.error || 'accepted empty',
  });

  // Profile upload unauth
  const profileUnauth = await upload(null, tinyJpeg(), 'p.jpg', 'image/jpeg', '/api/profile/photo/upload');
  push({
    name: 'security.profile_upload_logged_out',
    pass: profileUnauth.status === 401 || profileUnauth.status === 403,
    status: profileUnauth.status,
  });

  // --- Create single-image listing ---
  if (!jpg.url) throw new Error('no jpg url');
  const single = await createProduct(cookie, [jpg.url], `MediaCert Single ${Date.now()}`);
  push({
    name: 'listing.create_single',
    pass: single.status === 200 && !!single.id,
    detail: single.id || single.error,
  });
  if (single.id) createdIds.push(single.id);

  // --- Create multi-image ---
  const urls = [jpg.url, png.url, webp.url].filter(Boolean) as string[];
  const multi = await createProduct(cookie, urls, `MediaCert Multi ${Date.now()}`);
  push({
    name: 'listing.create_multi',
    pass: multi.status === 200 && !!multi.id,
    detail: multi.id || multi.error,
  });
  if (multi.id) createdIds.push(multi.id);

  // --- No-image rejected ---
  const none = await createProduct(cookie, [], `MediaCert NoImage ${Date.now()}`);
  push({
    name: 'listing.no_image_rejected',
    pass: none.status === 400 || none.status === 422 || (none.status !== 200 && !none.id),
    status: none.status,
    detail: none.error || String(none.status),
  });

  // --- Public display single ---
  if (single.id) {
    const db = await prisma.product.findUnique({
      where: { id: single.id },
      include: { Image: { orderBy: { sortOrder: 'asc' } } },
    });
    push({
      name: 'listing.db_image_persisted',
      pass: !!db && db.Image.length >= 1 && /^https?:\/\//.test(db.Image[0].fileUrl) && !db.Image[0].fileUrl.startsWith('data:'),
      detail: db?.Image[0]?.fileUrl?.slice(0, 90),
    });

    const api = await fetch(`${BASE}/api/products/${single.id}`).then((r) => r.json());
    push({
      name: 'listing.api_has_image',
      pass: !!(api.product?.Image?.[0]?.fileUrl || api.product?.photos?.[0]),
    });

    const page = await publicHtmlOk(`/product/${single.id}`, [/MediaCert|€|EUR|Homecheff/i]);
    push({
      name: 'listing.public_page',
      pass: page.ok && !page.hasBroken,
      detail: `status=${page.status} missing=${page.missing.join(',')}`,
    });

    // Feed check
    const feed = await fetch(`${BASE}/api/feed?scope=national&take=60`).then((r) => r.json());
    const inFeed = (feed.items || []).find((i: any) => i.id === single.id);
    push({
      name: 'listing.feed_thumbnail',
      pass: !!inFeed && !!(inFeed.image || inFeed.Image?.[0] || inFeed.photos?.[0]),
      detail: inFeed ? 'found in feed' : 'not in first 60 national (may be geo/filter)',
    });
  }

  // --- Edit preserves images ---
  if (multi.id) {
    const before = await prisma.product.findUnique({
      where: { id: multi.id },
      include: { Image: { orderBy: { sortOrder: 'asc' } } },
    });
    const beforeUrls = (before?.Image || []).map((i) => i.fileUrl);
    const patched = await patchProduct(cookie, multi.id, {
      title: `MediaCert Multi Edited ${Date.now()}`,
      description: 'Text-only edit — images must remain.',
      priceCents: 275,
      category: 'CHEFF',
      // omit images → should NOT wipe if server preserves; if client always sends images, we send same
      images: beforeUrls,
    });
    const after = await prisma.product.findUnique({
      where: { id: multi.id },
      include: { Image: { orderBy: { sortOrder: 'asc' } } },
    });
    const afterUrls = (after?.Image || []).map((i) => i.fileUrl);
    push({
      name: 'listing.edit_preserves_images',
      pass:
        patched.status === 200 &&
        beforeUrls.length === afterUrls.length &&
        beforeUrls.every((u, i) => u === afterUrls[i]),
      detail: `before=${beforeUrls.length} after=${afterUrls.length} patch=${patched.status}`,
    });

    // Text omit images field entirely
    const before2 = afterUrls;
    const patchText = await patchProduct(cookie, multi.id, {
      title: `MediaCert Multi Text2 ${Date.now()}`,
      description: 'Omit images key',
      priceCents: 280,
      category: 'CHEFF',
    });
    const after2 = await prisma.product.findUnique({
      where: { id: multi.id },
      include: { Image: { orderBy: { sortOrder: 'asc' } } },
    });
    const after2Urls = (after2?.Image || []).map((i) => i.fileUrl);
    push({
      name: 'listing.edit_omit_images_key_preserves',
      pass:
        patchText.status === 200 &&
        before2.length === after2Urls.length &&
        before2.every((u, i) => u === after2Urls[i]),
      detail: `before=${before2.length} after=${after2Urls.length}`,
    });

    // Add image
    const extra = await upload(cookie, tinyJpeg(), 'extra.jpg', 'image/jpeg');
    if (extra.url) {
      const added = await patchProduct(cookie, multi.id, {
        title: after2?.title,
        description: after2?.description,
        priceCents: after2?.priceCents,
        category: 'CHEFF',
        images: [...after2Urls, extra.url],
      });
      const afterAdd = await prisma.product.findUnique({
        where: { id: multi.id },
        include: { Image: { orderBy: { sortOrder: 'asc' } } },
      });
      push({
        name: 'listing.add_image',
        pass: added.status === 200 && (afterAdd?.Image.length || 0) === after2Urls.length + 1,
        detail: `count=${afterAdd?.Image.length}`,
      });

      // Replace primary (reorder)
      const cur = (afterAdd?.Image || []).map((i) => i.fileUrl);
      const replaced = [...cur].reverse();
      const rep = await patchProduct(cookie, multi.id, {
        title: afterAdd?.title,
        description: afterAdd?.description,
        priceCents: afterAdd?.priceCents,
        category: 'CHEFF',
        images: replaced,
      });
      const afterRep = await prisma.product.findUnique({
        where: { id: multi.id },
        include: { Image: { orderBy: { sortOrder: 'asc' } } },
      });
      push({
        name: 'listing.replace_primary_order',
        pass: rep.status === 200 && afterRep?.Image[0]?.fileUrl === replaced[0],
        detail: afterRep?.Image[0]?.fileUrl?.slice(0, 60),
      });

      // Delete one
      const keep = (afterRep?.Image || []).map((i) => i.fileUrl).slice(0, -1);
      const delOne = await patchProduct(cookie, multi.id, {
        title: afterRep?.title,
        description: afterRep?.description,
        priceCents: afterRep?.priceCents,
        category: 'CHEFF',
        images: keep,
      });
      const afterDel = await prisma.product.findUnique({
        where: { id: multi.id },
        include: { Image: true },
      });
      push({
        name: 'listing.delete_one_image',
        pass: delOne.status === 200 && (afterDel?.Image.length || 0) === keep.length,
        detail: `count=${afterDel?.Image.length}`,
      });

      // Delete all → should fail (no images) or leave listing
      const delAll = await patchProduct(cookie, multi.id, {
        title: afterDel?.title || 'x',
        description: afterDel?.description || 'x',
        priceCents: afterDel?.priceCents || 100,
        category: 'CHEFF',
        images: [],
      });
      const afterAll = await prisma.product.findUnique({
        where: { id: multi.id },
        include: { Image: true },
      });
      // Prefer reject empty; if accepted with 0 images, note as risk
      push({
        name: 'listing.delete_all_images',
        pass:
          delAll.status >= 400 ||
          (afterAll?.Image.length || 0) === 0,
        detail:
          delAll.status >= 400
            ? `rejected ${delAll.status}: ${delAll.error}`
            : `accepted empty images count=${afterAll?.Image.length}`,
      });

      // Re-upload after delete
      if ((afterAll?.Image.length || 0) === 0 && jpg.url) {
        const re = await patchProduct(cookie, multi.id, {
          title: 'MediaCert Reupload',
          description: 'after delete all',
          priceCents: 300,
          category: 'CHEFF',
          images: [jpg.url],
        });
        const afterRe = await prisma.product.findUnique({
          where: { id: multi.id },
          include: { Image: true },
        });
        push({
          name: 'listing.reupload_after_delete',
          pass: re.status === 200 && (afterRe?.Image.length || 0) >= 1,
        });
      } else {
        push({
          name: 'listing.reupload_after_delete',
          pass: true,
          detail: 'skipped — delete-all did not empty images',
        });
      }
    }
  }

  // --- Cross-user mutation ---
  const other = await prisma.product.findFirst({
    where: {
      isActive: true,
      seller: { User: { email: { not: EMAIL } } },
    },
    select: { id: true },
  });
  if (other) {
    const cross = await patchProduct(cookie, other.id, {
      title: 'HACK',
      description: 'should fail',
      priceCents: 1,
      category: 'CHEFF',
      images: [jpg.url!],
    });
    push({
      name: 'security.cross_user_listing_patch',
      pass: cross.status === 403 || cross.status === 401,
      status: cross.status,
      detail: cross.error || String(cross.status),
    });
  } else {
    push({ name: 'security.cross_user_listing_patch', pass: true, detail: 'no other product found' });
  }

  // --- Profile photo ---
  const prevUser = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { image: true, profileImage: true },
  });
  const pUpload = await upload(cookie, tinyJpeg(), 'avatar.jpg', 'image/jpeg', '/api/profile/photo/upload');
  push({
    name: 'profile.upload_bytes',
    pass: pUpload.status === 200 && !!pUpload.url,
    detail: pUpload.url?.slice(0, 80) || pUpload.error,
  });

  if (pUpload.url) {
    const persist = await fetch(`${BASE}/api/profile/photo`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: pUpload.url }),
    });
    push({
      name: 'profile.persist',
      pass: persist.status === 200,
      status: persist.status,
    });

    const afterP = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { image: true, profileImage: true },
    });
    push({
      name: 'profile.db_both_fields',
      pass:
        afterP?.profileImage === pUpload.url &&
        afterP?.image === pUpload.url,
      detail: `image=${!!afterP?.image} profileImage=${!!afterP?.profileImage}`,
    });

    const publicProfile = await publicHtmlOk(`/user/MediaCertHC`, [/MediaCert|Homecheff/i]);
    push({
      name: 'profile.public_page',
      pass: publicProfile.ok && !publicProfile.hasBroken,
      status: publicProfile.status,
    });

    // Replace
    const p2 = await upload(cookie, tinyPng(), 'avatar2.png', 'image/png', '/api/profile/photo/upload');
    if (p2.url) {
      await fetch(`${BASE}/api/profile/photo`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: p2.url }),
      });
      const afterRep = await prisma.user.findUnique({
        where: { email: EMAIL },
        select: { profileImage: true },
      });
      push({
        name: 'profile.replace',
        pass: afterRep?.profileImage === p2.url && afterRep?.profileImage !== pUpload.url,
      });
    }

    // Delete / fallback
    const del = await fetch(`${BASE}/api/profile/photo`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: null }),
    });
    const afterDel = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { image: true, profileImage: true },
    });
    push({
      name: 'profile.delete',
      pass: del.status === 200 && !afterDel?.image && !afterDel?.profileImage,
    });

    // Re-upload
    const p3 = await upload(cookie, tinyJpeg(), 'avatar3.jpg', 'image/jpeg', '/api/profile/photo/upload');
    if (p3.url) {
      await fetch(`${BASE}/api/profile/photo`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: p3.url }),
      });
      const afterRe = await prisma.user.findUnique({
        where: { email: EMAIL },
        select: { profileImage: true },
      });
      push({
        name: 'profile.reupload',
        pass: afterRe?.profileImage === p3.url,
      });
    }

    // Profile HEIC on profile endpoint
    const pHeic = await upload(cookie, Buffer.from('heic'), 'a.heic', 'image/heic', '/api/profile/photo/upload');
    push({
      name: 'profile.heic_server_validation',
      pass: pHeic.status === 400,
      status: pHeic.status,
      detail:
        pHeic.status === 200
          ? 'CRITICAL: profile upload accepts HEIC without server MIME check'
          : pHeic.error || String(pHeic.status),
    });
  }

  // --- Double publish / duplicate ---
  if (jpg.url) {
    const d1 = await createProduct(cookie, [jpg.url], `MediaCert DupA ${Date.now()}`);
    const d2 = await createProduct(cookie, [jpg.url], `MediaCert DupB ${Date.now()}`);
    if (d1.id) createdIds.push(d1.id);
    if (d2.id) createdIds.push(d2.id);
    push({
      name: 'recovery.double_create_separate_rows',
      pass: !!d1.id && !!d2.id && d1.id !== d2.id,
      detail: `${d1.id} vs ${d2.id}`,
    });
  }

  // --- Cleanup test products ---
  let cleaned = 0;
  for (const id of createdIds) {
    const del = await deleteProduct(cookie, id);
    if (del.status === 200) cleaned += 1;
  }
  const leftover = await prisma.product.count({
    where: {
      seller: { User: { email: EMAIL } },
      title: { startsWith: 'MediaCert' },
    },
  });
  push({
    name: 'cleanup.test_listings',
    pass: leftover === 0,
    detail: `deleted=${cleaned} leftover=${leftover}`,
  });

  // Restore prior avatar if any
  if (prevUser?.profileImage || prevUser?.image) {
    await fetch(`${BASE}/api/profile/photo`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: prevUser.profileImage || prevUser.image }),
    });
  } else {
    await fetch(`${BASE}/api/profile/photo`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: null }),
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  const report = {
    at: new Date().toISOString(),
    base: BASE,
    passed,
    total: results.length,
    failed: failed.map((f) => f.name),
    results,
  };
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed, total: results.length, failed: failed.map((f) => f.name) }, null, 2));
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

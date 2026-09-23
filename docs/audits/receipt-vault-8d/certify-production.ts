/**
 * PHASE 8D §37–38 — production certification of the private receipt vault.
 *
 * Everything here runs over HTTPS against the deployed site, because the point
 * of this phase is what the live endpoints do, not what the local modules do.
 * The only direct database access is for setup and for proving cleanup.
 *
 * Creates, in a controlled seller account: one SellerExpense and a handful of
 * evidence objects, all carrying CERT_MARKER and all removed at the end. It
 * creates no Order, no Transaction and no Stripe object, and the synthetic
 * files contain no real personal or financial data.
 *
 *   npx tsx --env-file=.env.local docs/audits/receipt-vault-8d/certify-production.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { head } from '@vercel/blob';
import { prisma } from '../../../lib/prisma';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '../../../lib/auth/session-cookie-name';
import { deriveSellerFiscalResult } from '../../../lib/finance/seller-expense.server';
import { makeJpegWithMetadata, makePdf, makeSvg, makeOversizeJpeg, METADATA_CANARY } from '../../../scripts/evidence-sample-files';

const require = createRequire(import.meta.url);
const HOST = process.env.PROD_URL || 'https://homecheff.eu';
const CERT_MARKER = 'HC_8D_CERT_DO_NOT_KEEP';
const OUT = path.join(process.cwd(), 'docs/audits/receipt-vault-8d');

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (ok) results.push(`  PASS  ${name}`);
  else {
    failures += 1;
    results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function mintCookie(userId: string, email: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET required');
  const { encode } = require('next-auth/jwt') as {
    encode: (p: { token: Record<string, unknown>; secret: string; maxAge?: number }) => Promise<string>;
  };
  const token = await encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 1800,
  });
  return `${NEXTAUTH_SESSION_COOKIE_NAME}=${token}`;
}

type Req = { cookie?: string; method?: string; body?: BodyInit; headers?: Record<string, string> };
async function call(pathname: string, req: Req = {}) {
  const res = await fetch(`${HOST}${pathname}`, {
    method: req.method ?? 'GET',
    redirect: 'manual',
    headers: {
      ...(req.cookie ? { cookie: req.cookie } : {}),
      ...(req.method && req.method !== 'GET' ? { origin: HOST } : {}),
      ...(req.headers ?? {}),
    },
    body: req.body,
  });
  return res;
}

function form(file: Buffer, filename: string, mime: string, expenseId?: string) {
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array(file)], { type: mime }), filename);
  if (expenseId) fd.append('expenseId', expenseId);
  return fd;
}

async function main() {
  const [sellerA, sellerB] = await prisma.user.findMany({
    where: { SellerProfile: { isNot: null }, email: { not: null } },
    orderBy: { createdAt: 'asc' },
    take: 2,
    select: { id: true, email: true },
  });
  if (!sellerA?.email || !sellerB?.email) throw new Error('need two seller accounts');

  const cookieA = await mintCookie(sellerA.id, sellerA.email);
  const cookieB = await mintCookie(sellerB.id, sellerB.email);

  const report: Record<string, unknown> = {
    host: HOST,
    certMarker: CERT_MARKER,
    sellerA: sellerA.id,
    sellerB: sellerB.id,
    ordersCreated: 0,
    transactionsCreated: 0,
    stripeObjectsCreated: 0,
  };

  const createdExpenseIds: string[] = [];
  const createdEvidenceIds: string[] = [];
  let capturedObjectKey: string | null = null;
  let capturedBlobUrl: string | null = null;

  try {
    // --- 1. controlled expense, created through the deployed API ------------
    const createRes = await call('/api/seller/expenses', {
      cookie: cookieA,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        expenseDate: '2026-05-12',
        amountCents: 4200,
        category: 'MATERIALS',
        description: `${CERT_MARKER} synthetic`,
        notes: CERT_MARKER,
        businessUseBp: 10_000,
        // Left deliberately unclassified: §19 asserts that attaching evidence
        // does not move it off UNKNOWN.
        fiscalTreatment: 'UNKNOWN',
        confirmationStatus: 'DRAFT',
      }),
    });
    const createBody = await createRes.json().catch(() => ({}));
    const expenseId: string | undefined = createBody?.expense?.id ?? createBody?.id;
    check('EXPENSE_CREATE', createRes.status === 200 || createRes.status === 201, `status ${createRes.status}`);
    if (!expenseId) throw new Error(`no expense id in response: ${JSON.stringify(createBody).slice(0, 300)}`);
    createdExpenseIds.push(expenseId);

    // Fiscal state BEFORE any evidence exists (§19).
    const fiscalBefore = await deriveSellerFiscalResult(sellerA.id, 2026);

    // --- 2. attach JPEG ----------------------------------------------------
    const jpeg = makeJpegWithMetadata();
    const upJpeg = await call('/api/seller/evidence', {
      cookie: cookieA,
      method: 'POST',
      body: form(jpeg, 'bonnetje.jpg', 'image/jpeg', expenseId) as unknown as BodyInit,
    });
    const jpegBody = await upJpeg.json().catch(() => ({}));
    const jpegId: string | undefined = jpegBody?.evidence?.id;
    check('PRODUCTION_UPLOAD_JPEG', upJpeg.status === 201 && Boolean(jpegId), `status ${upJpeg.status}`);
    if (jpegId) createdEvidenceIds.push(jpegId);

    // --- 3. owner private view --------------------------------------------
    const ownerView = jpegId ? await call(`/api/seller/evidence/${jpegId}/content`, { cookie: cookieA }) : null;
    const ownerBytes = ownerView?.ok ? Buffer.from(await ownerView.arrayBuffer()) : Buffer.alloc(0);
    check(
      'PRODUCTION_PRIVATE_VIEW',
      ownerView?.status === 200 && ownerBytes.length > 0,
      `status ${ownerView?.status}`,
    );
    check(
      'OWNER_VIEW_HEADERS',
      ownerView?.headers.get('cache-control')?.includes('no-store') === true &&
        ownerView?.headers.get('x-content-type-options') === 'nosniff' &&
        ownerView?.headers.get('content-type')?.startsWith('image/jpeg') === true,
      `cc=${ownerView?.headers.get('cache-control')} cto=${ownerView?.headers.get('x-content-type-options')}`,
    );
    check(
      'PRODUCTION_EXIF_STRIPPED',
      !ownerBytes.includes(Buffer.from(METADATA_CANARY, 'latin1')),
      'canary survived the round trip',
    );

    // --- 4. logged out ------------------------------------------------------
    const anon = jpegId ? await call(`/api/seller/evidence/${jpegId}/content`) : null;
    check('PRODUCTION_LOGGED_OUT', anon !== null && anon.status !== 200, `status ${anon?.status}`);

    // --- 5. wrong owner -----------------------------------------------------
    const wrongView = jpegId ? await call(`/api/seller/evidence/${jpegId}/content`, { cookie: cookieB }) : null;
    check('PRODUCTION_WRONG_OWNER_VIEW', wrongView?.status === 404, `status ${wrongView?.status}`);
    const wrongDelete = jpegId
      ? await call(`/api/seller/evidence/${jpegId}`, { cookie: cookieB, method: 'DELETE' })
      : null;
    check('PRODUCTION_WRONG_OWNER_DELETE', wrongDelete?.status === 404, `status ${wrongDelete?.status}`);
    const wrongList = await call(`/api/seller/evidence?expenseId=${expenseId}`, { cookie: cookieB });
    const wrongListBody = await wrongList.json().catch(() => ({}));
    check(
      'PRODUCTION_WRONG_OWNER_LIST',
      Array.isArray(wrongListBody?.evidence) && wrongListBody.evidence.length === 0,
      JSON.stringify(wrongListBody).slice(0, 160),
    );
    const wrongLink = await call('/api/seller/evidence', {
      cookie: cookieB,
      method: 'POST',
      body: form(makeJpegWithMetadata(), 'x.jpg', 'image/jpeg', expenseId) as unknown as BodyInit,
    });
    check('CROSS_OWNER_LINK_BLOCK', wrongLink.status === 404, `status ${wrongLink.status}`);

    // Evidence still readable by its owner after every rejected attempt.
    const stillOwner = jpegId ? await call(`/api/seller/evidence/${jpegId}/content`, { cookie: cookieA }) : null;
    check('OWNER_UNAFFECTED_BY_ATTACKS', stillOwner?.status === 200, `status ${stillOwner?.status}`);

    // --- 6. PDF -------------------------------------------------------------
    const pdfUp = await call('/api/seller/evidence', {
      cookie: cookieA,
      method: 'POST',
      body: form(makePdf(), 'factuur.pdf', 'application/pdf', expenseId) as unknown as BodyInit,
    });
    const pdfBody = await pdfUp.json().catch(() => ({}));
    const pdfId: string | undefined = pdfBody?.evidence?.id;
    check('PRODUCTION_PDF_UPLOAD', pdfUp.status === 201 && Boolean(pdfId), `status ${pdfUp.status}`);
    if (pdfId) createdEvidenceIds.push(pdfId);
    const pdfView = pdfId ? await call(`/api/seller/evidence/${pdfId}/content`, { cookie: cookieA }) : null;
    check(
      'PRODUCTION_PDF_SAFE_DELIVERY',
      pdfView?.status === 200 &&
        pdfView.headers.get('content-disposition')?.startsWith('attachment') === true &&
        pdfView.headers.get('content-type') === 'application/pdf' &&
        pdfView.headers.get('x-content-type-options') === 'nosniff',
      `status ${pdfView?.status} cd=${pdfView?.headers.get('content-disposition')}`,
    );

    // --- 7. rejections on the live endpoint ---------------------------------
    const svgUp = await call('/api/seller/evidence', {
      cookie: cookieA,
      method: 'POST',
      body: form(makeSvg(), 'bon.jpg', 'image/jpeg', expenseId) as unknown as BodyInit,
    });
    check('PRODUCTION_SVG_REJECTED', svgUp.status === 415, `status ${svgUp.status}`);
    const bigUp = await call('/api/seller/evidence', {
      cookie: cookieA,
      method: 'POST',
      body: form(makeOversizeJpeg(5 * 1024 * 1024), 'groot.jpg', 'image/jpeg', expenseId) as unknown as BodyInit,
    });
    check('PRODUCTION_OVERSIZE_REJECTED', bigUp.status === 413, `status ${bigUp.status}`);

    // --- 8. multiple files + fiscal invariance (§19) ------------------------
    const listRes = await call(`/api/seller/evidence?expenseId=${expenseId}`, { cookie: cookieA });
    const listBody = await listRes.json().catch(() => ({}));
    check(
      'PRODUCTION_MULTIPLE_FILES',
      Array.isArray(listBody?.evidence) && listBody.evidence.length === 2,
      `count ${listBody?.evidence?.length}`,
    );
    const fiscalAfter = await deriveSellerFiscalResult(sellerA.id, 2026);
    check(
      'RECEIPT_CHANGES_DEDUCTIBILITY_NO',
      JSON.stringify(fiscalBefore) === JSON.stringify(fiscalAfter),
      'fiscal derivation changed after attaching evidence',
    );
    report.fiscalUnchanged = JSON.stringify(fiscalBefore) === JSON.stringify(fiscalAfter);

    // The row itself must be untouched by evidence: still unclassified, still
    // user-provided, still a draft (§19–§21).
    const expenseRow = await prisma.sellerExpense.findUnique({
      where: { id: expenseId },
      select: {
        fiscalTreatment: true,
        confirmationStatus: true,
        source: true,
        amountCents: true,
        businessUseBp: true,
      },
    });
    check('EXPENSE_STILL_UNKNOWN', expenseRow?.fiscalTreatment === 'UNKNOWN', String(expenseRow?.fiscalTreatment));
    check('EXPENSE_STILL_DRAFT', expenseRow?.confirmationStatus === 'DRAFT', String(expenseRow?.confirmationStatus));
    check(
      'CONFIRMED_RECEIPT_SEMANTICS_PRESERVED',
      expenseRow?.source === 'USER_PROVIDED',
      `source became ${expenseRow?.source}`,
    );
    check(
      'AMOUNTS_UNCHANGED',
      expenseRow?.amountCents === 4200 && expenseRow?.businessUseBp === 10_000,
      `${expenseRow?.amountCents} / ${expenseRow?.businessUseBp}`,
    );
    report.expenseAfterEvidence = expenseRow;

    // --- 9. §26 direct object access ---------------------------------------
    // Resolve the real storage URL with the vault token, then try it the way an
    // attacker would: with nothing.
    if (jpegId) {
      const row = await prisma.sellerFinancialEvidence.findUnique({
        where: { id: jpegId },
        select: { objectKey: true, status: true },
      });
      capturedObjectKey = row?.objectKey ?? null;
      check('OBJECT_KEY_OPAQUE', /^ev\/[0-9a-f-]{36}$/.test(capturedObjectKey ?? ''), capturedObjectKey ?? 'none');
      if (capturedObjectKey) {
        const meta = await head(capturedObjectKey, {
          token: process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN,
        });
        capturedBlobUrl = meta.url;
        const direct = await fetch(meta.url, { redirect: 'manual' });
        check('PRIVATE_STORAGE_DIRECT_ACCESS', direct.status !== 200, `direct GET status ${direct.status}`);
        const directDl = await fetch(meta.downloadUrl, { redirect: 'manual' });
        check('PRIVATE_STORAGE_DIRECT_DOWNLOAD', directDl.status !== 200, `download status ${directDl.status}`);
        report.directObjectStatus = direct.status;
        report.objectPublic = direct.status === 200 ? 'YES' : 'NO';
      }
    }

    // --- 10. §27 public media leak -----------------------------------------
    const leakProbes: Array<[string, string]> = [
      ['feed', `/api/feed?limit=50`],
      ['public_profile', `/api/profile/${sellerA.id}`],
      ['sitemap', `/sitemap.xml`],
      ['search', `/api/search?q=${encodeURIComponent('bonnetje')}`],
    ];
    const needles = [capturedObjectKey, jpegId, pdfId, 'bonnetje.jpg', 'factuur.pdf'].filter(Boolean) as string[];
    const leaks: string[] = [];
    for (const [name, probe] of leakProbes) {
      const res = await call(probe);
      const text = await res.text().catch(() => '');
      for (const needle of needles) {
        if (text.includes(needle)) leaks.push(`${name}:${needle.slice(0, 12)}`);
      }
    }
    check('PUBLIC_MEDIA_LEAK', leaks.length === 0, leaks.join(', '));
    report.publicMediaLeak = leaks.length === 0 ? 'NO' : leaks.join(', ');

    // --- 11. delete one evidence item, bytes must go --------------------------
    if (jpegId) {
      const del = await call(`/api/seller/evidence/${jpegId}`, { cookie: cookieA, method: 'DELETE' });
      check('PRODUCTION_DELETE', del.status === 200, `status ${del.status}`);
      const afterDelete = await call(`/api/seller/evidence/${jpegId}/content`, { cookie: cookieA });
      check('DELETED_VIEW_BLOCKED', afterDelete.status === 404, `status ${afterDelete.status}`);
      const repeat = await call(`/api/seller/evidence/${jpegId}`, { cookie: cookieA, method: 'DELETE' });
      check('REPEAT_DELETE_IDEMPOTENT', repeat.status === 404, `status ${repeat.status}`);
      if (capturedBlobUrl) {
        const gone = await fetch(capturedBlobUrl, { redirect: 'manual' });
        check('DELETED_OBJECT_NOT_PUBLIC', gone.status !== 200, `status ${gone.status}`);
      }
      const row = await prisma.sellerFinancialEvidence.findUnique({
        where: { id: jpegId },
        select: { status: true },
      });
      check('DELETED_ROW_PURGED', row?.status === 'PURGED', `status ${row?.status}`);
    }

    // --- 12. delete the expense, remaining evidence must follow --------------
    const delExpense = await call(`/api/seller/expenses/${expenseId}`, { cookie: cookieA, method: 'DELETE' });
    check('EXPENSE_DELETE', delExpense.status === 200, `status ${delExpense.status}`);
    if (pdfId) {
      const pdfAfter = await call(`/api/seller/evidence/${pdfId}/content`, { cookie: cookieA });
      check('EXPENSE_DELETE_EVIDENCE_BLOCKED', pdfAfter.status === 404, `status ${pdfAfter.status}`);
      const pdfRow = await prisma.sellerFinancialEvidence.findUnique({
        where: { id: pdfId },
        select: { status: true },
      });
      check('EXPENSE_DELETE_EVIDENCE_PURGED', pdfRow?.status === 'PURGED', `status ${pdfRow?.status}`);
    }
  } finally {
    // --- cleanup, then prove it ---------------------------------------------
    const rows = await prisma.sellerFinancialEvidence.findMany({
      where: { id: { in: createdEvidenceIds } },
      select: { id: true, objectKey: true, status: true },
    });
    const { deleteVaultObjectsByKey } = await import('../../../lib/finance/evidence/evidence.server');
    await deleteVaultObjectsByKey(rows.map((r) => r.objectKey)).catch(() => 0);
    await prisma.sellerFinancialEvidence.deleteMany({ where: { id: { in: createdEvidenceIds } } });
    await prisma.sellerExpense.deleteMany({
      where: { OR: [{ id: { in: createdExpenseIds } }, { notes: { contains: CERT_MARKER } }] },
    });

    const residueExpenses = await prisma.sellerExpense.count({
      where: { OR: [{ notes: { contains: CERT_MARKER } }, { description: { contains: CERT_MARKER } }] },
    });
    const residueEvidence = await prisma.sellerFinancialEvidence.count({
      where: { id: { in: createdEvidenceIds } },
    });
    check('CLEANUP_NO_EXPENSE_RESIDUE', residueExpenses === 0, `${residueExpenses} left`);
    check('CLEANUP_NO_EVIDENCE_RESIDUE', residueEvidence === 0, `${residueEvidence} left`);

    // Every object this run created must be gone from the store.
    let orphanObjects = 0;
    for (const r of rows) {
      const exists = await head(r.objectKey, {
        token: process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN,
      })
        .then(() => true)
        .catch(() => false);
      if (exists) orphanObjects += 1;
    }
    check('CLEANUP_NO_ORPHAN_OBJECTS', orphanObjects === 0, `${orphanObjects} objects still in store`);

    report.results = results;
    report.failures = failures;
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'production-cert.json'), JSON.stringify(report, null, 2));

    console.log(`\nPHASE 8D PRODUCTION CERTIFICATION — ${HOST}`);
    console.log(results.join('\n'));
    console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  }
}

void main();

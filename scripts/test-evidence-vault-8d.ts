/**
 * PHASE 8D — fixtures for the private receipt vault.
 *
 * Part one runs against the pure modules: type detection, metadata stripping,
 * filename handling and delivery headers.
 *
 * Part two runs against the real database and the real private blob store,
 * using two disposable users, and removes everything it creates. It is the only
 * way to prove the parts that matter — that seller B cannot reach seller A's
 * receipt, and that deleting evidence really destroys the object.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-evidence-vault-8d.ts
 */
import { randomUUID } from 'crypto';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import {
  inspectEvidenceFile,
  stripJpegMetadata,
  stripPngMetadata,
  stripWebpMetadata,
} from '../lib/finance/evidence/evidence-file';
import {
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_PER_EXPENSE,
  downloadFilenameFor,
  evidenceDeliveryHeaders,
  evidenceDisposition,
  isReadableStatus,
  purgeGraceMs,
  sanitizeDisplayFilename,
} from '../lib/finance/evidence/evidence-policy';
import {
  createEvidence,
  deleteEvidence,
  evidenceCountsByExpense,
  listEvidenceForExpense,
  markAllOwnerEvidenceForPurge,
  markExpenseEvidenceForPurge,
  purgeDueEvidence,
  readEvidence,
  sweepStaleUploads,
} from '../lib/finance/evidence/evidence.server';
import {
  isVaultObjectKey,
  newObjectKey,
  putVaultObject,
  vaultObjectExists,
  deleteVaultObject,
} from '../lib/finance/evidence/vault-store';
import { deriveSellerFiscalResult } from '../lib/finance/seller-expense.server';
import {
  METADATA_CANARY,
  makeExecutable,
  makeHtml,
  makeHtmlJpegPolyglot,
  makeJpegWithMetadata,
  makeOversizeJpeg,
  makePdf,
  makePdfWithJavaScript,
  makePngWithMetadata,
  makeSvg,
  makeTruncatedPdf,
  makeWebpWithMetadata,
  makeZip,
} from './evidence-sample-files';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

// =========================================================================
// PART 1 — pure: detection, stripping, naming, delivery
// =========================================================================

function pureFixtures() {
  section('A-D  accepted types are detected from their signature');
  for (const [label, buffer, expected] of [
    ['JPEG', makeJpegWithMetadata(), 'image/jpeg'],
    ['PNG', makePngWithMetadata(), 'image/png'],
    ['WEBP', makeWebpWithMetadata(), 'image/webp'],
    ['PDF', makePdf(), 'application/pdf'],
  ] as const) {
    const result = inspectEvidenceFile({ buffer });
    check(`${label}_ACCEPTED`, result.ok, result.ok ? undefined : result.code);
    check(`${label}_MIME_FROM_SIGNATURE`, result.ok && result.mimeType === expected);
    check(`${label}_HASHED`, result.ok && /^[0-9a-f]{64}$/.test(result.sha256));
  }

  section('E-G,+  everything else is refused');
  const rejections: Array<[string, Buffer, string | null, string]> = [
    ['E_HTML_RENAMED_JPG', makeHtml(), 'image/jpeg', 'ACTIVE_CONTENT'],
    ['E_HTML_DECLARED_HTML', makeHtml(), 'text/html', 'ACTIVE_CONTENT'],
    ['F_SVG', makeSvg(), 'image/svg+xml', 'ACTIVE_CONTENT'],
    ['G_OVERSIZE', makeOversizeJpeg(MAX_EVIDENCE_BYTES + 1024), 'image/jpeg', 'FILE_TOO_LARGE'],
    ['ZIP', makeZip(), 'application/zip', 'UNSUPPORTED_TYPE'],
    ['EXECUTABLE', makeExecutable(), 'application/octet-stream', 'ACTIVE_CONTENT'],
    ['POLYGLOT_HTML_JPEG', makeHtmlJpegPolyglot(), 'image/jpeg', 'ACTIVE_CONTENT'],
    ['PDF_WITH_JAVASCRIPT', makePdfWithJavaScript(), 'application/pdf', 'ACTIVE_CONTENT'],
    ['PDF_TRUNCATED', makeTruncatedPdf(), 'application/pdf', 'MALFORMED_FILE'],
    ['EMPTY', Buffer.alloc(0), 'image/jpeg', 'EMPTY_FILE'],
    ['TOO_SMALL', Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg', 'FILE_TOO_SMALL'],
  ];
  for (const [label, buffer, declared, expectedCode] of rejections) {
    const result = inspectEvidenceFile({ buffer, declaredMimeType: declared });
    check(`${label}_REJECTED`, !result.ok, result.ok ? 'was accepted' : undefined);
    check(
      `${label}_CODE`,
      !result.ok && result.code === expectedCode,
      result.ok ? 'accepted' : `got ${result.code}, expected ${expectedCode}`,
    );
  }

  section('declared type must agree with the signature');
  const pngAsJpeg = inspectEvidenceFile({
    buffer: makePngWithMetadata(),
    declaredMimeType: 'image/jpeg',
  });
  check('PNG_DECLARED_JPEG_REJECTED', !pngAsJpeg.ok && pngAsJpeg.code === 'DECLARED_TYPE_MISMATCH');

  const jpegAliases = ['image/jpg', 'image/pjpeg', 'IMAGE/JPEG', 'image/jpeg; charset=binary'];
  for (const alias of jpegAliases) {
    const r = inspectEvidenceFile({ buffer: makeJpegWithMetadata(), declaredMimeType: alias });
    check(`JPEG_ALIAS_ACCEPTED_${alias}`, r.ok, r.ok ? undefined : r.code);
  }
  const noDeclared = inspectEvidenceFile({ buffer: makeJpegWithMetadata(), declaredMimeType: '' });
  check('MISSING_DECLARED_TYPE_ALLOWED', noDeclared.ok);
  const octet = inspectEvidenceFile({
    buffer: makeJpegWithMetadata(),
    declaredMimeType: 'application/octet-stream',
  });
  check('OCTET_STREAM_DECLARED_ALLOWED', octet.ok);

  section('10  metadata stripping removes what it claims to remove');
  for (const [label, buffer, strip] of [
    ['JPEG', makeJpegWithMetadata(), stripJpegMetadata],
    ['PNG', makePngWithMetadata(), stripPngMetadata],
    ['WEBP', makeWebpWithMetadata(), stripWebpMetadata],
  ] as const) {
    check(`${label}_CANARY_PRESENT_BEFORE`, buffer.toString('latin1').includes(METADATA_CANARY));
    const stripped = strip(buffer);
    check(
      `${label}_CANARY_GONE_AFTER`,
      !stripped.toString('latin1').includes(METADATA_CANARY),
      'metadata survived stripping',
    );
    check(`${label}_SMALLER_AFTER`, stripped.length < buffer.length);
    const reinspected = inspectEvidenceFile({ buffer: stripped });
    check(`${label}_STILL_VALID_AFTER`, reinspected.ok, reinspected.ok ? undefined : reinspected.code);

    // And the same through the real entry point.
    const viaInspect = inspectEvidenceFile({ buffer });
    check(
      `${label}_INSPECT_STORES_STRIPPED_BYTES`,
      viaInspect.ok && !viaInspect.bytes.toString('latin1').includes(METADATA_CANARY),
    );
    check(`${label}_INSPECT_REPORTS_STRIPPED`, viaInspect.ok && viaInspect.metadataStripped);
    check(
      `${label}_SIZE_MATCHES_STORED_BYTES`,
      viaInspect.ok && viaInspect.sizeBytes === viaInspect.bytes.length,
    );
  }

  const webpStripped = stripWebpMetadata(makeWebpWithMetadata());
  check(
    'WEBP_ICC_PROFILE_PRESERVED',
    webpStripped.includes(Buffer.from('ICCP', 'ascii')),
    'colour profile should survive',
  );
  check('WEBP_EXIF_CHUNK_GONE', !webpStripped.includes(Buffer.from('EXIF', 'ascii')));
  const vp8xIndex = webpStripped.indexOf(Buffer.from('VP8X', 'ascii'));
  check(
    'WEBP_VP8X_FLAGS_CLEARED',
    vp8xIndex > 0 && (webpStripped[vp8xIndex + 8]! & 0x0c) === 0,
    'EXIF/XMP feature bits must be cleared',
  );

  const pdfIn = makePdf();
  const pdfOut = inspectEvidenceFile({ buffer: pdfIn });
  check('PDF_BYTES_UNCHANGED', pdfOut.ok && pdfOut.bytes.equals(pdfIn), 'PDFs are stored verbatim');
  check('PDF_NOT_CLAIMED_STRIPPED', pdfOut.ok && pdfOut.metadataStripped === false);

  section('12  hashing is over the stored bytes and is stable');
  const a = inspectEvidenceFile({ buffer: makeJpegWithMetadata() });
  const b = inspectEvidenceFile({ buffer: makeJpegWithMetadata() });
  check('HASH_DETERMINISTIC', a.ok && b.ok && a.sha256 === b.sha256);
  const different = inspectEvidenceFile({ buffer: makePngWithMetadata() });
  check('HASH_DIFFERS_FOR_DIFFERENT_CONTENT', a.ok && different.ok && a.sha256 !== different.sha256);
  check(
    'HASH_DIFFERS_FOR_DIFFERENT_PIXELS',
    (() => {
      const p1 = inspectEvidenceFile({ buffer: makePngWithMetadata(1) });
      const p2 = inspectEvidenceFile({ buffer: makePngWithMetadata(2) });
      return p1.ok && p2.ok && p1.sha256 !== p2.sha256;
    })(),
  );
  // Because the hash is taken after stripping, the same photograph saved with
  // different camera metadata is recognised as the same document.
  check(
    'HASH_IGNORES_METADATA_ONLY_DIFFERENCE',
    (() => {
      const withMeta = inspectEvidenceFile({ buffer: makePngWithMetadata(7) });
      const stripped = inspectEvidenceFile({ buffer: stripPngMetadata(makePngWithMetadata(7)) });
      return withMeta.ok && stripped.ok && withMeta.sha256 === stripped.sha256;
    })(),
  );

  section('9,H  filenames cannot address anything');
  const traversals: Array<[string, string | null]> = [
    ['../../../../etc/passwd', 'etc_passwd'],
    ['..\\..\\windows\\system32\\cmd.exe', 'windows_system32_cmd.exe'],
    ['/etc/shadow', 'etc_shadow'],
    ['....//....//secret.jpg', '_._secret.jpg'],
    ['.', null],
    ['..', null],
    ['', null],
    ['   ', null],
  ];
  for (const [input, expected] of traversals) {
    const out = sanitizeDisplayFilename(input);
    check(
      `H_SANITIZE_${JSON.stringify(input)}`,
      out === expected,
      `got ${JSON.stringify(out)}, expected ${JSON.stringify(expected)}`,
    );
    check(
      `H_NO_SEPARATORS_${JSON.stringify(input)}`,
      out === null || (!out.includes('/') && !out.includes('\\') && !out.includes('..')),
    );
  }
  check('H_CONTROL_CHARS_REMOVED', sanitizeDisplayFilename('bon\u0000\u001fnetje.jpg') === 'bon__netje.jpg');
  check('H_QUOTES_REMOVED', !(sanitizeDisplayFilename('a"b.jpg') ?? '').includes('"'));
  check('H_LENGTH_CAPPED', (sanitizeDisplayFilename('x'.repeat(500)) ?? '').length === 120);
  check('H_NON_STRING_IS_NULL', sanitizeDisplayFilename(42 as unknown) === null);

  section('9  object keys are opaque and caller-independent');
  const keys = new Set(Array.from({ length: 200 }, () => newObjectKey()));
  check('KEY_UNIQUE', keys.size === 200);
  for (const key of keys) {
    check(`KEY_SHAPE_${key.slice(0, 6)}`, isVaultObjectKey(key), key);
  }
  const sample = newObjectKey();
  check('KEY_HAS_NO_EXTENSION', !/\.(jpg|jpeg|png|webp|pdf)$/i.test(sample));
  check('KEY_HAS_NO_FILENAME', !sample.includes('bonnetje'));
  for (const bad of ['ev/../secret', 'uploads/x', 'ev/not-a-uuid', '', 'ev/', '../ev/x']) {
    check(`KEY_REJECTS_${JSON.stringify(bad)}`, !isVaultObjectKey(bad));
  }

  section('11,14  delivery headers are hostile to the bytes they serve');
  const pdfHeaders = evidenceDeliveryHeaders({
    mimeType: 'application/pdf',
    downloadFilename: 'bon.pdf',
    sizeBytes: 1234,
  });
  check('PDF_DISPOSITION_ATTACHMENT', pdfHeaders['Content-Disposition']!.startsWith('attachment'));
  check('PDF_CONTENT_TYPE_EXACT', pdfHeaders['Content-Type'] === 'application/pdf');
  const imgHeaders = evidenceDeliveryHeaders({
    mimeType: 'image/jpeg',
    downloadFilename: 'bon.jpg',
    sizeBytes: 10,
  });
  check('IMAGE_DISPOSITION_INLINE', imgHeaders['Content-Disposition']!.startsWith('inline'));
  for (const [label, headers] of [['PDF', pdfHeaders], ['IMAGE', imgHeaders]] as const) {
    check(`${label}_NOSNIFF`, headers['X-Content-Type-Options'] === 'nosniff');
    check(`${label}_CSP_SANDBOX`, headers['Content-Security-Policy']!.includes('sandbox'));
    check(`${label}_CSP_NO_DEFAULT_SRC`, headers['Content-Security-Policy']!.includes("default-src 'none'"));
    check(`${label}_NO_STORE`, headers['Cache-Control']!.includes('no-store'));
    check(`${label}_PRIVATE_CACHE`, headers['Cache-Control']!.includes('private'));
    check(`${label}_NOT_PUBLIC_CACHE`, !headers['Cache-Control']!.includes('public'));
    check(`${label}_VARY_COOKIE`, headers.Vary === 'Cookie');
    check(`${label}_NO_REFERRER`, headers['Referrer-Policy'] === 'no-referrer');
    check(`${label}_CORP_SAME_ORIGIN`, headers['Cross-Origin-Resource-Policy'] === 'same-origin');
  }
  check('DISPOSITION_BY_TYPE_PDF', evidenceDisposition('application/pdf') === 'attachment');
  check('DISPOSITION_BY_TYPE_IMAGE', evidenceDisposition('image/png') === 'inline');

  const nastyHeaders = evidenceDeliveryHeaders({
    mimeType: 'image/png',
    downloadFilename: 'bon"; attack="x\r\nX-Evil: 1.png',
    sizeBytes: 1,
  });
  check(
    'HEADER_INJECTION_NEUTRALISED',
    !nastyHeaders['Content-Disposition']!.includes('\r') &&
      !nastyHeaders['Content-Disposition']!.includes('\n'),
  );

  section('download names never expose the object key');
  check(
    'DOWNLOAD_NAME_FROM_ORIGINAL',
    downloadFilenameFor({ originalFilename: 'bon.jpg', mimeType: 'image/jpeg', evidenceId: 'x' }) ===
      'bon.jpg',
  );
  check(
    'DOWNLOAD_NAME_FALLBACK',
    downloadFilenameFor({ originalFilename: null, mimeType: 'application/pdf', evidenceId: 'abcd1234-x' }) ===
      'bewijs-abcd1234.pdf',
  );
  check(
    'DOWNLOAD_NAME_ADDS_EXTENSION',
    downloadFilenameFor({ originalFilename: 'bon', mimeType: 'image/png', evidenceId: 'x' }) === 'bon.png',
  );

  section('policy invariants');
  check('ONLY_STORED_IS_READABLE', isReadableStatus('STORED'));
  for (const status of ['UPLOADING', 'PENDING_PURGE', 'PURGED', 'MISSING'] as const) {
    check(`STATUS_NOT_READABLE_${status}`, !isReadableStatus(status));
  }
  check('MAX_SIZE_FITS_FUNCTION_BODY_LIMIT', MAX_EVIDENCE_BYTES <= 4.5 * 1024 * 1024);
  check('MAX_PER_EXPENSE_SUPPORTS_MULTIPLE', MAX_EVIDENCE_PER_EXPENSE > 1);
  check('PURGE_GRACE_DEFAULTS_TO_IMMEDIATE', purgeGraceMs({} as NodeJS.ProcessEnv) === 0);
  check(
    'PURGE_GRACE_CONFIGURABLE',
    purgeGraceMs({ RECEIPT_VAULT_PURGE_GRACE_HOURS: '2' } as unknown as NodeJS.ProcessEnv) ===
      2 * 60 * 60 * 1000,
  );
  check(
    'PURGE_GRACE_CAPPED',
    purgeGraceMs({ RECEIPT_VAULT_PURGE_GRACE_HOURS: '99999' } as unknown as NodeJS.ProcessEnv) <=
      30 * 24 * 60 * 60 * 1000,
  );
  check(
    'PURGE_GRACE_REJECTS_GARBAGE',
    purgeGraceMs({ RECEIPT_VAULT_PURGE_GRACE_HOURS: 'abc' } as unknown as NodeJS.ProcessEnv) === 0 &&
      purgeGraceMs({ RECEIPT_VAULT_PURGE_GRACE_HOURS: '-5' } as unknown as NodeJS.ProcessEnv) === 0,
  );
}

// =========================================================================
// PART 3 — source-level guarantees (22, 23, 24, 0)
// =========================================================================

function sourceFixtures() {
  section('0,22,23,24  source-level prohibitions');
  const read = (p: string) => fs.readFileSync(p, 'utf8');

  const vaultSrc = read('lib/finance/evidence/vault-store.ts');
  check('VAULT_USES_PRIVATE_ACCESS', /access:\s*'private'/.test(vaultSrc));
  check('VAULT_NEVER_USES_PUBLIC_ACCESS', !/access:\s*'public'/.test(vaultSrc));
  check(
    'VAULT_USES_DEDICATED_TOKEN',
    vaultSrc.includes('RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN') &&
      !/process\.env\.BLOB_READ_WRITE_TOKEN/.test(vaultSrc),
    'the public store token must never appear here',
  );
  check('VAULT_FAILS_CLOSED_WITHOUT_TOKEN', vaultSrc.includes('VaultNotConfiguredError'));

  const evidenceFiles = [
    'lib/finance/evidence/vault-store.ts',
    'lib/finance/evidence/evidence.server.ts',
    'lib/finance/evidence/evidence-policy.ts',
    'lib/finance/evidence/evidence-file.ts',
    'lib/finance/evidence/evidence-request.ts',
    'app/api/seller/evidence/route.ts',
    'app/api/seller/evidence/[evidenceId]/route.ts',
    'app/api/seller/evidence/[evidenceId]/content/route.ts',
    'components/seller/ExpenseEvidencePanel.tsx',
  ];
  for (const file of evidenceFiles) {
    const src = read(file);
    check(`NO_OCR_${file}`, !/\b(ocr|tesseract|textract|visionApi|extractText)\b/i.test(src));
    check(
      `NO_AI_${file}`,
      !/\b(openai|anthropic|gemini|huggingface|gpt-|claude-|completions)\b/i.test(src),
    );
    check(`NO_ANALYTICS_${file}`, !/\b(gtag|analytics\.track|posthog|mixpanel|segment\.)\b/i.test(src));
    check(`NO_PUBLIC_BLOB_${file}`, !/access:\s*'public'/.test(src));
  }

  // §24 — logging must never carry a key, a url or file bytes.
  for (const file of evidenceFiles.filter((f) => !f.endsWith('.tsx'))) {
    const src = read(file);
    const logLines = src
      .split('\n')
      .filter((line) => /console\.(log|error|warn|info)/.test(line));
    for (const line of logLines) {
      check(
        `LOG_NO_OBJECT_KEY_${file}_${logLines.indexOf(line)}`,
        !/objectKey|\.url|signedUrl|downloadUrl/.test(line),
        line.trim().slice(0, 90),
      );
      check(
        `LOG_NO_BYTES_${file}_${logLines.indexOf(line)}`,
        !/buffer|bytes\b|\bfile\b|filename/i.test(line),
        line.trim().slice(0, 90),
      );
    }
  }

  const contentRoute = read('app/api/seller/evidence/[evidenceId]/content/route.ts');
  check('CONTENT_ROUTE_NO_REDIRECT', !/redirect\(/.test(contentRoute), 'must stream, never redirect');
  check('CONTENT_ROUTE_404_FOR_EVERYTHING', (contentRoute.match(/status: 404/g) ?? []).length >= 3);
  check('CONTENT_ROUTE_NO_403', !/status:\s*403/.test(contentRoute), '403 would confirm existence');

  const uploadRoute = read('app/api/seller/evidence/route.ts');
  check('UPLOAD_RESOLVES_OWNER_SERVER_SIDE', uploadRoute.includes('evidenceOwnerId()'));
  check(
    'UPLOAD_IGNORES_CLIENT_OWNER',
    !/ownerUserId.*form\.get|form\.get\(.ownerUserId/.test(uploadRoute),
  );
  check('UPLOAD_RATE_LIMITED', uploadRoute.includes('checkEvidenceUploadRateLimit'));
  check('UPLOAD_SAME_ORIGIN_GUARD', uploadRoute.includes('isSameOriginWrite'));
  check('UPLOAD_REFUSES_WITHOUT_VAULT', uploadRoute.includes('isVaultConfigured'));

  const serverSrc = read('lib/finance/evidence/evidence.server.ts');
  check(
    'OWNER_IS_ALWAYS_IN_WHERE',
    !/findFirst\(\{\s*where:\s*\{\s*id:\s*evidenceId\s*\}/.test(serverSrc),
    'never look up by id alone',
  );
  check('DUPLICATE_SCOPED_TO_OWNER', /sha256: inspection\.sha256/.test(serverSrc) &&
    /ownerUserId: input\.ownerUserId,\s*sha256/.test(serverSrc));

  // §19-21 — evidence must not touch the fiscal domain.
  const fiscalFiles = [
    'lib/finance/seller-expense.ts',
    'lib/finance/seller-fiscal-result.ts',
    'lib/finance/seller-expense.server.ts',
    'lib/finance/seller-expense-input.ts',
  ];
  for (const file of fiscalFiles) {
    const src = read(file);
    check(
      `FISCAL_UNAWARE_OF_EVIDENCE_${file}`,
      !/evidence|Evidence/.test(src),
      'the fiscal layer must not know evidence exists',
    );
  }
  check(
    'RECEIPT_CONFIRMED_STILL_UNWRITTEN',
    !/source:\s*'RECEIPT_CONFIRMED'|RECEIPT_CONFIRMED/.test(serverSrc) &&
      !/RECEIPT_CONFIRMED/.test(read('app/api/seller/evidence/route.ts')),
    '§21: attaching a file is not a confirmed extraction',
  );
  const expenseRoute = read('app/api/seller/expenses/route.ts');
  check('EXPENSE_CREATE_STILL_FORCES_USER_PROVIDED', expenseRoute.includes("source: 'USER_PROVIDED'"));

  // §17 — account deletion must reach the vault.
  const deletionSrc = read('lib/account-deletion.ts');
  check('ACCOUNT_DELETION_QUEUES_EVIDENCE', deletionSrc.includes('sellerFinancialEvidence'));
  check('ACCOUNT_DELETION_PURGES_OBJECTS', deletionSrc.includes('purgeDueEvidence'));
  const bulkSrc = read('app/api/admin/users/bulk-delete/route.ts');
  check('ADMIN_HARD_DELETE_COLLECTS_KEYS', bulkSrc.includes('sellerFinancialEvidence'));
  check('ADMIN_HARD_DELETE_REMOVES_OBJECTS', bulkSrc.includes('deleteVaultObjectsByKey'));

  // §27 — nothing public may serve evidence.
  const publicSurfaces = [
    'app/api/feed/media/route.ts',
    'app/api/upload/route.ts',
    'app/api/video-proxy/route.ts',
  ];
  for (const file of publicSurfaces) {
    if (!fs.existsSync(file)) continue;
    const src = read(file);
    check(
      `PUBLIC_SURFACE_UNAWARE_${file}`,
      !/sellerFinancialEvidence|SellerFinancialEvidence|receipt-vault/i.test(src),
    );
  }
}

// =========================================================================
// PART 2 — integration: real database, real private store
// =========================================================================

const RUN = randomUUID().slice(0, 8);
const created = { users: [] as string[], objectKeys: [] as string[] };

async function makeUser(label: string): Promise<string> {
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `hc8d-${label}-${RUN}@fixtures.homecheff.internal`,
      name: `8D fixture ${label}`,
    },
    select: { id: true },
  });
  created.users.push(user.id);
  return user.id;
}

async function makeExpense(sellerUserId: string, treatment: 'UNKNOWN' | 'INVESTMENT' | 'ORDINARY_EXPENSE') {
  return prisma.sellerExpense.create({
    data: {
      id: randomUUID(),
      sellerUserId,
      expenseDate: new Date(Date.UTC(2026, 4, 12)),
      amountCents: 60_000,
      currency: 'EUR',
      category: 'EQUIPMENT',
      fiscalTreatment: treatment,
      source: 'USER_PROVIDED',
      confirmationStatus: 'DRAFT',
      taxYear: 2026,
      description: `8D fixture ${RUN}`,
    },
    select: { id: true },
  });
}

async function integrationFixtures() {
  const sellerA = await makeUser('a');
  const sellerB = await makeUser('b');

  section('A-D  round trip through the real private store');
  const uploads: Record<string, string> = {};
  for (const [label, buffer, declared] of [
    ['A_JPEG', makeJpegWithMetadata(), 'image/jpeg'],
    ['B_PNG', makePngWithMetadata(), 'image/png'],
    ['C_WEBP', makeWebpWithMetadata(), 'image/webp'],
    ['D_PDF', makePdf(), 'application/pdf'],
  ] as const) {
    const result = await createEvidence({
      ownerUserId: sellerA,
      buffer,
      declaredMimeType: declared,
      filename: `../../${label}.bin`,
    });
    check(`${label}_UPLOAD_OK`, result.ok, result.ok ? undefined : result.code);
    if (!result.ok) continue;
    uploads[label] = result.evidence.id;

    const row = await prisma.sellerFinancialEvidence.findUnique({
      where: { id: result.evidence.id },
    });
    check(`${label}_ROW_STORED`, row?.status === 'STORED');
    check(`${label}_ROW_OWNED_BY_A`, row?.ownerUserId === sellerA);
    check(`${label}_KEY_OPAQUE`, !!row && isVaultObjectKey(row.objectKey));
    check(
      `${label}_FILENAME_SANITISED`,
      row?.originalFilename === `${label}.bin`,
      `got ${row?.originalFilename}`,
    );
    if (row) created.objectKeys.push(row.objectKey);

    const readBack = await readEvidence(sellerA, result.evidence.id);
    check(`${label}_OWNER_CAN_READ`, readBack.ok);
    if (readBack.ok) {
      const bytes = await readAll(readBack.object.stream);
      check(`${label}_BYTES_ROUND_TRIP`, bytes.length === row!.sizeBytes);
      check(
        `${label}_NO_METADATA_IN_STORED_BYTES`,
        label === 'D_PDF' || !bytes.toString('latin1').includes(METADATA_CANARY),
      );
    }

    // §26 — the object exists, but only to a credentialed caller.
    check(`${label}_OBJECT_EXISTS_IN_STORE`, await vaultObjectExists(row!.objectKey));
  }

  section('I,J,K  seller B cannot reach seller A');
  const targetId = uploads.A_JPEG!;
  const targetRow = await prisma.sellerFinancialEvidence.findUnique({ where: { id: targetId } });

  const bRead = await readEvidence(sellerB, targetId);
  check('I_WRONG_OWNER_READ_BLOCKED', !bRead.ok && bRead.reason === 'NOT_FOUND');

  const bDelete = await deleteEvidence(sellerB, targetId);
  check('J_WRONG_OWNER_DELETE_BLOCKED', !bDelete.ok);
  const stillThere = await prisma.sellerFinancialEvidence.findUnique({ where: { id: targetId } });
  check('J_WRONG_OWNER_DELETE_DID_NOT_TOUCH_ROW', stillThere?.status === 'STORED');
  check('J_WRONG_OWNER_DELETE_DID_NOT_TOUCH_OBJECT', await vaultObjectExists(targetRow!.objectKey));

  const bList = await listEvidenceForExpense(sellerB, 'any');
  check('I_WRONG_OWNER_LIST_EMPTY', bList.length === 0);

  const expenseA = await makeExpense(sellerA, 'UNKNOWN');
  const crossLink = await createEvidence({
    ownerUserId: sellerB,
    buffer: makeJpegWithMetadata(),
    declaredMimeType: 'image/jpeg',
    filename: 'cross.jpg',
    linkedExpenseId: expenseA.id,
  });
  check('K_CROSS_OWNER_LINK_BLOCKED', !crossLink.ok && crossLink.code === 'EXPENSE_NOT_FOUND');
  const leaked = await prisma.sellerFinancialEvidence.count({
    where: { linkedExpenseId: expenseA.id, ownerUserId: sellerB },
  });
  check('K_NO_ROW_CREATED_FOR_CROSS_LINK', leaked === 0);

  section('N,O  a receipt changes nothing fiscal');
  for (const [label, treatment] of [
    ['N_UNKNOWN', 'UNKNOWN'],
    ['O_INVESTMENT', 'INVESTMENT'],
  ] as const) {
    const expense = await makeExpense(sellerA, treatment);
    const before = await prisma.sellerExpense.findUnique({ where: { id: expense.id } });
    const fiscalBefore = await deriveSellerFiscalResult(sellerA, 2026);

    const attach = await createEvidence({
      ownerUserId: sellerA,
      buffer: makePdf(),
      declaredMimeType: 'application/pdf',
      filename: `${label}.pdf`,
      linkedExpenseId: expense.id,
    });
    check(`${label}_ATTACH_OK`, attach.ok, attach.ok ? undefined : attach.code);
    if (attach.ok) {
      const r = await prisma.sellerFinancialEvidence.findUnique({ where: { id: attach.evidence.id } });
      if (r) created.objectKeys.push(r.objectKey);
    }

    const after = await prisma.sellerExpense.findUnique({ where: { id: expense.id } });
    check(`${label}_TREATMENT_UNCHANGED`, before!.fiscalTreatment === after!.fiscalTreatment);
    check(`${label}_AMOUNT_UNCHANGED`, before!.amountCents === after!.amountCents);
    check(`${label}_BUSINESS_SHARE_UNCHANGED`, before!.businessUseBp === after!.businessUseBp);
    check(`${label}_SOURCE_UNCHANGED`, before!.source === after!.source);
    check(`${label}_SOURCE_NOT_RECEIPT_CONFIRMED`, after!.source === 'USER_PROVIDED');
    check(`${label}_CONFIRMATION_UNCHANGED`, before!.confirmationStatus === after!.confirmationStatus);
    check(`${label}_STILL_DRAFT`, after!.confirmationStatus === 'DRAFT');

    const fiscalAfter = await deriveSellerFiscalResult(sellerA, 2026);
    check(
      `${label}_DEDUCTIBLE_TOTAL_UNCHANGED`,
      fiscalBefore.sellerDeductibleCostCents === fiscalAfter.sellerDeductibleCostCents,
    );
    check(
      `${label}_PARTIAL_RESULT_UNCHANGED`,
      fiscalBefore.partialResultCents === fiscalAfter.partialResultCents,
    );
    check(
      `${label}_UNRESOLVED_UNCHANGED`,
      fiscalBefore.unresolvedCostCents === fiscalAfter.unresolvedCostCents,
    );
  }

  section('P  several documents on one expense');
  const multiExpense = await makeExpense(sellerA, 'ORDINARY_EXPENSE');
  for (const n of [1, 2, 3]) {
    const r = await createEvidence({
      ownerUserId: sellerA,
      buffer: n === 3 ? makePdf() : makePngWithMetadata(n),
      declaredMimeType: n === 3 ? 'application/pdf' : 'image/png',
      filename: `page-${n}`,
      linkedExpenseId: multiExpense.id,
    });
    check(`P_MULTI_UPLOAD_${n}`, r.ok, r.ok ? undefined : r.code);
    if (r.ok) {
      const row = await prisma.sellerFinancialEvidence.findUnique({ where: { id: r.evidence.id } });
      if (row) created.objectKeys.push(row.objectKey);
    }
  }
  const multiList = await listEvidenceForExpense(sellerA, multiExpense.id);
  check('P_THREE_ATTACHED', multiList.length === 3, `got ${multiList.length}`);
  const counts = await evidenceCountsByExpense(sellerA, [multiExpense.id, expenseA.id]);
  check('P_COUNT_CORRECT', counts[multiExpense.id] === 3);
  const countsForB = await evidenceCountsByExpense(sellerB, [multiExpense.id]);
  check('P_COUNT_SCOPED_TO_OWNER', (countsForB[multiExpense.id] ?? 0) === 0);

  section('Q  duplicates are reported, not merged or deduplicated globally');
  // Seeded so this image is new to seller A, rather than a coincidental repeat
  // of one uploaded earlier in this run.
  const dup1 = await createEvidence({
    ownerUserId: sellerA,
    buffer: makePngWithMetadata(99),
    declaredMimeType: 'image/png',
    filename: 'dup.png',
  });
  const dup2 = await createEvidence({
    ownerUserId: sellerA,
    buffer: makePngWithMetadata(99),
    declaredMimeType: 'image/png',
    filename: 'dup-again.png',
  });
  check('Q_DUPLICATE_STILL_STORED', dup1.ok && dup2.ok);
  check('Q_DUPLICATE_FLAGGED', dup2.ok && dup2.evidence.duplicateOfExisting === true);
  check('Q_FIRST_NOT_FLAGGED_BY_ITSELF', dup1.ok && dup1.evidence.duplicateOfExisting === false);
  if (dup1.ok && dup2.ok) {
    check('Q_SEPARATE_ROWS', dup1.evidence.id !== dup2.evidence.id);
    const r1 = await prisma.sellerFinancialEvidence.findUnique({ where: { id: dup1.evidence.id } });
    const r2 = await prisma.sellerFinancialEvidence.findUnique({ where: { id: dup2.evidence.id } });
    check('Q_SEPARATE_OBJECTS', r1!.objectKey !== r2!.objectKey, 'no cross-row object sharing');
    check('Q_SAME_HASH', r1!.sha256 === r2!.sha256);
    created.objectKeys.push(r1!.objectKey, r2!.objectKey);

    // The same bytes uploaded by a different seller must not be flagged.
    const dupB = await createEvidence({
      ownerUserId: sellerB,
      buffer: makePngWithMetadata(99),
      declaredMimeType: 'image/png',
      filename: 'dup.png',
    });
    check('Q_NO_CROSS_OWNER_DUPLICATE_LEAK', dupB.ok && dupB.evidence.duplicateOfExisting === false);
    if (dupB.ok) {
      const rb = await prisma.sellerFinancialEvidence.findUnique({ where: { id: dupB.evidence.id } });
      created.objectKeys.push(rb!.objectKey);
    }
  }

  section('TOO_MANY  the per-expense ceiling holds');
  const fullExpense = await makeExpense(sellerA, 'ORDINARY_EXPENSE');
  for (let i = 0; i < MAX_EVIDENCE_PER_EXPENSE; i += 1) {
    const r = await createEvidence({
      ownerUserId: sellerA,
      buffer: Buffer.concat([makePdf(), Buffer.from(`\n% pad ${i}\n`, 'latin1')]),
      declaredMimeType: 'application/pdf',
      filename: `fill-${i}.pdf`,
      linkedExpenseId: fullExpense.id,
    });
    if (r.ok) {
      const row = await prisma.sellerFinancialEvidence.findUnique({ where: { id: r.evidence.id } });
      if (row) created.objectKeys.push(row.objectKey);
    }
  }
  const overflow = await createEvidence({
    ownerUserId: sellerA,
    buffer: makePdf(),
    declaredMimeType: 'application/pdf',
    filename: 'overflow.pdf',
    linkedExpenseId: fullExpense.id,
  });
  check('TOO_MANY_FILES_REFUSED', !overflow.ok && overflow.code === 'TOO_MANY_FILES');

  section('15,M  deleting evidence destroys the object and spares the expense');
  const delExpense = await makeExpense(sellerA, 'ORDINARY_EXPENSE');
  const delUpload = await createEvidence({
    ownerUserId: sellerA,
    buffer: makeJpegWithMetadata(),
    declaredMimeType: 'image/jpeg',
    filename: 'to-delete.jpg',
    linkedExpenseId: delExpense.id,
  });
  check('DELETE_SETUP_OK', delUpload.ok);
  if (delUpload.ok) {
    const row = await prisma.sellerFinancialEvidence.findUnique({ where: { id: delUpload.evidence.id } });
    const key = row!.objectKey;
    check('DELETE_OBJECT_PRESENT_BEFORE', await vaultObjectExists(key));

    const result = await deleteEvidence(sellerA, delUpload.evidence.id);
    check('DELETE_REPORTED_OK', result.ok);
    check('DELETE_PURGED_IMMEDIATELY', result.purged);

    const after = await prisma.sellerFinancialEvidence.findUnique({ where: { id: delUpload.evidence.id } });
    check('DELETE_STATUS_PURGED', after?.status === 'PURGED');
    check('DELETE_TOMBSTONE_KEPT', after !== null, 'metadata tombstone stays for auditability');
    check('DELETE_PURGED_AT_SET', after?.purgedAt !== null);
    check('M_OBJECT_GONE_FROM_STORE', !(await vaultObjectExists(key)), 'bytes must be destroyed');

    const reread = await readEvidence(sellerA, delUpload.evidence.id);
    check('M_DELETED_NOT_READABLE_BY_OWNER', !reread.ok && reread.reason === 'NOT_FOUND');

    // §5 — the expense survives untouched.
    const expenseAfter = await prisma.sellerExpense.findUnique({ where: { id: delExpense.id } });
    check('DELETE_EVIDENCE_KEEPS_EXPENSE', expenseAfter !== null && expenseAfter.deletedAt === null);
    check('DELETE_EVIDENCE_KEEPS_AMOUNT', expenseAfter?.amountCents === 60_000);
    check('DELETE_EVIDENCE_KEEPS_TREATMENT', expenseAfter?.fiscalTreatment === 'ORDINARY_EXPENSE');

    // Idempotency: a repeated delete is a 404, not a crash or a second purge.
    const again = await deleteEvidence(sellerA, delUpload.evidence.id);
    check('DELETE_IS_IDEMPOTENT', !again.ok);
    const stillPurged = await prisma.sellerFinancialEvidence.findUnique({
      where: { id: delUpload.evidence.id },
    });
    check('DELETE_REPEAT_LEAVES_PURGED', stillPurged?.status === 'PURGED');
  }

  section('16  deleting the expense takes its evidence with it');
  const cascadeExpense = await makeExpense(sellerA, 'ORDINARY_EXPENSE');
  const cascadeKeys: string[] = [];
  for (const n of [1, 2]) {
    const r = await createEvidence({
      ownerUserId: sellerA,
      buffer: Buffer.concat([makePdf(), Buffer.from(`\n% c${n}\n`, 'latin1')]),
      declaredMimeType: 'application/pdf',
      filename: `cascade-${n}.pdf`,
      linkedExpenseId: cascadeExpense.id,
    });
    if (r.ok) {
      const row = await prisma.sellerFinancialEvidence.findUnique({ where: { id: r.evidence.id } });
      cascadeKeys.push(row!.objectKey);
      created.objectKeys.push(row!.objectKey);
    }
  }
  check('CASCADE_SETUP', cascadeKeys.length === 2);

  await prisma.sellerExpense.update({
    where: { id: cascadeExpense.id },
    data: { deletedAt: new Date() },
  });
  const cascaded = await markExpenseEvidenceForPurge(sellerA, cascadeExpense.id);
  check('CASCADE_MARKED_BOTH', cascaded === 2, `marked ${cascaded}`);
  for (const [i, key] of cascadeKeys.entries()) {
    check(`CASCADE_OBJECT_${i}_GONE`, !(await vaultObjectExists(key)));
  }
  const cascadeRows = await prisma.sellerFinancialEvidence.findMany({
    where: { linkedExpenseId: cascadeExpense.id },
  });
  check('CASCADE_ALL_PURGED', cascadeRows.every((r) => r.status === 'PURGED'));
  check(
    'CASCADE_EXPENSE_TOMBSTONE_SURVIVES',
    (await prisma.sellerExpense.findUnique({ where: { id: cascadeExpense.id } })) !== null,
  );
  const cascadeList = await listEvidenceForExpense(sellerA, cascadeExpense.id);
  check('CASCADE_NOT_LISTED', cascadeList.length === 0);

  section('31  storage failures never leave an orphan or a readable ghost');

  // DB row exists, object was never written: reading must not lie.
  const ghost = await prisma.sellerFinancialEvidence.create({
    data: {
      ownerUserId: sellerA,
      status: 'STORED',
      objectKey: newObjectKey(),
      mimeType: 'image/png',
      sizeBytes: 1234,
      sha256: 'f'.repeat(64),
      originalFilename: 'ghost.png',
    },
  });
  const ghostRead = await readEvidence(sellerA, ghost.id);
  check('GHOST_ROW_NOT_READABLE', !ghostRead.ok && ghostRead.reason === 'OBJECT_MISSING');
  const ghostAfter = await prisma.sellerFinancialEvidence.findUnique({ where: { id: ghost.id } });
  check('GHOST_ROW_MARKED_MISSING', ghostAfter?.status === 'MISSING', 'inconsistency must be recorded');
  const ghostDelete = await deleteEvidence(sellerA, ghost.id);
  check('GHOST_ROW_CAN_STILL_BE_DELETED', ghostDelete.ok);
  check(
    'GHOST_ROW_PURGES_CLEANLY',
    (await prisma.sellerFinancialEvidence.findUnique({ where: { id: ghost.id } }))?.status === 'PURGED',
    'deleting an absent object counts as success',
  );

  // Object written, row never confirmed: the sweeper must find it.
  const strandedKey = newObjectKey();
  await putVaultObject({
    objectKey: strandedKey,
    body: makePngWithMetadata(),
    contentType: 'image/png',
  });
  created.objectKeys.push(strandedKey);
  const stranded = await prisma.sellerFinancialEvidence.create({
    data: {
      ownerUserId: sellerA,
      status: 'UPLOADING',
      objectKey: strandedKey,
      mimeType: 'image/png',
      sizeBytes: 100,
      sha256: 'a'.repeat(64),
      uploadedAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  });
  const strandedRead = await readEvidence(sellerA, stranded.id);
  check('UPLOADING_ROW_NOT_READABLE', !strandedRead.ok, 'an unconfirmed upload must not be served');
  const swept = await sweepStaleUploads(15 * 60 * 1000);
  check('SWEEPER_QUEUES_STALE_UPLOAD', swept >= 1);
  await purgeDueEvidence({ ownerUserId: sellerA });
  check('SWEEPER_DESTROYS_STRANDED_OBJECT', !(await vaultObjectExists(strandedKey)));
  check(
    'SWEEPER_MARKS_ROW_PURGED',
    (await prisma.sellerFinancialEvidence.findUnique({ where: { id: stranded.id } }))?.status === 'PURGED',
  );

  // Purge retries are idempotent and converge.
  const retryRow = await prisma.sellerFinancialEvidence.create({
    data: {
      ownerUserId: sellerA,
      status: 'PENDING_PURGE',
      objectKey: newObjectKey(),
      mimeType: 'image/png',
      sizeBytes: 10,
      sha256: 'b'.repeat(64),
      deletedAt: new Date(),
      purgeAfter: new Date(),
    },
  });
  const first = await purgeDueEvidence({ ids: [retryRow.id] });
  const second = await purgeDueEvidence({ ids: [retryRow.id] });
  check('PURGE_FIRST_PASS_SUCCEEDS', first.purged === 1);
  check('PURGE_SECOND_PASS_IS_NOOP', second.considered === 0, 'already purged rows are not reconsidered');

  // A key this module did not generate is never handed to the store.
  const foreign = await deleteVaultObject('uploads/someone-elses-photo.jpg');
  check('REFUSES_FOREIGN_KEY_DELETE', !foreign.ok && foreign.error === 'invalid_key');

  section('R  account deletion clears the vault');
  const sellerC = await makeUser('c');
  const cExpense = await prisma.sellerExpense.create({
    data: {
      id: randomUUID(),
      sellerUserId: sellerC,
      expenseDate: new Date(Date.UTC(2026, 3, 1)),
      amountCents: 1500,
      currency: 'EUR',
      category: 'MATERIALS',
      fiscalTreatment: 'ORDINARY_EXPENSE',
      source: 'USER_PROVIDED',
      confirmationStatus: 'DRAFT',
      taxYear: 2026,
      description: `8D fixture ${RUN}`,
    },
    select: { id: true },
  });
  const cKeys: string[] = [];
  for (const n of [1, 2]) {
    const r = await createEvidence({
      ownerUserId: sellerC,
      buffer: Buffer.concat([makePdf(), Buffer.from(`\n% r${n}\n`, 'latin1')]),
      declaredMimeType: 'application/pdf',
      filename: `acct-${n}.pdf`,
      linkedExpenseId: n === 1 ? cExpense.id : null,
    });
    if (r.ok) {
      const row = await prisma.sellerFinancialEvidence.findUnique({ where: { id: r.evidence.id } });
      cKeys.push(row!.objectKey);
      created.objectKeys.push(row!.objectKey);
    }
  }
  check('R_SETUP', cKeys.length === 2, 'one linked, one unlinked');
  for (const key of cKeys) check(`R_OBJECT_PRESENT_BEFORE_${key.slice(3, 11)}`, await vaultObjectExists(key));

  // Exercises the same code path account deletion runs, without touching Stripe.
  const marked = await markAllOwnerEvidenceForPurge(sellerC);
  check('R_ALL_EVIDENCE_MARKED', marked === 2, `marked ${marked}`);
  await purgeDueEvidence({ ownerUserId: sellerC });
  for (const key of cKeys) {
    check(`R_OBJECT_DESTROYED_${key.slice(3, 11)}`, !(await vaultObjectExists(key)));
  }
  const cRows = await prisma.sellerFinancialEvidence.findMany({ where: { ownerUserId: sellerC } });
  check('R_ALL_ROWS_PURGED', cRows.length === 2 && cRows.every((r) => r.status === 'PURGED'));
  check('R_UNLINKED_EVIDENCE_ALSO_PURGED', cRows.filter((r) => r.linkedExpenseId === null).length === 1);
  const cRead = await readEvidence(sellerC, cRows[0]!.id);
  check('R_NOTHING_READABLE_AFTER', !cRead.ok);
}

async function cleanup() {
  section('cleanup');
  let objectsRemaining = 0;
  for (const key of new Set(created.objectKeys)) {
    if (await vaultObjectExists(key)) {
      await deleteVaultObject(key);
      objectsRemaining += 1;
    }
  }
  console.log(`  objects still present at cleanup: ${objectsRemaining} (all removed)`);

  // Each step is independent: a failure in one must not strand the fixture
  // users in the database, which is what happened when this suite first ran
  // before the table existed.
  try {
    const rows = await prisma.sellerFinancialEvidence.findMany({
      where: { ownerUserId: { in: created.users } },
      select: { objectKey: true },
    });
    for (const row of rows) await deleteVaultObject(row.objectKey);
    await prisma.sellerFinancialEvidence.deleteMany({ where: { ownerUserId: { in: created.users } } });
  } catch (err) {
    console.log(`  (evidence cleanup skipped: ${err instanceof Error ? err.name : 'unknown'})`);
  }
  await prisma.sellerExpense
    .deleteMany({ where: { sellerUserId: { in: created.users } } })
    .catch(() => undefined);
  await prisma.user.deleteMany({ where: { id: { in: created.users } } });

  const leftoverRows = await prisma.sellerFinancialEvidence.count({
    where: { ownerUserId: { in: created.users } },
  });
  const leftoverUsers = await prisma.user.count({ where: { id: { in: created.users } } });
  check('CLEANUP_NO_EVIDENCE_ROWS_LEFT', leftoverRows === 0);
  check('CLEANUP_NO_FIXTURE_USERS_LEFT', leftoverUsers === 0);

  let leftoverObjects = 0;
  for (const key of new Set(created.objectKeys)) {
    if (await vaultObjectExists(key)) leftoverObjects += 1;
  }
  check('CLEANUP_NO_OBJECTS_LEFT', leftoverObjects === 0, `${leftoverObjects} objects survived`);
}

async function main() {
  console.log(`PHASE 8D — private receipt vault fixtures (run ${RUN})`);
  pureFixtures();
  sourceFixtures();
  try {
    await integrationFixtures();
  } finally {
    await cleanup().catch((err) => {
      failures.push(`CLEANUP_THREW — ${err instanceof Error ? err.message : String(err)}`);
    });
    await prisma.$disconnect();
  }

  console.log(`\n${passed}/${passed + failures.length} checks passed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

void main();

/**
 * Trace listing RSC critical path timings (BEFORE / AFTER baseline).
 * Run: npx tsx scripts/audit-listing-rsc-trace.ts
 */
import { performance } from 'node:perf_hooks';
import { prisma } from '../lib/prisma';
import { loadListingDetail } from '../lib/marketplace/detail/load-listing-detail';
import { loadPublicContactChannelsForUser } from '../lib/profile/load-public-contact-channels';
import { fetchAuthorBadgeSummariesByUserIds } from '../lib/gamification/author-badge-summaries';
import { fetchSellerTrustBundles } from '../lib/discovery/trust/batch-enrichment';

async function timed<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ label: string; ms: number; result: T }> {
  const t0 = performance.now();
  const result = await fn();
  return { label, ms: Math.round(performance.now() - t0), result };
}

async function main() {
  const wanted = '3b85deeb-5801-417a-a087-5b6027130ae0';
  const byId = await prisma.product.findUnique({
    where: { id: wanted },
    select: { id: true, isActive: true },
  });
  const id =
    byId?.isActive
      ? byId.id
      : (await prisma.product.findFirst({
          where: { isActive: true },
          select: { id: true },
        }))!.id;

  const steps: Array<{
    label: string;
    ms: number;
    serialOrParallel: 'serial' | 'parallel';
    class: 'A' | 'B' | 'C' | 'D';
  }> = [];

  let t = await timed('1.product.metadata_shape', () =>
    prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            User: {
              select: {
                name: true,
                username: true,
                place: true,
                displayFullName: true,
                displayNameOption: true,
              },
            },
          },
        },
        Image: { select: { fileUrl: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        reviews: {
          select: { rating: true },
          where: { reviewSubmittedAt: { not: null } },
        },
      },
    }),
  );
  steps.push({
    label: t.label,
    ms: t.ms,
    serialOrParallel: 'serial',
    class: 'A',
  });

  t = await timed('2.product.layout_jsonld', () =>
    prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            User: {
              select: {
                name: true,
                username: true,
                place: true,
                displayFullName: true,
                displayNameOption: true,
              },
            },
          },
        },
        Image: { select: { fileUrl: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        reviews: {
          where: { reviewSubmittedAt: { not: null } },
          select: {
            rating: true,
            comment: true,
            title: true,
            buyer: { select: { name: true } },
          },
          take: 10,
        },
      },
    }),
  );
  steps.push({
    label: t.label,
    ms: t.ms,
    serialOrParallel: 'serial',
    class: 'A',
  });

  const full = await timed('3.loadListingDetail.full', () => loadListingDetail(id));
  steps.push({
    label: full.label,
    ms: full.ms,
    serialOrParallel: 'serial',
    class: 'A',
  });

  const lean = await timed('4.product.detail_include', () =>
    prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            lat: true,
            lng: true,
            kvk: true,
            companyName: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true,
                place: true,
                city: true,
                lat: true,
                lng: true,
                displayFullName: true,
                displayNameOption: true,
              },
            },
          },
        },
        Image: {
          select: { id: true, fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        Video: {
          select: {
            id: true,
            url: true,
            thumbnail: true,
            duration: true,
            createdAt: true,
          },
        },
      },
    }),
  );
  steps.push({
    label: lean.label,
    ms: lean.ms,
    serialOrParallel: 'serial',
    class: 'A',
  });

  const sellerUserId = (lean.result as { seller?: { User?: { id?: string } } } | null)
    ?.seller?.User?.id;

  const parallel = await Promise.all([
    timed('5a.enrich.reviewAgg', () =>
      prisma.productReview.aggregate({
        where: {
          productId: id,
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
        },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ),
    timed('5b.enrich.contacts', () =>
      loadPublicContactChannelsForUser(sellerUserId),
    ),
    timed('5c.enrich.badges', () =>
      sellerUserId
        ? fetchAuthorBadgeSummariesByUserIds([sellerUserId], 2)
        : Promise.resolve(new Map()),
    ),
    timed('5d.enrich.stripe', () =>
      sellerUserId
        ? prisma.user.findUnique({
            where: { id: sellerUserId },
            select: {
              stripeConnectAccountId: true,
              stripeConnectOnboardingCompleted: true,
            },
          })
        : Promise.resolve(null),
    ),
    timed('5e.enrich.trust', () =>
      sellerUserId
        ? fetchSellerTrustBundles([sellerUserId])
        : Promise.resolve(new Map()),
    ),
    timed('5f.enrich.dishLite', () =>
      prisma.dish.findUnique({
        where: { id },
        select: {
          id: true,
          category: true,
          status: true,
          ingredients: true,
          instructions: true,
          plantType: true,
          materials: true,
          dimensions: true,
          notes: true,
          _count: { select: { growthPhotos: true } },
        },
      }),
    ),
  ]);

  for (const p of parallel) {
    const cls: 'A' | 'B' | 'C' | 'D' =
      p.label.includes('stripe')
        ? 'A'
        : p.label.includes('reviewAgg') || p.label.includes('dish')
          ? 'B'
          : 'B';
    steps.push({
      label: p.label,
      ms: p.ms,
      serialOrParallel: 'parallel',
      class: cls,
    });
  }

  const productReads =
    steps.filter((s) => s.label.includes('product.') || s.label.includes('loadListingDetail'))
      .length;
  // loadListingDetail includes its own product read → total product finds ≈ 3 (meta+layout+loader)

  console.log(
    JSON.stringify(
      {
        productId: id,
        productReadsApproxPerRequest: 3,
        steps,
        enrichmentParallelWallMs: Math.max(...parallel.map((p) => p.ms)),
        serialProductReadsMs: steps
          .filter((s) => s.label.match(/^[1234]\./))
          .reduce((a, s) => a + s.ms, 0),
        dominant: [...parallel].sort((a, b) => b.ms - a.ms)[0],
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

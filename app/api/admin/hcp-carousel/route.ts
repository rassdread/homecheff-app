import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  HcpCarouselPlacement,
  HcpCarouselSlideType,
  HcpCarouselTargetType,
} from '@prisma/client';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, adminRoles: true },
  });
  const ok =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN' ||
      (user.adminRoles?.length ?? 0) > 0);
  if (!ok) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user };
}

const SLIDE_TYPES: HcpCarouselSlideType[] = ['RANKING', 'PROMO', 'SPOTLIGHT', 'SPONSORED', 'INFO'];
const PLACEMENTS: HcpCarouselPlacement[] = ['HOME', 'RANKINGS', 'BOTH'];
const TARGET_TYPES: HcpCarouselTargetType[] = ['GLOBAL', 'COUNTRY', 'RADIUS'];

export async function GET() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const slides = await prisma.hcpCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ slides });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'title verplicht' }, { status: 400 });

  const slideType =
    typeof body.slideType === 'string' && SLIDE_TYPES.includes(body.slideType as HcpCarouselSlideType)
      ? (body.slideType as HcpCarouselSlideType)
      : 'PROMO';

  const placement =
    typeof body.placement === 'string' && PLACEMENTS.includes(body.placement as HcpCarouselPlacement)
      ? (body.placement as HcpCarouselPlacement)
      : 'BOTH';

  const targetType =
    typeof body.targetType === 'string' && TARGET_TYPES.includes(body.targetType as HcpCarouselTargetType)
      ? (body.targetType as HcpCarouselTargetType)
      : 'GLOBAL';

  const targetLat =
    typeof body.targetLat === 'number' && Number.isFinite(body.targetLat) ? body.targetLat : null;
  const targetLng =
    typeof body.targetLng === 'number' && Number.isFinite(body.targetLng) ? body.targetLng : null;
  const targetRadiusKm =
    typeof body.targetRadiusKm === 'number' && Number.isFinite(body.targetRadiusKm)
      ? Math.floor(body.targetRadiusKm)
      : null;

  const slide = await prisma.hcpCarouselSlide.create({
    data: {
      title,
      subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() || null : null,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl.trim() || null : null,
      ctaLabel: typeof body.ctaLabel === 'string' ? body.ctaLabel.trim() || null : null,
      ctaUrl: typeof body.ctaUrl === 'string' ? body.ctaUrl.trim() || null : null,
      backgroundStyle:
        typeof body.backgroundStyle === 'string' ? body.backgroundStyle.trim() || null : null,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
      sortOrder: typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder) ? body.sortOrder : 100,
      startsAt:
        typeof body.startsAt === 'string' && body.startsAt
          ? new Date(body.startsAt)
          : body.startsAt === null
            ? null
            : undefined,
      endsAt:
        typeof body.endsAt === 'string' && body.endsAt
          ? new Date(body.endsAt)
          : body.endsAt === null
            ? null
            : undefined,
      slideType,
      placement,
      targetType,
      targetCountry:
        typeof body.targetCountry === 'string' && body.targetCountry.trim()
          ? body.targetCountry.trim().toUpperCase()
          : null,
      targetLat,
      targetLng,
      targetRadiusKm,
      localeFilter:
        body.localeFilter === 'nl' || body.localeFilter === 'en' ? body.localeFilter : null,
      countryFilter:
        typeof body.countryFilter === 'string' && body.countryFilter.trim()
          ? body.countryFilter.trim().toUpperCase()
          : null,
    },
  });

  return NextResponse.json({ slide });
}

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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: {
    title?: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
    backgroundStyle?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
    slideType?: HcpCarouselSlideType;
    placement?: HcpCarouselPlacement;
    targetType?: HcpCarouselTargetType;
    targetCountry?: string | null;
    targetLat?: number | null;
    targetLng?: number | null;
    targetRadiusKm?: number | null;
    localeFilter?: string | null;
    countryFilter?: string | null;
  } = {};

  if (typeof body.title === 'string') data.title = body.title.trim();
  if (typeof body.subtitle === 'string') data.subtitle = body.subtitle.trim() || null;
  if (typeof body.imageUrl === 'string') data.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.ctaLabel === 'string') data.ctaLabel = body.ctaLabel.trim() || null;
  if (typeof body.ctaUrl === 'string') data.ctaUrl = body.ctaUrl.trim() || null;
  if (typeof body.backgroundStyle === 'string') data.backgroundStyle = body.backgroundStyle.trim() || null;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) data.sortOrder = body.sortOrder;
  if (typeof body.startsAt === 'string') data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.startsAt === null) data.startsAt = null;
  if (typeof body.endsAt === 'string') data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (body.endsAt === null) data.endsAt = null;
  if (typeof body.slideType === 'string' && SLIDE_TYPES.includes(body.slideType as HcpCarouselSlideType)) {
    data.slideType = body.slideType as HcpCarouselSlideType;
  }
  if (typeof body.placement === 'string' && PLACEMENTS.includes(body.placement as HcpCarouselPlacement)) {
    data.placement = body.placement as HcpCarouselPlacement;
  }
  if (typeof body.targetType === 'string' && TARGET_TYPES.includes(body.targetType as HcpCarouselTargetType)) {
    data.targetType = body.targetType as HcpCarouselTargetType;
  }
  if (typeof body.targetCountry === 'string') {
    data.targetCountry = body.targetCountry.trim() ? body.targetCountry.trim().toUpperCase() : null;
  }
  if (typeof body.targetLat === 'number' && Number.isFinite(body.targetLat)) data.targetLat = body.targetLat;
  if (body.targetLat === null) data.targetLat = null;
  if (typeof body.targetLng === 'number' && Number.isFinite(body.targetLng)) data.targetLng = body.targetLng;
  if (body.targetLng === null) data.targetLng = null;
  if (typeof body.targetRadiusKm === 'number' && Number.isFinite(body.targetRadiusKm)) {
    data.targetRadiusKm = Math.floor(body.targetRadiusKm);
  }
  if (body.targetRadiusKm === null) data.targetRadiusKm = null;
  if (body.localeFilter === 'nl' || body.localeFilter === 'en') data.localeFilter = body.localeFilter;
  if (body.localeFilter === null || body.localeFilter === '') data.localeFilter = null;
  if (typeof body.countryFilter === 'string') {
    data.countryFilter = body.countryFilter.trim() ? body.countryFilter.trim().toUpperCase() : null;
  }

  try {
    const slide = await prisma.hcpCarouselSlide.update({
      where: { id },
      data,
    });
    return NextResponse.json({ slide });
  } catch {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;

  const { id } = await ctx.params;
  try {
    await prisma.hcpCarouselSlide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }
}

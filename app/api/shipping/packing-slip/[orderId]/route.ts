import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildHomecheffPackingSlipHtml } from '@/lib/shipping/packing-slip';
import {
  resolveEcosystemLanguage,
  ECOSYSTEM_LOCALE_COOKIE,
  ECOSYSTEM_LOCALE_PREF_COOKIE,
  MARKETPLACE_LEGACY_LOCALE_COOKIE,
} from '@/lib/ecosystem-locale';

export const dynamic = 'force-dynamic';

/** Seller/admin printable HomeCheff packing slip (does not alter carrier label). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await params;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, preferredLanguage: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      User: { select: { name: true } },
      items: {
        include: {
          Product: {
            select: {
              title: true,
              seller: { include: { User: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isSeller = order.items.some(
    (i) => i.Product?.seller?.User?.id === user.id,
  );
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  if (!isSeller && !isAdmin && order.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pref = req.cookies.get(ECOSYSTEM_LOCALE_PREF_COOKIE)?.value === '1';
  const cookieLang =
    req.cookies.get(ECOSYSTEM_LOCALE_COOKIE)?.value ||
    req.cookies.get(MARKETPLACE_LEGACY_LOCALE_COOKIE)?.value;
  const locale = resolveEcosystemLanguage({
    explicitLanguage: pref ? cookieLang : null,
    accountLanguage: user.preferredLanguage,
    cookieLanguage: cookieLang,
    countryCode: req.headers.get('x-vercel-ip-country'),
  });

  const html = buildHomecheffPackingSlipHtml({
    orderNumber: order.orderNumber || order.id.slice(0, 8),
    sellerName: order.items[0]?.Product?.seller?.User?.name || 'Verkoper',
    buyerName: order.User?.name || 'Koper',
    items: order.items.map((i) => ({
      title: i.Product?.title || 'Artikel',
      quantity: i.quantity,
    })),
    trackingCode: order.shippingTrackingNumber || undefined,
    locale,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

/**
 * List delivery jobs for:
 * - individual / company profile owner (all jobs on their DeliveryProfile)
 * - company DRIVER / DISPATCHER (jobs on company profile; drivers see assigned or all for dispatch)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const userId =
      (session.user as { id?: string }).id ||
      (
        await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true },
        })
      )?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const statusFilter = req.nextUrl.searchParams.get('status');
    const statuses = statusFilter
      ? statusFilter.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId },
    });

    const memberships = await prisma.deliveryCompanyMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        companyProfileId: true,
        role: true,
        companyProfile: { select: { providerType: true } },
      },
    });

    const companyIds = memberships
      .filter((m) => isDeliveryBusinessProvider(m.companyProfile.providerType))
      .map((m) => m.companyProfileId);

    const orClauses: Array<Record<string, unknown>> = [];
    if (profile) {
      orClauses.push({ deliveryProfileId: profile.id });
    }
    if (companyIds.length > 0) {
      orClauses.push({ deliveryProfileId: { in: companyIds } });
    }
    // Assigned driver jobs (even if membership query missed)
    orClauses.push({ assignedDriverUserId: userId });

    if (orClauses.length === 0) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    const where: Record<string, unknown> = { OR: orClauses };
    if (statuses?.length) {
      where.status = { in: statuses };
    }

    const orders = await prisma.deliveryOrder.findMany({
      where,
      include: {
        order: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        deliveryProfile: {
          select: {
            id: true,
            providerType: true,
            companyDisplayName: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Drivers without dispatch role only see their assigned jobs (+ nothing unassigned)
    const driverOnlyCompanyIds = new Set(
      memberships
        .filter((m) => m.role === 'DRIVER')
        .map((m) => m.companyProfileId),
    );
    const isOwnerOf = profile
      ? new Set([profile.id])
      : new Set<string>();
    const canDispatchCompany = new Set(
      memberships
        .filter((m) => m.role === 'OWNER' || m.role === 'DISPATCHER')
        .map((m) => m.companyProfileId),
    );

    const filtered = orders.filter((o) => {
      if (!o.deliveryProfileId) return false;
      if (isOwnerOf.has(o.deliveryProfileId)) return true;
      if (canDispatchCompany.has(o.deliveryProfileId)) return true;
      if (o.assignedDriverUserId === userId) return true;
      // DRIVER role: only assigned
      if (driverOnlyCompanyIds.has(o.deliveryProfileId)) {
        return o.assignedDriverUserId === userId;
      }
      return false;
    });

    return NextResponse.json({ orders: filtered });
  } catch (error) {
    console.error('Delivery orders fetch error:', error);
    return NextResponse.json(
      {
        error: 'Er is een fout opgetreden bij het ophalen van bestellingen',
      },
      { status: 500 },
    );
  }
}

// Create a new delivery order (unassigned – bezorgers zien hem in dashboard en accepteren daar)
// Normaal wordt dit gedaan door de Stripe webhook na betaling; deze POST is voor fallback/alternatieve flows.
export async function POST(req: NextRequest) {
  try {
    const { orderId, deliveryMode, address, deliveryFeeCents } = await req.json();

    if (
      deliveryMode !== 'TEEN_DELIVERY' &&
      deliveryMode !== 'DELIVERY' &&
      deliveryMode !== 'LOCAL_PROVIDER'
    ) {
      return NextResponse.json({ message: 'Geen delivery order nodig voor deze mode' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, deliveryAddress: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 });
    }

    const existing = await prisma.deliveryOrder.findUnique({
      where: { orderId },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        deliveryOrder: existing,
        message: 'DeliveryOrder bestond al',
      });
    }

    const deliveryOrder = await prisma.deliveryOrder.create({
      data: {
        orderId,
        deliveryProfileId: null,
        deliveryAddress: address ?? order.deliveryAddress ?? '',
        deliveryFee: deliveryFeeCents ?? 200,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, deliveryOrder });
  } catch (error) {
    console.error('Delivery order create error:', error);
    return NextResponse.json({ error: 'Kon bezorgopdracht niet aanmaken' }, { status: 500 });
  }
}

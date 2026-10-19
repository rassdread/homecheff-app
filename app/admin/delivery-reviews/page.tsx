import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { customerRefundStatus, REFUND_STATUS_COPY } from '@/lib/delivery/delivery-refund-review';

export const dynamic = 'force-dynamic';

export default async function DeliveryReviewsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) redirect('/');

  const cases = await prisma.deliveryOrder.findMany({
    where: { notes: { contains: 'REVIEW_REQUIRED_NO_AUTOMATIC_STRIPE_REFUND' } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, orderId: true, status: true, updatedAt: true },
  });
  const decisions = await prisma.deliveryRefundDecision.findMany({
    where: { deliveryOrderId: { in: cases.map((row) => row.id) } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
      <h1>Bezorging terugbetalingen</h1>
      <p>Een pagina openen voert geen terugbetaling uit. Bevestig een besluit via de admin-actie.</p>
      {cases.length === 0 ? <p>Geen open beoordelingen.</p> : null}
      <ul>
        {cases.map((row) => {
          const prior = decisions.filter((item) => item.deliveryOrderId === row.id);
          const latest = prior[0] ?? null;
          const status = customerRefundStatus(latest);
          return (
            <li key={row.id} style={{ marginBottom: 16 }}>
              <div>Boeking {row.id}</div>
              <div>Order {row.orderId ?? 'standalone'}</div>
              <div>Status {row.status} · {REFUND_STATUS_COPY[status].nl}</div>
              <div>Bijgewerkt {row.updatedAt.toISOString()}</div>
              <div>Eerdere besluiten: {prior.length}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

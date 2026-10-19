import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { customerRefundStatus, REFUND_STATUS_COPY } from '@/lib/delivery/delivery-refund-review';
import { describeDeliveryPayout } from '@/lib/delivery/delivery-ops-queue';

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
  const failedPayouts = await prisma.payout.findMany({
    where: {
      id: { startsWith: 'payout_delivery_' },
      OR: [{ transferFailureCode: { not: null } }, { providerRef: 'failed_connect_missing' }],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const marketplaceCases = await prisma.deliveryOrder.findMany({
    where: {
      origin: 'MARKETPLACE',
      quotedFeeCents: { gt: 0 },
      status: { in: ['CANCELLED', 'CANCELLED_AFTER_PAYMENT'] },
      order: { stripeSessionId: { not: null } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, orderId: true, quotedFeeCents: true, status: true },
  });
  const failedTransfers = failedPayouts.map(describeDeliveryPayout);

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
      <h2>Mislukte bezorger-overboekingen</h2>
      <p>Deze lijst maakt geen overboeking en probeert niets opnieuw.</p>
      {failedTransfers.length === 0 ? <p>Geen mislukte overboekingen.</p> : null}
      <ul>
        {failedTransfers.map((row) => (
          <li key={row.payoutId} style={{ marginBottom: 16 }}>
            <div>Boeking {row.deliveryOrderId}</div>
            <div>Bezorger {row.courierUserId}</div>
            <div>{row.amountCents} cent {row.currency}</div>
            <div>Fout {row.failureCategory}</div>
            <div>Overboeking aanwezig: {row.transferExists ? 'ja' : 'nee'}</div>
            <div>Ledger {row.ledgerState}</div>
            <div>Opnieuw proberen vanuit dit scherm: nee</div>
          </li>
        ))}
      </ul>
      <h2>Marketplace-bezorging</h2>
      <p>De betaling hoort bij de marketplace-order. Er wordt hier geen terugbetaling uitgevoerd.</p>
      {marketplaceCases.length === 0 ? <p>Geen open marketplace-uitzonderingen.</p> : null}
      <ul>
        {marketplaceCases.map((row) => (
          <li key={row.id} style={{ marginBottom: 16 }}>
            <div>Boeking {row.id}</div>
            <div>Order {row.orderId}</div>
            <div>Bezorgbedrag {row.quotedFeeCents} cent</div>
            <div>Status {row.status} · handmatige afhandeling</div>
          </li>
        ))}
      </ul>
    </main>
  );
}

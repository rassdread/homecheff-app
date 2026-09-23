import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getVlaardingenDensityReport } from '@/lib/analytics/vlaardingen-density.server';

export const dynamic = 'force-dynamic';

export default async function VlaardingenDensityPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, adminRoles: true },
  });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const hasAdminRoles = (user?.adminRoles?.length ?? 0) > 0;
  if (!user || (!isAdmin && !hasAdminRoles)) redirect('/');

  const report = await getVlaardingenDensityReport();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <p className="text-sm">
        <Link href="/admin" className="text-emerald-800 underline">
          Admin
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-gray-900">Vlaardingen marketplace density</h1>
      <p className="text-sm text-gray-600">
        Straal {report.radiusKm} km rond het stadscentrum, dezelfde bbox als de city hub.
        Indexatie: {report.indexable ? 'indexeerbaar' : 'noindex'}. {report.indexReason}
      </p>
      <p className="text-xs text-gray-500">Gemeten op {report.generatedAt}</p>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Actieve makers</p>
          <p className="text-2xl font-semibold">{report.activeMakers ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Actieve listings</p>
          <p className="text-2xl font-semibold">{report.activeListings ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Categorieën met aanbod</p>
          <p className="text-sm text-gray-800">
            {report.categoriesWithSupply.length === 0
              ? 'Geen'
              : report.categoriesWithSupply
                  .map((row) => `${row.category}: ${row.listings}`)
                  .join(' · ')}
          </p>
        </div>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-3">Metric</th>
            <th className="py-2 pr-3">7 dagen</th>
            <th className="py-2 pr-3">Vorige 7</th>
            <th className="py-2 pr-3">30 dagen</th>
            <th className="py-2">Vorige 30</th>
          </tr>
        </thead>
        <tbody>
          {report.metrics.map((metric) => (
            <tr key={metric.id} className="border-b border-gray-100">
              <td className="py-2 pr-3">
                <div className="font-medium text-gray-900">{metric.label}</div>
                {!metric.available ? (
                  <div className="text-xs text-gray-500">{metric.reason}</div>
                ) : null}
              </td>
              {metric.available ? (
                <>
                  <td className="py-2 pr-3">{metric.last7}</td>
                  <td className="py-2 pr-3">{metric.previous7}</td>
                  <td className="py-2 pr-3">{metric.last30}</td>
                  <td className="py-2">{metric.previous30}</td>
                </>
              ) : (
                <td className="py-2 text-gray-500" colSpan={4}>
                  Niet beschikbaar
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

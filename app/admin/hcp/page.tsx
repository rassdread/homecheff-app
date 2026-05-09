import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { loadAdminHcpOverview } from '@/lib/gamification/admin-hcp-overview-data';
import HcpPromoDisableButton from '@/components/admin/HcpPromoDisableButton';

export const dynamic = 'force-dynamic';

function lifecycleNl(k: string) {
  switch (k) {
    case 'active':
      return 'Actief (nu zichtbaar m.b.v. filters)';
    case 'scheduled':
      return 'Gepland';
    case 'expired':
      return 'Verlopen';
    case 'inactive':
      return 'Inactief / uit';
    default:
      return k;
  }
}

export default async function AdminHcpOverviewPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, adminRoles: true },
  });

  const ok =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN' ||
      (user.adminRoles?.length ?? 0) > 0);

  if (!ok) redirect('/');

  const data = await loadAdminHcpOverview();

  const buckets = {
    active: data.slides.filter((s) => s.lifecycle === 'active'),
    scheduled: data.slides.filter((s) => s.lifecycle === 'scheduled'),
    expired: data.slides.filter((s) => s.lifecycle === 'expired'),
    inactive: data.slides.filter((s) => s.lifecycle === 'inactive'),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HCP V3 — overzicht</h1>
            <p className="text-sm text-gray-600 mt-1">
              Automatische beloningen (rule-based), carousel-slides en ranglijsten. Laatste snapshot:{' '}
              {new Date(data.generatedAt).toLocaleString('nl-NL')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/hcp-carousel"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Carousel beheer
            </Link>
            <Link href="/admin" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Admin home
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Automatisering (samenvatting)</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Badges en HCP-beloningen worden server-side geëvalueerd (o.a. na HCP-toekenning en bij GET /api/gamification/me).</li>
            <li>
              Homepage-carousel en ranglijst-promo&apos;s combineren vaste automatische slides met actieve admin-slides;
              verlopen of inactieve slides vallen weg (datum + isActive + targeting).
            </li>
            <li>Ranglijsten komen uit dezelfde leaderboard-endpoints als de publieke pagina; geen frontend-only nepbeloningen.</li>
            <li>
              Locatie targeting gebruikt opgeslagen profielzone en optionele sessie-GPS; er worden geen exacte coördinaten publiek
              getoond.
            </li>
            <li>Geen HCP-geldprijzen of Stripe voor deze automatische beloningen — alleen zichtbaarheid / interne status.</li>
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['active', 'scheduled', 'expired', 'inactive'] as const).map((k) => (
            <div key={k} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{lifecycleNl(k)}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data.lifecycleCounts[k]}</p>
              <p className="text-xs text-gray-500 mt-1">Alle slide-types in DB</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Carousel-plaatsing (actieve promo&apos;s nu)</h2>
          <p className="text-sm text-gray-600 mt-1">Alleen slides met type PROMO of SPONSORED en lifecycle &quot;actief&quot;.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>
              <strong>HOME</strong>: {data.placementActivePromo.HOME}
            </span>
            <span>
              <strong>RANKINGS</strong>: {data.placementActivePromo.RANKINGS}
            </span>
            <span>
              <strong>BOTH</strong>: {data.placementActivePromo.BOTH}
            </span>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-800">Targeting (zelfde subset)</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span>
              <strong>GLOBAL</strong>: {data.targetingActivePromo.GLOBAL}
            </span>
            <span>
              <strong>COUNTRY</strong>: {data.targetingActivePromo.COUNTRY}
            </span>
            <span>
              <strong>RADIUS</strong>: {data.targetingActivePromo.RADIUS}
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900">Promo-slides (PROMO / SPONSORED)</h2>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Bewerken: spring naar de slide op de carousel-pagina en gebruik <strong>Velden</strong> (titel, subtitel, CTA)
            of pas plaatsing/targeting/datum daar aan. Uitschakelen zet <code className="text-xs">isActive</code> uit.
          </p>
          <table className="min-w-[960px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-3">Titel</th>
                <th className="py-2 pr-3">Plaatsing</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">Land</th>
                <th className="py-2 pr-3">Straal km</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">Einde</th>
                <th className="py-2 pr-3">CTA</th>
                <th className="py-2 pr-3">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.promoSlides.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3 font-medium text-gray-900 max-w-[200px] truncate" title={s.title}>
                    {s.title}
                  </td>
                  <td className="py-2 pr-3">{s.placement}</td>
                  <td className="py-2 pr-3">{s.targetType}</td>
                  <td className="py-2 pr-3">{s.targetCountry ?? '—'}</td>
                  <td className="py-2 pr-3">{s.targetRadiusKm ?? '—'}</td>
                  <td className="py-2 pr-3">{lifecycleNl(s.lifecycle)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {s.startsAt ? new Date(s.startsAt).toLocaleString('nl-NL') : '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {s.endsAt ? new Date(s.endsAt).toLocaleString('nl-NL') : '—'}
                  </td>
                  <td className="py-2 pr-3 max-w-[140px] truncate" title={s.ctaLabel ?? ''}>
                    {s.ctaLabel ?? '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/hcp-carousel#hcp-slide-${s.id}`}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Bewerken
                      </Link>
                      <HcpPromoDisableButton slideId={s.id} disabled={!s.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.promoSlides.length === 0 ? <p className="text-sm text-gray-500 mt-4">Geen promo-slides in database.</p> : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900">Automatische HCP-beloningen (rule-based)</h2>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Geen handmatige uitbetaling. &quot;Laatste evaluatie&quot; = laatste wijziging op een{' '}
            <code className="text-xs">UserHcpReward</code>-rij voor die slug (aanmaak/update). Evaluatie gebeurt bij events, niet
            via zware polling.
          </p>
          <p className="text-sm text-gray-700 mb-4">
            Totaal actieve toekenningen: <strong>{data.totalActiveGrants}</strong> · Unieke gebruikers met minstens één actieve
            beloning: <strong>{data.usersWithActiveGrant}</strong>
            {data.lastRewardDbTouch ? (
              <>
                {' '}
                · Laatste DB-touch (alle slugs):{' '}
                <strong>{new Date(data.lastRewardDbTouch).toLocaleString('nl-NL')}</strong>
              </>
            ) : null}
          </p>
          <table className="min-w-[880px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-3">Beloning</th>
                <th className="py-2 pr-3">Trigger</th>
                <th className="py-2 pr-3">Nu eligible (approx)</th>
                <th className="py-2 pr-3">Actieve grants</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Laatste reward-rij</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rewardRows.map((r) => (
                <tr key={r.slug}>
                  <td className="py-2 pr-3 font-medium">{r.title}</td>
                  <td className="py-2 pr-3 text-gray-700">{r.trigger}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.eligibleUsers}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.activeGrants}</td>
                  <td className="py-2 pr-3 text-gray-600">{r.statusNote}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {r.lastEvaluatedAt ? new Date(r.lastEvaluatedAt).toLocaleString('nl-NL') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Uitgelichte maker (week · wereldwijd)</h2>
          {data.featuredWeek ? (
            <p className="mt-2 text-sm text-gray-800">
              #{data.featuredWeek.rank} {data.featuredWeek.displayName}{' '}
              {data.featuredWeek.username ? `(@${data.featuredWeek.username})` : ''} —{' '}
              {data.featuredWeek.score.toLocaleString('nl-NL')} HCP
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Nog geen weekscores.</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Top 5 ranglijsten (wereldwijd)</h2>
          {(['week', 'month', 'year'] as const).map((period) => (
            <div key={period}>
              <h3 className="text-sm font-semibold text-gray-800 capitalize">{period}</h3>
              <ol className="mt-2 space-y-1 text-sm text-gray-700">
                {data.leaderboards[period].length === 0 ? (
                  <li className="text-gray-500">Geen rijen.</li>
                ) : (
                  data.leaderboards[period].map((r) => (
                    <li key={`${period}-${r.rank}-${r.displayName}`}>
                      #{r.rank} {r.displayName}
                      {r.username ? ` (@${r.username})` : ''} — {r.score.toLocaleString('nl-NL')} HCP
                    </li>
                  ))
                )}
              </ol>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-amber-50/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Slide buckets (detail)</h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            {(['active', 'scheduled', 'expired', 'inactive'] as const).map((k) => (
              <div key={k}>
                <h3 className="text-sm font-semibold text-gray-800">{lifecycleNl(k)}</h3>
                <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-gray-700 space-y-1">
                  {buckets[k].length === 0 ? <li className="text-gray-500">—</li> : null}
                  {buckets[k].map((s) => (
                    <li key={s.id}>
                      <span className="font-medium">{s.title}</span> · {s.slideType} · {s.placement} · {s.targetType}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

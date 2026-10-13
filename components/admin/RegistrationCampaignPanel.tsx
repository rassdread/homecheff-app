import type { MeasuredCount, RegistrationCampaignView } from '@/lib/admin/user-population';

function Stat({ label, item }: { label: string; item: MeasuredCount }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">
        {item.value === null ? 'Niet gemeten' : item.value}
      </p>
      <p className="text-xs text-gray-600 mt-1">{item.definition}</p>
      <p className="text-xs text-gray-500 mt-1">{item.period}</p>
      <p className="text-xs text-gray-500">{item.source}</p>
      <p className={`text-xs mt-1 ${item.complete ? 'text-emerald-700' : 'text-amber-800'}`}>
        {item.complete ? 'Meting volledig' : 'Meting onvolledig'}
      </p>
    </div>
  );
}

export default function RegistrationCampaignPanel({
  campaign,
}: {
  campaign: RegistrationCampaignView;
}) {
  const totals = [
    ['Echte gebruikers', campaign.realUsers],
    ['Nieuw vandaag', campaign.newToday],
    ['Nieuw, 7 dagen', campaign.new7Days],
    ['Nieuw, 30 dagen', campaign.new30Days],
    ['Geverifieerd', campaign.verified],
    ['Niet geverifieerd', campaign.unverified],
  ] as const;
  const sources = [
    ['Meta', campaign.marketingMeta],
    ['Organisch vastgelegd', campaign.marketingOrganic],
    ['Andere vastgelegde bron', campaign.marketingOther],
    ['Onbekende herkomst', campaign.marketingUnknown],
    ['Affiliate-registraties', campaign.affiliateRegistrations],
    ['Meta én affiliate', campaign.metaAffiliateOverlap],
  ] as const;
  const funnel = [
    ['Registratie gestart', campaign.funnel.registrationStarted],
    ['Registratie afgerond', campaign.funnel.registrationCompleted],
    ['E-mail geverifieerd', campaign.funnel.emailVerified],
    ['Account geactiveerd', campaign.funnel.accountActivated],
    ['Eerste listing gemaakt', campaign.funnel.firstListingCreated],
    ['Eerste listing gepubliceerd', campaign.funnel.firstListingPublished],
    ['Eerste transactie afgerond', campaign.funnel.firstTransactionCompleted],
  ] as const;
  const meta = [
    ['Meta geregistreerd', campaign.metaFunnel.registered],
    ['Meta geverifieerd', campaign.metaFunnel.verified],
    ['Meta geactiveerd', campaign.metaFunnel.activated],
    ['Meta eerste listing', campaign.metaFunnel.firstListing],
    ['Meta eerste transactie', campaign.metaFunnel.firstTransaction],
  ] as const;

  return (
    <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Campagne & registratie</h3>
        <p className="text-xs text-gray-500 mt-1">{campaign.separationNote}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Echte accounts</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {totals.map(([label, item]) => (
            <Stat key={label} label={label} item={item} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Herkomst, niet bij elkaar optellen
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sources.map(([label, item]) => (
            <Stat key={label} label={label} item={item} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Conversietrechter</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {funnel.map(([label, item]) => (
            <div key={label} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-lg font-semibold text-gray-900">
                {item.value === null ? 'Niet gemeten' : item.value}
              </p>
              <p className="text-xs text-gray-600 mt-1">{item.definition}</p>
              <p className="text-xs text-gray-500 mt-1">{item.period} · {item.source}</p>
              <p className={`text-xs mt-1 ${item.complete ? 'text-emerald-700' : 'text-amber-800'}`}>
                {item.complete ? 'Meting volledig' : 'Meting onvolledig'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Meta-trechter</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {meta.map(([label, item]) => (
            <div key={label} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-lg font-semibold text-gray-900">
                {item.value === null ? 'Niet gemeten' : item.value}
              </p>
              <p className="text-xs text-gray-600 mt-1">{item.definition}</p>
              <p className={`text-xs mt-1 ${item.complete ? 'text-emerald-700' : 'text-amber-800'}`}>
                {item.complete ? 'Meting volledig' : 'Meting onvolledig'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';

type Overview = {
  programs: Array<{ code: string; name: string; status: string; isPublicDefault: boolean; publicEarlyEnabled: boolean; subAffiliateLimit: number | null }>;
  markets: Array<{ countryCode: string; recruitmentState: string; homecheffActive: boolean; program: { name: string } | null }>;
  counts: {
    affiliates: number;
    mains: number;
    subs: number;
    active: number;
    enrollments: number;
    migrated: number;
    promos: number;
    attributions: number;
    ledgers: number;
  };
  population?: {
    rawRows: number;
    commercialParticipants: number;
    confirmedPublicSignups: number;
    confirmedAdminAdmissions: number;
    likelyHistorical: number;
    reviewRequired: number;
    internalIdentities: number;
    technicalIdentities: number;
    testCertification: number;
    excludedFromBusinessMetrics: number;
    explicitEffectiveMain: number;
    mainFromProgram: number;
    mainFromAdminOverride: number;
    totalSubRelationships: number;
    activeCommercialSubs: number;
    testSubsExcluded: number;
  };
  preview: { newAffiliatesAffected: string; existingAffiliatesRewritten: number; grandfatheredPreserved: number };
};

export default function AffiliateProgramControl() {
  const [data, setData] = useState<Overview | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('OPEN');

  async function load() {
    const res = await fetch('/api/admin/affiliate-program');
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(body: Record<string, unknown>) {
    setMessage(null);
    const res = await fetch('/api/admin/affiliate-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, confirm: true, reason }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(payload.correction || payload.error || 'Mislukt');
      return;
    }
    setMessage('Opgeslagen. Bestaande financiële geschiedenis blijft staan.');
    await load();
  }

  if (!data) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">HomeCheff-beheer · affiliateprogramma</h2>
        <p className="text-sm text-slate-600">
          Een beheerder kan de openbare instroom sluiten zonder bestaande affiliates, portefeuilles of commissies te wijzigen.
          Nieuwe affiliates geraakt: {data.preview.newAffiliatesAffected}. Bestaande herschreven: {data.preview.existingAffiliatesRewritten}. Beschermd: {data.preview.grandfatheredPreserved}.
        </p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>Affiliate-rijen: {data.population?.rawRows ?? data.counts.affiliates}</div>
        <div>Commerciële affiliates: {data.population?.commercialParticipants ?? '—'}</div>
        <div>Waarschijnlijk historisch: {data.population?.likelyHistorical ?? '—'}</div>
        <div>Nog beoordelen: {data.population?.reviewRequired ?? '—'}</div>
        <div>MAIN (expliciet): {data.population?.explicitEffectiveMain ?? data.counts.mains} · bron programma {data.population?.mainFromProgram ?? '—'}</div>
        <div>SUB commercieel: {data.population?.activeCommercialSubs ?? data.counts.subs} · test-SUB buiten telling {data.population?.testSubsExcluded ?? '—'}</div>
        <div>Intern: {data.population?.internalIdentities ?? '—'} · technisch: {data.population?.technicalIdentities ?? '—'}</div>
        <div>Test/certificatie buiten telling: {data.population?.testCertification ?? '—'}</div>
        <div>Bevestigde openbare aanmeldingen: {data.population?.confirmedPublicSignups ?? 0}</div>
        <div>Beheerderstoelatingen: {data.population?.confirmedAdminAdmissions ?? 0}</div>
        <div>Portefeuilles {data.counts.attributions} · promocodes {data.counts.promos} · grootboek {data.counts.ledgers}</div>
      </dl>
      <div className="text-sm">
        {data.programs.map((program) => (
          <p key={program.code}>
            {program.name} ({program.code}) · {program.status}
            {program.isPublicDefault ? ' · openbaar standaard' : ''}
            {program.publicEarlyEnabled ? ' · vroege tekst aan' : ''}
            {' · SUB-limiet '}
            {program.subAffiliateLimit === null ? 'onbeperkt' : program.subAffiliateLimit}
          </p>
        ))}
        {data.markets.map((market) => (
          <p key={market.countryCode}>
            {market.countryCode}: HomeCheff {market.homecheffActive ? 'actief' : 'niet actief'} · werving {market.recruitmentState} · {market.program?.name || 'geen programma'}
          </p>
        ))}
      </div>
      <label className="block text-sm">
        Reden voor wijziging
        <input className="mt-1 w-full rounded border px-2 py-1" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2 text-sm">
        <select className="rounded border px-2 py-1" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="LIMITED">LIMITED</option>
          <option value="WAITLIST">WAITLIST</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button type="button" className="rounded bg-slate-900 px-3 py-1 text-white" onClick={() => act({ action: 'setRecruitment', countryCode: 'NL', recruitmentState: state })}>
          Zet NL-werving
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setProgramFlags', programCode: 'EARLY_AFFILIATE_V1', publicEarlyEnabled: false })}>
          Zet vroege tekst uit
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setProgramFlags', programCode: 'EARLY_AFFILIATE_V1', publicEarlyEnabled: true })}>
          Zet vroege tekst aan
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'createProgram', programCode: 'STANDARD_AFFILIATE_V2', name: 'Standaard' })}>
          Maak Standaard-programma
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setPublicAvailability', countryCode: 'NL', programCode: 'STANDARD_AFFILIATE_V2', publicMain: false, publicNetwork: false, publicPromo: true })}>
          NL openbaar: Standaard, zonder MAIN/netwerk
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setPublicAvailability', countryCode: 'NL', publicMain: false, publicNetwork: false })}>
          Publieke MAIN en netwerk uit
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setPublicAvailability', countryCode: 'NL', publicMain: true, publicNetwork: true, publicPromo: true })}>
          Publieke Vroege rechten aan
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setPublicAvailability', countryCode: 'NL', desiredMainCount: 10 })}>
          Dekkingsdoel MAIN 10
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'applyPreset', affiliateId, preset: 'MAIN_NETWORK' })}>
          Privé: MAIN / netwerk, onbeperkt
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'applyPreset', affiliateId, preset: 'MAIN_NETWORK', subLimitMode: 'LIMITED', subLimit: 10 })}>
          Privé: 10 SUB
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'savePolicyDraft', code: 'STANDARD_AFFILIATE_V2_POLICY', durationMode: 'FIXED_DURATION', durationMonths: 24, durationClock: 'FROM_FIRST_QUALIFYING_PAYMENT', directPoolBps: 10000, subPoolBps: 8000, mainPoolBps: 2000 })}>
          Concept toekomstige polis
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'publishPolicy', code: 'STANDARD_AFFILIATE_V2_POLICY' })}>
          Publiceer die polis
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <input className="rounded border px-2 py-1" placeholder="affiliate-id" value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} />
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setOverride', affiliateId, promoCodes: true, inviteSubs: true, becomeMain: true, subLimitMode: 'UNLIMITED' })}>
          Promo, MAIN, onbeperkt SUB
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'setOverride', affiliateId, subLimitMode: 'LIMITED', subLimit: 1 })}>
          SUB-limiet 1
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'resetOverride', affiliateId })}>
          Terug naar standaard
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={async () => {
            const res = await fetch(`/api/admin/affiliate-program?affiliateId=${encodeURIComponent(affiliateId)}`);
            const payload = await res.json();
            const caps = payload.detail?.capabilities || {};
            const lines = Object.entries(caps).map(([key, value]) => {
              const row = value as { value: boolean; source: string };
              return `${key}: ${row.value ? 'aan' : 'uit'} · bron ${row.source}`;
            });
            const limit = payload.detail?.subAffiliateLimit;
            const head = [
              `Klasse ${payload.detail?.populationClass || 'onbekend'}`,
              `Deelnemer ${payload.detail?.commercialParticipant ? 'commercieel' : 'niet commercieel'}`,
              `Herkomst ${payload.detail?.enrollmentSource || 'geen inschrijving'}`,
              `Voorwaarden ${payload.detail?.termsAcceptedAt ? 'vastgelegd' : 'niet vastgelegd'}`,
              `SUB-limiet effectief ${limit?.value === null ? 'onbeperkt' : limit?.value} · bron ${limit?.source}`,
            ];
            setDetail([...head, ...lines].join('\n'));
          }}
        >
          Toon effectief en bron
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <input className="rounded border px-2 py-1" placeholder="e-mail voor handmatige toelating" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'admit', email, countryCode: 'NL' })}>
          Handmatig toelaten
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={() => act({ action: 'deleteLedger' })}>
          Grootboek wissen
        </button>
      </div>
      {detail ? <pre className="whitespace-pre-wrap text-xs text-slate-700">{detail}</pre> : null}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}

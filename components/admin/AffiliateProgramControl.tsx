'use client';

import { useEffect, useState } from 'react';
import { describeAffiliateCounts } from '@/lib/affiliate/population';

type Program = {
  code: string;
  name: string;
  status: string;
  isPublicDefault: boolean;
  publicEarlyEnabled: boolean;
  subAffiliateLimit: number | null;
};

type Market = {
  countryCode: string;
  recruitmentState: string;
  homecheffActive: boolean;
  publicMainAvailable?: boolean;
  publicNetworkAvailable?: boolean;
  publicPromoAvailable?: boolean;
  desiredMainCount?: number | null;
  program: { name: string; code?: string } | null;
};

type Policy = { code: string; status: string };

type Overview = {
  programs: Program[];
  markets: Market[];
  policies?: Policy[];
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
    mainFromOtherExplicitSource: number;
    totalSubRelationships: number;
    activeCommercialSubs: number;
    testSubsExcluded: number;
  };
  preview: { newAffiliatesAffected: string; existingAffiliatesRewritten: number; grandfatheredPreserved: number };
};

type Detail = {
  populationClass?: string | null;
  commercialParticipant?: boolean;
  enrollmentSource?: string | null;
  termsAcceptedAt?: string | null;
  capabilities?: Record<string, { value: boolean; source: string }>;
  subAffiliateLimit?: { value: number | null; source: string };
};

const RECRUITMENT_LABEL: Record<string, string> = {
  OPEN: 'Open',
  LIMITED: 'Beperkt',
  WAITLIST: 'Wachtlijst',
  CLOSED: 'Gesloten',
};

function useProgram() {
  const [data, setData] = useState<Overview | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/affiliate-program');
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(body: Record<string, unknown>, reason: string) {
    setMessage(null);
    if (reason.trim().length < 3) {
      setMessage('Vul een reden van minstens 3 tekens in.');
      return false;
    }
    const res = await fetch('/api/admin/affiliate-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, confirm: true, reason: reason.trim() }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(payload.correction || payload.error || payload.reason || 'Mislukt');
      return false;
    }
    setMessage('Opgeslagen. Bestaande financiële geschiedenis blijft staan.');
    await load();
    return true;
  }

  return { data, message, act, load };
}

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-gray-700">
      Reden voor wijziging
      <input
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SaveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white">
      {label}
    </button>
  );
}

export function AffiliateOverviewStrip() {
  const { data } = useProgram();
  if (!data?.population) return null;
  const copy = describeAffiliateCounts(data.population);
  const nl = data.markets.find((market) => market.countryCode === 'NL');
  const recruitment = RECRUITMENT_LABEL[nl?.recruitmentState || ''] || nl?.recruitmentState || 'Onbekend';
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900">Kerncijfers</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-medium text-emerald-900">Commerciële affiliates</p>
          <p className="text-2xl font-semibold text-gray-900">{data.population.commercialParticipants}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-gray-600">Nog te beoordelen</p>
          <p className="text-2xl font-semibold text-gray-900">{data.population.reviewRequired}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-gray-600">Actieve rijen</p>
          <p className="text-2xl font-semibold text-gray-900">{data.counts.active}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-gray-600">NL-werving</p>
          <p className="text-2xl font-semibold text-gray-900">{recruitment}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>{copy.commercial}</p>
        <p>{copy.review}</p>
        <p>{copy.outside}</p>
        <p>{copy.allRows}</p>
        <p>Actieve rijen zijn affiliates met status ACTIVE. Die status bevat ook historische, interne en testaccounts.</p>
      </div>
    </section>
  );
}

export function AffiliateProgramSettings() {
  const { data, message, act } = useProgram();
  const [recruitment, setRecruitment] = useState('OPEN');
  const [recruitmentReason, setRecruitmentReason] = useState('');
  const [rightsChoice, setRightsChoice] = useState('standard-no-main');
  const [rightsReason, setRightsReason] = useState('');
  const [earlyOn, setEarlyOn] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');
  const [draftReason, setDraftReason] = useState('');
  const [publishReason, setPublishReason] = useState('');

  useEffect(() => {
    const nl = data?.markets.find((market) => market.countryCode === 'NL');
    if (nl?.recruitmentState) setRecruitment(nl.recruitmentState);
    const early = data?.programs.find((program) => program.code === 'EARLY_AFFILIATE_V1');
    if (early) setEarlyOn(early.publicEarlyEnabled);
  }, [data]);

  if (!data) return <p className="text-sm text-gray-600">Programma-instellingen laden…</p>;
  const nl = data.markets.find((market) => market.countryCode === 'NL');
  const early = data.programs.find((program) => program.code === 'EARLY_AFFILIATE_V1');
  const policy = data.policies?.find((item) => item.code === 'STANDARD_AFFILIATE_V2_POLICY');

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Nederlandse werving</h3>
        <p className="text-sm text-gray-700">
          Nu: {RECRUITMENT_LABEL[nl?.recruitmentState || ''] || nl?.recruitmentState || 'geen markt'} · HomeCheff {nl?.homecheffActive ? 'actief' : 'niet actief'} · {nl?.program?.name || 'geen programma'}
        </p>
        <p className="text-sm text-gray-600">Een wijziging opent of sluit de openbare instroom. Bestaande affiliates, portefeuilles en commissies blijven staan.</p>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-auto" value={recruitment} onChange={(event) => setRecruitment(event.target.value)} aria-label="Nieuwe wervingsstatus">
          <option value="OPEN">Open</option>
          <option value="LIMITED">Beperkt</option>
          <option value="WAITLIST">Wachtlijst</option>
          <option value="CLOSED">Gesloten</option>
        </select>
        <ReasonField value={recruitmentReason} onChange={setRecruitmentReason} />
        <SaveButton label="Bewaar werving" onClick={() => act({ action: 'setRecruitment', countryCode: 'NL', recruitmentState: recruitment }, recruitmentReason)} />
      </section>

      <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Openbare programmarechten</h3>
        <p className="text-sm text-gray-700">
          Nu: MAIN {nl?.publicMainAvailable === false ? 'uit' : 'aan'} · netwerk {nl?.publicNetworkAvailable === false ? 'uit' : 'aan'} · promo {nl?.publicPromoAvailable === false ? 'uit' : 'aan'} · dekkingsdoel {nl?.desiredMainCount ?? 'niet gezet'}
        </p>
        <p className="text-sm text-gray-600">Dit geldt voor nieuwe openbare aanmeldingen. Bestaande affiliates worden niet herschreven ({data.preview.existingAffiliatesRewritten} herschreven, {data.preview.grandfatheredPreserved} beschermd).</p>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={rightsChoice} onChange={(event) => setRightsChoice(event.target.value)} aria-label="Openbare rechten">
          <option value="create-standard">Maak het Standaard-programma</option>
          <option value="standard-no-main">NL openbaar: Standaard, zonder MAIN en netwerk</option>
          <option value="public-off">Publieke MAIN en netwerk uit</option>
          <option value="early-on">Publieke Vroege rechten aan</option>
          <option value="coverage-10">Dekkingsdoel MAIN 10</option>
        </select>
        <ReasonField value={rightsReason} onChange={setRightsReason} />
        <SaveButton
          label="Bewaar openbare rechten"
          onClick={() => {
            if (rightsChoice === 'create-standard') {
              void act({ action: 'createProgram', programCode: 'STANDARD_AFFILIATE_V2', name: 'Standaard' }, rightsReason);
              return;
            }
            if (rightsChoice === 'standard-no-main') {
              void act({ action: 'setPublicAvailability', countryCode: 'NL', programCode: 'STANDARD_AFFILIATE_V2', publicMain: false, publicNetwork: false, publicPromo: true }, rightsReason);
              return;
            }
            if (rightsChoice === 'public-off') {
              void act({ action: 'setPublicAvailability', countryCode: 'NL', publicMain: false, publicNetwork: false }, rightsReason);
              return;
            }
            if (rightsChoice === 'early-on') {
              void act({ action: 'setPublicAvailability', countryCode: 'NL', publicMain: true, publicNetwork: true, publicPromo: true }, rightsReason);
              return;
            }
            void act({ action: 'setPublicAvailability', countryCode: 'NL', desiredMainCount: 10 }, rightsReason);
          }}
        />
      </section>

      <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Vroege instap</h3>
        <p className="text-sm text-gray-700">Nu: {early ? `${early.name} · vroege tekst ${early.publicEarlyEnabled ? 'aan' : 'uit'}` : 'Programma Vroege instap is niet geladen.'}</p>
        <p className="text-sm text-gray-600">Dit wijzigt de openbare tekst voor nieuwe bezoekers. Bestaande affiliates en commissies blijven staan.</p>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" checked={earlyOn} onChange={(event) => setEarlyOn(event.target.checked)} />
          Vroege tekst aan
        </label>
        <ReasonField value={earlyReason} onChange={setEarlyReason} />
        <SaveButton
          label="Bewaar vroege instap"
          onClick={() => act({ action: 'setProgramFlags', programCode: 'EARLY_AFFILIATE_V1', publicEarlyEnabled: earlyOn }, earlyReason)}
        />
      </section>

      <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Conceptbeleid</h3>
        <p className="text-sm text-gray-700">Nu: {policy ? `${policy.code} · ${policy.status}` : 'Geen opgeslagen concept STANDARD_AFFILIATE_V2_POLICY.'}</p>
        <p className="text-sm text-gray-600">Opslaan bewaart het concept. De huidige commissieberekening verandert niet. Publiceren zet dat concept op gepubliceerd en laat de vroege polis staan.</p>
        <ReasonField value={draftReason} onChange={setDraftReason} />
        <SaveButton
          label="Bewaar concept"
          onClick={() => act({
            action: 'savePolicyDraft',
            code: 'STANDARD_AFFILIATE_V2_POLICY',
            durationMode: 'FIXED_DURATION',
            durationMonths: 24,
            durationClock: 'FROM_FIRST_QUALIFYING_PAYMENT',
            directPoolBps: 10000,
            subPoolBps: 8000,
            mainPoolBps: 2000,
          }, draftReason)}
        />
        <ReasonField value={publishReason} onChange={setPublishReason} />
        <button
          type="button"
          className="rounded-lg border border-amber-700 px-3 py-2 text-sm text-amber-950"
          onClick={() => act({ action: 'publishPolicy', code: 'STANDARD_AFFILIATE_V2_POLICY' }, publishReason)}
        >
          Publiceer concept
        </button>
      </section>
      {message ? <p className="text-sm text-gray-800">{message}</p> : null}
    </div>
  );
}

export function AffiliatePersonSettings({ affiliate }: { affiliate: { id: string; name: string; email: string } }) {
  const { message, act } = useProgram();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [mainChoice, setMainChoice] = useState('unlimited');
  const [mainReason, setMainReason] = useState('');
  const [limitChoice, setLimitChoice] = useState('one');
  const [limitReason, setLimitReason] = useState('');

  async function loadDetail() {
    const res = await fetch(`/api/admin/affiliate-program?affiliateId=${encodeURIComponent(affiliate.id)}`);
    const payload = await res.json().catch(() => null);
    setDetail(payload?.detail || null);
  }

  useEffect(() => {
    void loadDetail();
  }, [affiliate.id]);

  const main = detail?.capabilities?.CAN_BECOME_MAIN;
  const limit = detail?.subAffiliateLimit;
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Rechten van {affiliate.name}</h3>
        <p className="text-sm text-gray-600">{affiliate.email}</p>
        <p className="mt-2 text-sm text-gray-700">
          Klasse {detail?.populationClass || 'onbekend'} · {detail?.commercialParticipant ? 'commercieel' : 'niet commercieel'} · herkomst {detail?.enrollmentSource || 'geen inschrijving'}
        </p>
        <p className="text-sm text-gray-700">
          MAIN {main ? (main.value ? 'aan' : 'uit') : '…'} · bron {main?.source || '…'} · SUB-limiet {limit ? (limit.value === null ? 'onbeperkt' : limit.value) : '…'} · bron {limit?.source || '…'}
        </p>
        <button type="button" className="mt-2 text-sm text-emerald-800" onClick={() => void loadDetail()}>
          Toon effectieve rechten opnieuw
        </button>
      </div>
      <div className="space-y-3 rounded-lg border p-3">
        <h4 className="text-sm font-medium text-gray-900">MAIN-rechten</h4>
        <p className="text-sm text-gray-600">Dit geldt alleen voor deze affiliate. Het openbare programma en het grootboek blijven staan.</p>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={mainChoice} onChange={(event) => setMainChoice(event.target.value)} aria-label="MAIN-rechten">
          <option value="unlimited">MAIN en netwerk, onbeperkt SUB</option>
          <option value="ten">MAIN en netwerk, 10 SUB</option>
          <option value="promo">Promo, MAIN en onbeperkt SUB</option>
        </select>
        <ReasonField value={mainReason} onChange={setMainReason} />
        <SaveButton
          label="Bewaar MAIN-rechten"
          onClick={() => {
            const save = mainChoice === 'ten'
              ? act({ action: 'applyPreset', affiliateId: affiliate.id, preset: 'MAIN_NETWORK', subLimitMode: 'LIMITED', subLimit: 10 }, mainReason)
              : mainChoice === 'promo'
                ? act({ action: 'setOverride', affiliateId: affiliate.id, promoCodes: true, inviteSubs: true, becomeMain: true, subLimitMode: 'UNLIMITED' }, mainReason)
                : act({ action: 'applyPreset', affiliateId: affiliate.id, preset: 'MAIN_NETWORK' }, mainReason);
            void save.then((ok) => { if (ok) void loadDetail(); });
          }}
        />
      </div>
      <div className="space-y-3 rounded-lg border p-3">
        <h4 className="text-sm font-medium text-gray-900">SUB-limiet</h4>
        <p className="text-sm text-gray-600">Een limiet van 1 stopt een tweede uitnodiging. Terug naar standaard haalt de persoonlijke uitzondering weg.</p>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={limitChoice} onChange={(event) => setLimitChoice(event.target.value)} aria-label="SUB-limiet">
          <option value="one">SUB-limiet 1</option>
          <option value="reset">Terug naar standaard</option>
        </select>
        <ReasonField value={limitReason} onChange={setLimitReason} />
        <SaveButton
          label="Bewaar SUB-limiet"
          onClick={() => {
            const save = limitChoice === 'reset'
              ? act({ action: 'resetOverride', affiliateId: affiliate.id }, limitReason)
              : act({ action: 'setOverride', affiliateId: affiliate.id, subLimitMode: 'LIMITED', subLimit: 1 }, limitReason);
            void save.then((ok) => { if (ok) void loadDetail(); });
          }}
        />
      </div>
      {message ? <p className="text-sm text-gray-800">{message}</p> : null}
    </section>
  );
}

export function AffiliateManualAdmission() {
  const { message, act } = useProgram();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
      <h3 className="text-base font-semibold text-gray-900">Handmatige toelating</h3>
      <p className="text-sm text-gray-600">Dit laat een bestaand account toe als commerciële affiliate. De openbare werving blijft zoals die is.</p>
      <label className="block text-sm text-gray-700">
        E-mailadres
        <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <ReasonField value={reason} onChange={setReason} />
      <SaveButton label="Laat handmatig toe" onClick={() => act({ action: 'admit', email, countryCode: 'NL' }, reason)} />
      {message ? <p className="text-sm text-gray-800">{message}</p> : null}
    </section>
  );
}

export function AffiliateAdvancedAdmin() {
  const { data, message, act } = useProgram();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const ledgers = data?.counts.ledgers ?? 0;
  return (
    <section className="rounded-xl border border-amber-300 bg-white p-4 sm:p-6 space-y-3">
      <h3 className="text-base font-semibold text-gray-900">Geavanceerd beheer</h3>
      <p className="text-sm text-gray-600">Ingrijpende acties staan hier apart van de dagelijkse programma-instellingen.</p>
      <button type="button" className="rounded-lg border border-red-700 px-3 py-2 text-sm text-red-900" onClick={() => setOpen(true)}>
        Grootboek wissen
      </button>
      {open ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-gray-900">Van toepassing op het hele commissiegrootboek ({ledgers} boekingen), niet op één affiliate.</p>
          <p className="text-sm text-gray-800">Het wissen wordt tegengehouden. Bestaande boekingen, uitbetalingen en refunds blijven staan. Een correctie loopt via een terugboeking.</p>
          <ReasonField value={reason} onChange={setReason} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setOpen(false)}>Annuleren</button>
            <button type="button" className="rounded-lg bg-red-800 px-3 py-2 text-sm text-white" onClick={() => act({ action: 'deleteLedger' }, reason)}>
              Bevestig wissen
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="text-sm text-gray-800">{message}</p> : null}
    </section>
  );
}

export default function AffiliateProgramControl() {
  return <AffiliateProgramSettings />;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  status: string;
  hcAmount: number;
  fundingClass: string;
  distributionMode: string;
  promoCode?: string | null;
  activationCondition?: string;
  requireStripeConnect?: boolean;
  marketplaceEligible?: boolean;
  studioEligible?: boolean;
  growthEligible?: boolean;
  sellerPrincipalEligible?: boolean;
  claimCount: number;
  qualificationCount?: number;
  grantedCount?: number;
  maxClaims?: number | null;
  totalHcIssued: number;
  maxTotalHcIssued?: number | null;
  pendingCount?: number;
  rejectedCount?: number;
  remainingHc?: number | null;
  rejectionStats?: Record<string, number> | null;
  coverage?: {
    code: string;
    nominalFaceCents: number | null;
    reservationCents: number | null;
    headroomCents: number | null;
    availableCents: number | null;
    pendingCents: number | null;
  };
};

type PlatformBalance = {
  known?: boolean;
  availableCents?: number | null;
  pendingCents?: number | null;
  livemode?: boolean | null;
  readAt?: string | null;
};

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function budgetFaceCents(campaign: Campaign): number | null {
  const perClaim = Math.max(0, Math.floor(campaign.hcAmount));
  const byClaims = campaign.maxClaims == null ? null : perClaim * Math.max(0, campaign.maxClaims);
  const byBudget = campaign.maxTotalHcIssued == null ? null : Math.max(0, campaign.maxTotalHcIssued);
  if (byClaims == null && byBudget == null) return null;
  if (byClaims != null && byBudget != null) return Math.min(byClaims, byBudget);
  return byClaims ?? byBudget;
}

function coverageLabel(code: string): string {
  if (code === 'COVERED') return 'voldoende op deze momentopname';
  if (code === 'COVERAGE_UNKNOWN') return 'dekking onbekend';
  if (code === 'INSUFFICIENT_STRIPE_COVERAGE') return 'onvoldoende dekking';
  if (code === 'UNBOUNDED_CAMPAIGN_BUDGET') return 'geen eindig budget';
  if (code === 'COVERAGE_NOT_REQUIRED') return 'geen Stripe-dekking vereist';
  return code;
}

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/hc-campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  return (await res.json()) as {
    ok?: boolean;
    message?: string;
    campaigns?: Campaign[];
    platformBalance?: PlatformBalance;
    outstandingSellerLiabilityCents?: number | null;
    preview?: { requiresConfirmation?: boolean; faceEurCents?: number };
    qualifications?: Array<{ centralUserId: string; listingRef: string | null; qualityScore: number | null; rule: string; createdAt: string }>;
    claims?: Array<{ centralUserId: string; status: string; hcAmount: number; blockReason: string | null }>;
  };
}

function CampaignDraftEditor({
  campaign,
  disabled,
  onDone,
}: {
  campaign: Campaign;
  disabled: boolean;
  onDone: () => void;
}) {
  const [hcAmount, setHcAmount] = useState(String(campaign.hcAmount));
  const [maxClaims, setMaxClaims] = useState(campaign.maxClaims == null ? '' : String(campaign.maxClaims));
  const [maxTotal, setMaxTotal] = useState('');
  const [stripe, setStripe] = useState(Boolean(campaign.requireStripeConnect));
  const [studio, setStudio] = useState(campaign.studioEligible !== false);
  const [growth, setGrowth] = useState(campaign.growthEligible !== false);
  const [note, setNote] = useState<string | null>(null);

  async function save() {
    const nextTotal = maxTotal.trim() === '' ? undefined : Number(maxTotal);
    if (nextTotal != null && campaign.maxTotalHcIssued != null && nextTotal > campaign.maxTotalHcIssued) {
      if (!window.confirm('Het campagnebudget wordt verhoogd. Doorgaan?')) return;
    }
    if (maxClaims.trim() === '' && !window.confirm('Leeg claims-maximum haalt de limiet weg. Doorgaan?')) return;
    if (!window.confirm('Wijziging opslaan? Een actieve toekenning blijft ongewijzigd.')) return;
    const json = await post({
      action: 'update',
      campaignId: campaign.id,
      hcAmount: Number(hcAmount),
      maxClaims: maxClaims === '' ? null : Number(maxClaims),
      ...(nextTotal === undefined ? {} : { maxTotalHcIssued: nextTotal }),
      requireStripeConnect: stripe,
      studioEligible: studio,
      growthEligible: growth,
    });
    setNote(json.ok ? 'Opgeslagen.' : json.message ?? 'Opslaan mislukt.');
    if (json.ok) onDone();
  }

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      <label className="text-sm">Beloning HC
        <input className="mt-1 w-full rounded border px-2 py-1" value={hcAmount} onChange={(e) => setHcAmount(e.target.value)} />
      </label>
      <label className="text-sm">Maximaal claims
        <input className="mt-1 w-full rounded border px-2 py-1" value={maxClaims} onChange={(e) => setMaxClaims(e.target.value)} />
      </label>
      <label className="text-sm md:col-span-2">Nieuw totaalbudget HC (leeg laat het huidige budget staan)
        <input className="mt-1 w-full rounded border px-2 py-1" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={stripe} onChange={(e) => setStripe(e.target.checked)} />
        Stripe Connect verplicht
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={studio} onChange={(e) => setStudio(e.target.checked)} />
        Studio
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={growth} onChange={(e) => setGrowth(e.target.checked)} />
        Growth
      </label>
      <button type="button" disabled={disabled} className="rounded border px-2 py-1 text-sm md:col-span-2 w-fit" onClick={() => void save()}>
        Wijziging opslaan
      </button>
      {note ? <p className="text-sm md:col-span-2">{note}</p> : null}
    </div>
  );
}

export default function AdminHcCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [facts, setFacts] = useState<Record<string, {
    qualifications: Array<{ centralUserId: string; listingRef: string | null; qualityScore: number | null; rule: string; createdAt: string }>;
    claims: Array<{ centralUserId: string; status: string; hcAmount: number; blockReason: string | null }>;
  } | null>>({});
  const [platformBalance, setPlatformBalance] = useState<PlatformBalance | null>(null);
  const [openLiabilities, setOpenLiabilities] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    promoCode: '',
    hcAmount: '1000',
    maxClaims: '50',
    maxTotalHcIssued: '50000',
    startAt: '',
    endAt: '',
    activationCondition: 'IMMEDIATE',
    requireStripeConnect: false,
    marketplaceEligible: false,
    studioEligible: true,
    growthEligible: true,
    confirmTreasury: false,
  });

  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const json = await post({ action: 'list' });
    if (seq !== loadSeq.current) return;
    setPlatformBalance(json.platformBalance ?? { known: false });
    setOpenLiabilities(json.outstandingSellerLiabilityCents ?? null);
    if (json.ok && json.campaigns) setCampaigns(json.campaigns);
    else setMessage(json.message ?? 'Campagnes laden mislukt.');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCampaign() {
    if (form.marketplaceEligible && !form.confirmTreasury) {
      setMessage('Marketplace-koopkracht maakt een treasury-verplichting. Bevestig die eerst.');
      return;
    }
    if (!window.confirm('Conceptcampagne opslaan? Er wordt nog niets toegekend.')) return;
    setBusy(true);
    const json = await post({
      name: form.name,
      promoCode: form.promoCode,
      hcAmount: Number(form.hcAmount),
      maxClaims: Number(form.maxClaims),
      maxTotalHcIssued: Number(form.maxTotalHcIssued),
      startAt: form.startAt || null,
      endAt: form.endAt || null,
      distributionMode: 'PROMO_CODE',
      activationCondition: form.activationCondition,
      requireStripeConnect: form.requireStripeConnect,
      marketplaceEligible: form.marketplaceEligible,
      sellerPrincipalEligible: form.marketplaceEligible,
      fundingClass: form.marketplaceEligible ? 'HOMECHEFF_FUNDED_PROMOTION' : 'HOMECHEFF_PROMOTIONAL',
      studioEligible: form.studioEligible,
      growthEligible: form.growthEligible,
      confirmSellerPrincipalTreasury: form.confirmTreasury,
    });
    setBusy(false);
    setMessage(json.ok ? 'Concept opgeslagen. Activeer het pas als het budget klopt.' : json.message ?? 'Opslaan mislukt.');
    if (json.ok) void load();
  }

  async function setStatus(campaign: Campaign, status: 'ACTIVE' | 'PAUSED' | 'ENDED') {
    const prompts: Record<string, string> = {
      ACTIVE: `Campagne ${campaign.name} activeren? Nieuwe claims kunnen dan HC krijgen.`,
      PAUSED: `Campagne ${campaign.name} pauzeren? Nieuwe toekenningen stoppen direct.`,
      ENDED: `Campagne ${campaign.name} definitief beëindigen?`,
    };
    if (status === 'ACTIVE' && campaign.marketplaceEligible && !window.confirm('Deze campagne kan Marketplace-koopkracht uit de treasury financieren. Doorgaan?')) {
      return;
    }
    if (!window.confirm(prompts[status])) return;
    setBusy(true);
    try {
      const json = await post({
        action: 'setStatus',
        campaignId: campaign.id,
        status,
        confirmSellerPrincipalTreasury: campaign.sellerPrincipalEligible === true,
      });
      if (json.ok) {
        setCampaigns((prev) => prev.map((row) => (row.id === campaign.id ? { ...row, status } : row)));
        setMessage(`Status ${status}.`);
        await load();
      } else {
        setMessage(json.message ?? 'Status wijzigen mislukt.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">HC-campagnes</h2>
        <p className="text-sm text-gray-600 mt-1">
          Zelfde campagnes als Growth. De wallet en het budget blijven daar. Er wordt vanuit dit scherm geen credit toegekend.
        </p>
      </div>
      {message ? <p className="text-sm text-gray-800">{message}</p> : null}
      <form
        className="bg-white rounded-xl border p-4 grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void createCampaign();
        }}
      >
        <label className="text-sm">Naam
          <input className="mt-1 w-full rounded border px-2 py-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="text-sm">Promotiecode
          <input className="mt-1 w-full rounded border px-2 py-1" value={form.promoCode} onChange={(e) => setForm({ ...form, promoCode: e.target.value })} required />
        </label>
        <label className="text-sm">Beloning HC
          <input className="mt-1 w-full rounded border px-2 py-1" value={form.hcAmount} onChange={(e) => setForm({ ...form, hcAmount: e.target.value })} />
        </label>
        <label className="text-sm">Maximaal claims
          <input className="mt-1 w-full rounded border px-2 py-1" value={form.maxClaims} onChange={(e) => setForm({ ...form, maxClaims: e.target.value })} />
        </label>
        <label className="text-sm">Totaalbudget HC
          <input className="mt-1 w-full rounded border px-2 py-1" value={form.maxTotalHcIssued} onChange={(e) => setForm({ ...form, maxTotalHcIssued: e.target.value })} />
        </label>
        <label className="text-sm">Start
          <input type="datetime-local" className="mt-1 w-full rounded border px-2 py-1" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
        </label>
        <label className="text-sm">Einde
          <input type="datetime-local" className="mt-1 w-full rounded border px-2 py-1" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        </label>
        <label className="text-sm">Trigger
          <select className="mt-1 w-full rounded border px-2 py-1" value={form.activationCondition} onChange={(e) => setForm({ ...form, activationCondition: e.target.value })}>
            <option value="IMMEDIATE">Direct bij code</option>
            <option value="FIRST_VALID_LISTING">Eerste geldige publicatie</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.requireStripeConnect} onChange={(e) => setForm({ ...form, requireStripeConnect: e.target.checked })} />
          Stripe Connect verplicht vóór toekenning
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.studioEligible} onChange={(e) => setForm({ ...form, studioEligible: e.target.checked })} />
          Studio
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.growthEligible} onChange={(e) => setForm({ ...form, growthEligible: e.target.checked })} />
          Growth
        </label>
        <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.marketplaceEligible} onChange={(e) => setForm({ ...form, marketplaceEligible: e.target.checked, confirmTreasury: false })} />
          Marketplace-koopkracht. Dit financiert HomeCheff vanuit de treasury.
        </label>
        {form.marketplaceEligible ? (
          <label className="inline-flex items-center gap-2 text-sm md:col-span-2 text-amber-900">
            <input type="checkbox" checked={form.confirmTreasury} onChange={(e) => setForm({ ...form, confirmTreasury: e.target.checked })} />
            Ik bevestig de treasury-verplichting, inclusief veiligheidsbuffer.
          </label>
        ) : null}
        <button type="submit" disabled={busy} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50">
          Concept opslaan
        </button>
      </form>
      <section className="rounded-xl border bg-white p-4 text-sm">
        <h3 className="font-medium">Stripe – financiële dekking</h3>
        {platformBalance?.known && platformBalance.availableCents != null ? (
          <div className="mt-2 space-y-1 text-gray-700">
            <p>Beschikbaar voor transfers: {eur(platformBalance.availableCents)}{platformBalance.livemode === false ? ' · testgegevens' : ''}</p>
            <p>Nog niet beschikbaar: {platformBalance.pendingCents == null ? 'onbekend' : eur(platformBalance.pendingCents)}</p>
            <p>Openstaande verkopersverplichtingen: {openLiabilities == null ? 'onbekend' : eur(openLiabilities)}</p>
            <p>Gelezen: {platformBalance.readAt ? new Date(platformBalance.readAt).toLocaleString('nl-NL') : 'tijdens het laden van deze pagina'}</p>
            <p>Het bedrag dat nog niet beschikbaar is, telt niet als dekking.</p>
          </div>
        ) : (
          <p className="mt-2 text-amber-900">Stripe-saldo onbekend. Onbekende dekking blokkeert het activeren van een Marketplace-campagne en telt niet als €0.</p>
        )}
        <p className="mt-2 text-gray-500">Momentopname van het payments-saldo. Dit is geen reservering bij Stripe. Onbesteed HC is geen door de accountant vastgestelde schuld.</p>
        <a className="mt-2 inline-block text-emerald-800 underline" href="https://dashboard.stripe.com/balance" target="_blank" rel="noreferrer">Stripe-dashboard openen</a>
      </section>
      <ul className="space-y-3">
        {campaigns.map((c) => (
          <li key={c.id} data-campaign-status={c.status} className="bg-white rounded-xl border p-4 text-sm">
            <p className="font-medium">{c.name} · <span data-testid="hc-campaign-status">{c.status}</span></p>
            <p className="text-gray-600">
              {c.hcAmount} HC · {c.activationCondition ?? 'IMMEDIATE'}
              {c.promoCode ? ` · ${c.promoCode}` : ''}
              {c.requireStripeConnect ? ' · Stripe verplicht' : ''}
            </p>
            <p className="text-gray-500">
              kwalificaties {c.qualificationCount ?? 0} · claims {c.claimCount}{c.maxClaims != null ? `/${c.maxClaims}` : ''} · toegekend {c.grantedCount ?? 0} · uitgegeven {c.totalHcIssued} HC
              {c.remainingHc != null ? ` · resterend ${c.remainingHc} HC` : ''}
              {` · pending ${c.pendingCount ?? 0}`}
              {` · geweigerd ${c.rejectedCount ?? 0}`}
            </p>
            <p className="text-gray-500">
              Marketplace {c.marketplaceEligible ? 'aan' : 'uit'} · Studio {c.studioEligible ? 'aan' : 'uit'} · Growth {c.growthEligible ? 'aan' : 'uit'}
              {c.sellerPrincipalEligible ? ' · treasury-financiering aan' : ''}
            </p>
            {c.coverage?.code === 'COVERAGE_NOT_REQUIRED' ? (
              <p className="text-gray-700">
                HC-budget {budgetFaceCents(c) == null ? 'niet ingesteld' : eur(budgetFaceCents(c) as number)}
                {' · Stripe-reservering €0,00 · geen Stripe-dekking vereist'}
              </p>
            ) : c.coverage ? (
              <p className="text-gray-700">
                Nominale waarde {c.coverage.nominalFaceCents == null ? 'geen eindig budget' : eur(c.coverage.nominalFaceCents)}
                {c.coverage.reservationCents != null ? ` · reservering ${eur(c.coverage.reservationCents)}` : ''}
                {' · '}{coverageLabel(c.coverage.code)}
              </p>
            ) : null}
            {c.rejectionStats ? (
              <p className="text-gray-500">Weigeringen: {Object.entries(c.rejectionStats).map(([k, v]) => `${k} ${v}`).join(', ')}</p>
            ) : null}
            {c.status === 'ACTIVE' ? (
              <p className="mt-2 text-amber-900">Een actieve campagne is vergrendeld. Pauzeer eerst om beloning of budget te wijzigen.</p>
            ) : null}
            {c.status === 'DRAFT' || c.status === 'PAUSED' ? (
              <CampaignDraftEditor campaign={c} disabled={busy} onDone={() => void load()} />
            ) : null}
            <button
              type="button"
              data-testid="hc-view-qualifications"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline"
              onClick={() => void post({ action: 'rewards', campaignId: c.id }).then((json) => {
                setFacts((prev) => ({
                  ...prev,
                  [c.id]: json.ok
                    ? { qualifications: json.qualifications ?? [], claims: json.claims ?? [] }
                    : null,
                }));
              })}
            >
              Kwalificaties bekijken
            </button>
            {facts[c.id] ? (
              <div data-testid="hc-qualification-details" className="mt-2 space-y-1 text-gray-700">
                {facts[c.id]?.qualifications.length ? facts[c.id]?.qualifications.map((row) => (
                  <p key={`${row.centralUserId}-${row.createdAt}`}>
                    Kwalificatie {row.centralUserId.slice(0, 8)} · listing {row.listingRef ? row.listingRef.slice(0, 8) : 'niet beschikbaar'} · score {row.qualityScore ?? 'niet beschikbaar'} · {row.rule} · geen toekenning in deze regel
                  </p>
                )) : <p>Geen kwalificaties.</p>}
                {facts[c.id]?.claims.length ? facts[c.id]?.claims.map((row) => (
                  <p key={`${row.centralUserId}-${row.status}`}>
                    Claim {row.centralUserId.slice(0, 8)} · {row.status} · {row.hcAmount} HC{row.blockReason ? ` · ${row.blockReason}` : ''}
                  </p>
                )) : <p>Geen claims.</p>}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {(['ACTIVE', 'PAUSED', 'ENDED'] as const).map((status) => (
                <button key={status} type="button" disabled={busy || c.status === status} className="rounded border px-2 py-1 text-xs disabled:opacity-40" onClick={() => void setStatus(c, status)}>
                  {status === 'ACTIVE' ? 'Activeren' : status === 'PAUSED' ? 'Pauzeren' : 'Beëindigen'}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

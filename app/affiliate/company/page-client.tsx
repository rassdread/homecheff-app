'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';

type Membership = {
  role: string;
  organization: {
    id: string;
    slug: string;
    companyName: string;
    displayName: string;
    status: string;
    isCertificationOnly?: boolean;
    kvkNumber?: string | null;
  };
};

type SuggestedCompany = {
  companyName: string;
  kvkNumber: string;
};

type PayoutInfo = {
  connectAccountLinked?: boolean;
  connectOnboardingCompleted?: boolean;
};

export default function AffiliateCompanyPageClient() {
  const { data: session, status } = useSession();
  const { language } = useTranslation();
  const en = language === 'en';
  const searchParams = useSearchParams();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [kvkNumber, setKvkNumber] = useState('');
  const [existingKvk, setExistingKvk] = useState('');
  const [personalAffiliateActive, setPersonalAffiliateActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const prefilledCompany = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');

  async function refreshList() {
    const res = await fetch('/api/affiliate/organization');
    const json = await res.json();
    if (typeof json.personalAffiliateActive === 'boolean') {
      setPersonalAffiliateActive(json.personalAffiliateActive);
    }
    const suggested = json.suggestedCompany as SuggestedCompany | null | undefined;
    if (!prefilledCompany.current && suggested?.kvkNumber) {
      prefilledCompany.current = true;
      setCompanyName(suggested.companyName || '');
      setKvkNumber(suggested.kvkNumber);
    }
    if (json.ok && Array.isArray(json.memberships)) {
      setMemberships(json.memberships);
      if (!selectedId && json.memberships[0]?.organization?.id) {
        setSelectedId(json.memberships[0].organization.id);
      }
    }
  }

  async function refreshDetail(id: string) {
    if (!id) return;
    const [d, a] = await Promise.all([
      fetch(`/api/affiliate/organization?organizationId=${encodeURIComponent(id)}`).then((r) =>
        r.json(),
      ),
      fetch(
        `/api/affiliate/organization?organizationId=${encodeURIComponent(id)}&analytics=1`,
      ).then((r) => r.json()),
    ]);
    if (d.ok) setDetail(d);
    if (a.ok) setAnalytics(a.analytics ?? a);
  }

  useEffect(() => {
    if (status === 'authenticated') void refreshList();
  }, [status]);

  useEffect(() => {
    const fromQuery = searchParams.get('organizationId')?.trim();
    if (fromQuery) setSelectedId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const inviteToken = searchParams.get('invite')?.trim();
    if (!inviteToken || status !== 'authenticated') return;
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch('/api/affiliate/organization', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'ACCEPT_INVITE', inviteToken }),
        });
        const json = await res.json();
        if (json.ok) {
          setMessage('Uitnodiging geaccepteerd: welkom in het team.');
          await refreshList();
          if (json.organizationId) setSelectedId(String(json.organizationId));
        } else {
          setMessage(json.code || 'Uitnodiging kon niet worden geaccepteerd');
        }
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, status]);

  useEffect(() => {
    if (selectedId) void refreshDetail(selectedId);
    if (selectedId && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('hc_aff_share_mode', 'company');
        window.localStorage.setItem('hc_aff_share_org_id', selectedId);
      } catch {
        /* ignore */
      }
    }
  }, [selectedId]);

  useEffect(() => {
    const connect = searchParams.get('connect');
    if (!connect || !selectedId || status !== 'authenticated') return;
    if (connect !== 'return' && connect !== 'refresh') return;
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch('/api/affiliate/organization', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'REFRESH_CONNECT_STATUS',
            organizationId: selectedId,
          }),
        });
        const json = await res.json();
        setMessage(
          json.completed
            ? 'Uitbetaling (Stripe Connect) is gereed.'
            : 'Connect-status bijgewerkt. Voltooi onboarding als die nog open staat.',
        );
        await refreshDetail(selectedId);
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, selectedId, status]);

  async function createCompany() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ORG',
          companyName,
          kvkNumber,
          isCertificationOnly: false,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMessage(companyMessage(json.code, en));
        return;
      }
      setCompanyName('');
      setKvkNumber('');
      setMessage(
        json.reused
          ? en
            ? 'This KvK number is already on your business affiliate profile.'
            : 'Dit KvK-nummer staat al op je zakelijke affiliateprofiel.'
          : kvkNote(json.kvkLookup, en) ||
              (en ? 'Business affiliate profile saved.' : 'Zakelijk affiliateprofiel opgeslagen.'),
      );
      await refreshList();
      if (json.organization?.id) setSelectedId(json.organization.id);
    } finally {
      setBusy(false);
    }
  }

  async function saveExistingKvk() {
    if (!selectedId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_COMPANY_DETAILS',
          organizationId: selectedId,
          kvkNumber: existingKvk,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMessage(companyMessage(json.code, en));
        return;
      }
      setMessage(
        json.reused
          ? en
            ? 'This KvK number is already on another profile you own. That profile was kept.'
            : 'Dit KvK-nummer staat al op een ander profiel van jou. Dat profiel blijft staan.'
          : kvkNote(json.kvkLookup, en) ||
              (en ? 'KvK number saved.' : 'KvK-nummer opgeslagen.'),
      );
      if (json.reused && json.organization?.id) setSelectedId(json.organization.id);
      await refreshList();
      await refreshDetail(json.organization?.id || selectedId);
    } finally {
      setBusy(false);
    }
  }

  async function inviteMarketer() {
    if (!selectedId || !inviteEmail) return;
    setBusy(true);
    setLastInviteToken(null);
    try {
      const res = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'INVITE_MEMBER',
          organizationId: selectedId,
          email: inviteEmail,
          role: 'MARKETER',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage(`Uitnodiging aangemaakt voor ${inviteEmail}`);
        setLastInviteToken(json.invite?.inviteToken || null);
        setInviteEmail('');
        await refreshDetail(selectedId);
      } else {
        setMessage(json.code || 'Uitnodigen mislukt');
      }
    } finally {
      setBusy(false);
    }
  }

  async function startPayoutOnboarding() {
    if (!selectedId) return;
    setBusy(true);
    setMessage(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu';
      const res = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'START_PAYOUT_ONBOARDING',
          organizationId: selectedId,
          refreshUrl: `${origin}/affiliate/company?organizationId=${encodeURIComponent(selectedId)}&connect=refresh`,
          returnUrl: `${origin}/affiliate/company?organizationId=${encodeURIComponent(selectedId)}&connect=return`,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMessage(json.message || json.code || 'Connect starten mislukt');
        return;
      }
      if (json.alreadyComplete) {
        setMessage('Uitbetaling was al ingesteld.');
        await refreshDetail(selectedId);
        return;
      }
      if (json.url) {
        window.location.href = json.url as string;
        return;
      }
      setMessage('Geen Connect-URL ontvangen');
    } finally {
      setBusy(false);
    }
  }

  async function createCampaignAndLink() {
    if (!selectedId || !campaignName) return;
    setBusy(true);
    try {
      const camp = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CAMPAIGN',
          organizationId: selectedId,
          name: campaignName,
          activate: true,
          channel: 'link',
          destinationKind: 'MARKETPLACE',
        }),
      }).then((r) => r.json());
      if (!camp.ok) {
        setMessage(camp.code || 'Campagne mislukt');
        return;
      }
      const asset = await fetch('/api/affiliate/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TRACKING_ASSET',
          organizationId: selectedId,
          campaignId: camp.campaign?.id,
          type: 'LINK',
          channel: 'link',
        }),
      }).then((r) => r.json());
      setMessage(
        asset.ok
          ? `Campagne + link: ${asset.trackingUrl || asset.asset?.slug}`
          : asset.code || 'Link mislukt',
      );
      setCampaignName('');
      await refreshDetail(selectedId);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'unauthenticated') {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p>Log in om je affiliatebedrijf te beheren.</p>
        <Link href="/login" className="text-orange-700 underline">
          Inloggen
        </Link>
      </main>
    );
  }

  const org = (detail as { organization?: Record<string, unknown> } | null)?.organization;
  const role = (detail as { role?: string } | null)?.role;
  const payout = (org?.payout as PayoutInfo | undefined) ?? {};
  const assets = (org?.trackingAssets as Array<Record<string, unknown>> | undefined) ?? [];
  const campaigns = (org?.campaigns as Array<Record<string, unknown>> | undefined) ?? [];
  const members = (org?.members as Array<Record<string, unknown>> | undefined) ?? [];
  const invites = (org?.invites as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      <header className="space-y-2 min-w-0">
        <p className="text-sm text-neutral-500">
          <Link href="/affiliate" className="underline">
            Affiliate
          </Link>{' '}
          / {en ? 'Business' : 'Zakelijk'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight break-words">
          {en ? 'Business affiliate profile' : 'Zakelijk affiliateprofiel'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-sm sm:text-base">
          {en
            ? 'This company participates in the HomeCheff affiliate programme.'
            : 'Dit bedrijf doet mee aan het HomeCheff-affiliateprogramma.'}
        </p>
        <p className="text-neutral-600 max-w-2xl text-sm sm:text-base">
          {en
            ? "You don't need a HomeCheff subscription to participate as a business affiliate."
            : 'Je hebt geen HomeCheff-abonnement nodig om zakelijk affiliate te zijn.'}
        </p>
      </header>

      {message && (
        <p
          role="status"
          className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm break-words"
        >
          {message}
        </p>
      )}

      <section className="space-y-3 border-t border-neutral-200 pt-6">
        <h2 className="text-lg sm:text-xl font-medium">
          {en ? 'Company details' : 'Bedrijfsgegevens'}
        </h2>
        {personalAffiliateActive === false ? (
          <p className="text-sm text-neutral-700">
            {en ? 'Become an affiliate first. ' : 'Word eerst affiliate. '}
            <Link href="/affiliate" className="font-semibold text-emerald-800 underline">
              {en ? 'Become an affiliate' : 'Word affiliate'}
            </Link>
          </p>
        ) : (
          <form
            className="flex flex-col gap-3 max-w-xl"
            onSubmit={(event) => {
              event.preventDefault();
              void createCompany();
            }}
          >
            <label className="block text-sm font-medium text-neutral-800">
              {en ? 'Company name' : 'Bedrijfsnaam'}
              <input
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base font-normal"
                name="companyName"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-neutral-800">
              {en ? 'KvK number' : 'KvK-nummer'}
              <input
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base font-normal"
                name="kvkNumber"
                inputMode="numeric"
                autoComplete="off"
                value={kvkNumber}
                onChange={(e) => setKvkNumber(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy || companyName.trim().length < 2 || kvkNumber.trim().length < 8}
              className="w-full sm:w-auto rounded bg-neutral-900 px-4 py-2.5 text-white disabled:opacity-50"
            >
              {en ? 'Save business affiliate profile' : 'Zakelijk affiliateprofiel opslaan'}
            </button>
          </form>
        )}
      </section>

      {memberships.length > 0 && (
        <section className="space-y-3 border-t border-neutral-200 pt-6">
          <h2 className="text-lg sm:text-xl font-medium">Jouw bedrijven</h2>
          <select
            className="w-full max-w-md rounded border border-neutral-300 px-3 py-2.5 text-base"
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              try {
                window.localStorage.setItem('hc_aff_share_mode', 'company');
                window.localStorage.setItem('hc_aff_share_org_id', id);
              } catch {
                /* ignore */
              }
            }}
          >
            {memberships.map((m) => (
              <option key={m.organization.id} value={m.organization.id}>
                {m.organization.displayName} ({m.role})
              </option>
            ))}
          </select>
        </section>
      )}

      {org && (
        <>
          <section className="grid gap-3 grid-cols-2 lg:grid-cols-4 border-t border-neutral-200 pt-6">
            <Stat
              label="Referrals"
              value={String((analytics as { attributedUsers?: number } | null)?.attributedUsers ?? 0)}
            />
            <Stat
              label="Netto commissie (¢)"
              value={String(
                (analytics as { netCommissionCents?: number } | null)?.netCommissionCents ?? 0,
              )}
            />
            <Stat
              label="Eligible omzet (¢)"
              value={String(
                (analytics as { eligiblePlatformRevenueCents?: number } | null)
                  ?.eligiblePlatformRevenueCents ?? 0,
              )}
            />
            <Stat
              label="Cross-product rate"
              value={
                (analytics as { crossProductReferralRate?: number | null } | null)
                  ?.crossProductReferralRate == null
                  ? '—'
                  : `${Math.round(
                      ((analytics as { crossProductReferralRate: number }).crossProductReferralRate ||
                        0) * 100,
                    )}%`
              }
            />
          </section>

          {role === 'OWNER' && (
            <section className="space-y-3 border-t border-neutral-200 pt-6">
              <h2 className="text-lg sm:text-xl font-medium">{en ? 'KvK number' : 'KvK-nummer'}</h2>
              {typeof org.kvkNumber === 'string' && org.kvkNumber.trim() ? (
                <p className="text-sm text-neutral-800">{String(org.kvkNumber)}</p>
              ) : (
                <form
                  className="flex flex-col gap-3 max-w-xl"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveExistingKvk();
                  }}
                >
                  <p className="text-sm text-neutral-600">
                    {en
                      ? 'Add the KvK number for this affiliate company. This does not start a Marketplace subscription.'
                      : 'Voeg het KvK-nummer van dit affiliatebedrijf toe. Dit start geen Marketplace-abonnement.'}
                  </p>
                  <label className="block text-sm font-medium text-neutral-800">
                    {en ? 'KvK number' : 'KvK-nummer'}
                    <input
                      className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base font-normal"
                      name="existingKvkNumber"
                      inputMode="numeric"
                      value={existingKvk}
                      onChange={(e) => setExistingKvk(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || existingKvk.trim().length < 8}
                    className="w-full sm:w-auto rounded bg-neutral-900 px-4 py-2.5 text-white disabled:opacity-50"
                  >
                    {en ? 'Save KvK number' : 'KvK-nummer opslaan'}
                  </button>
                </form>
              )}
            </section>
          )}

          {role === 'OWNER' && (
            <section className="space-y-3 border-t border-neutral-200 pt-6">
              <h2 className="text-lg sm:text-xl font-medium">{en ? 'Payout' : 'Uitbetaling'}</h2>
              <p className="text-sm text-neutral-600">
                Commissies lopen altijd op. Cashout vereist Stripe Connect op de bedrijkszitting —
                alleen de eigenaar kan dit instellen.
              </p>
              <p className="text-sm">
                Status:{' '}
                {payout.connectOnboardingCompleted
                  ? 'Gereed voor uitbetaling'
                  : payout.connectAccountLinked
                    ? 'Onboarding gestart: nog niet voltooid'
                    : 'Nog niet ingesteld'}
              </p>
              {!payout.connectOnboardingCompleted && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void startPayoutOnboarding()}
                  className="rounded bg-neutral-900 px-4 py-2.5 text-white disabled:opacity-50"
                >
                  Uitbetaling instellen
                </button>
              )}
            </section>
          )}

          {(role === 'OWNER' || role === 'ADMIN') && (
            <section className="space-y-3 border-t border-neutral-200 pt-6">
              <h2 className="text-lg sm:text-xl font-medium">Marketeer uitnodigen</h2>
              <div className="flex flex-col gap-2 sm:flex-row min-w-0">
                <input
                  className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 text-base"
                  placeholder="email@marketeer.nl"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void inviteMarketer()}
                  className="rounded border border-neutral-900 px-4 py-2.5 shrink-0"
                >
                  Uitnodigen
                </button>
              </div>
              {lastInviteToken && (
                <p className="text-xs sm:text-sm break-all rounded border border-amber-200 bg-amber-50 px-3 py-2">
                  Deelbare accept-link (kopieer naar marketeer):{' '}
                  <span className="font-mono">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu'}
                    /affiliate/company?invite={lastInviteToken}
                  </span>
                </p>
              )}
              {invites.length > 0 && (
                <ul className="text-sm space-y-1 text-neutral-600">
                  {invites.map((inv) => (
                    <li key={String(inv.id)} className="break-all">
                      Openstaand: {String(inv.email)} ({String(inv.role)})
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-lg sm:text-xl font-medium">Campagne + trackinglink</h2>
            <div className="flex flex-col gap-2 sm:flex-row min-w-0">
              <input
                className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 text-base"
                placeholder="Campagnenaam"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createCampaignAndLink()}
                className="rounded bg-orange-600 px-4 py-2.5 text-white disabled:opacity-50 shrink-0"
              >
                Aanmaken
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {campaigns.map((c) => (
                <li key={String(c.id)}>
                  {String(c.name)} — {String(c.status)}
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm break-all">
              {assets.map((a) => (
                <li key={String(a.id)}>
                  {String(a.type)}: {String(a.trackingUrl || a.slug)} ({String(a.status)})
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 border-t border-neutral-200 pt-6">
            <h2 className="text-lg sm:text-xl font-medium">Team</h2>
            <ul className="text-sm space-y-1">
              {members.map((m) => (
                <li key={String(m.id)} className="break-all">
                  {String(m.userId)} — {String(m.role)}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {!session && null}
    </main>
  );
}

function companyMessage(code: unknown, en: boolean): string {
  switch (code) {
    case 'KVK_INVALID_FORMAT':
      return en ? 'Enter a KvK number of 8 digits.' : 'Vul een KvK-nummer van 8 cijfers in.';
    case 'KVK_REQUIRED':
      return en ? 'A KvK number is required for a business affiliate.' : 'Een KvK-nummer is nodig voor een zakelijke affiliate.';
    case 'KVK_ALREADY_SET':
      return en
        ? 'This profile already has a different KvK number.'
        : 'Dit profiel heeft al een ander KvK-nummer.';
    case 'PERSONAL_AFFILIATE_REQUIRED':
      return en ? 'Become an affiliate before saving a company profile.' : 'Word eerst affiliate voordat je een bedrijfsprofiel opslaat.';
    case 'INVALID_NAME':
      return en ? 'Enter the company name.' : 'Vul de bedrijfsnaam in.';
    default:
      return en ? 'Saving failed.' : 'Opslaan mislukt.';
  }
}

function kvkNote(
  lookup: { status?: string; registeredName?: string | null } | null | undefined,
  en: boolean,
): string | null {
  if (lookup?.status === 'confirmed' && lookup.registeredName) {
    return en
      ? `KvK lists this company as ${lookup.registeredName}.`
      : `KvK vermeldt dit bedrijf als ${lookup.registeredName}.`;
  }
  return null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-neutral-200 px-3 py-3 sm:px-4">
      <p className="text-[10px] sm:text-xs uppercase tracking-wide text-neutral-500 leading-tight">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type Membership = {
  role: string;
  organization: {
    id: string;
    slug: string;
    companyName: string;
    displayName: string;
    status: string;
    isCertificationOnly?: boolean;
  };
};

export default function AffiliateCompanyPageClient() {
  const { data: session, status } = useSession();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [campaignName, setCampaignName] = useState('');

  async function refreshList() {
    const res = await fetch('/api/affiliate/organization');
    const json = await res.json();
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
    if (selectedId) void refreshDetail(selectedId);
  }, [selectedId]);

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
          isCertificationOnly: false,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMessage(json.code || 'Aanmaken mislukt');
        return;
      }
      setCompanyName('');
      setMessage('Bedrijf aangemaakt');
      await refreshList();
      if (json.organization?.id) setSelectedId(json.organization.id);
    } finally {
      setBusy(false);
    }
  }

  async function inviteMarketer() {
    if (!selectedId || !inviteEmail) return;
    setBusy(true);
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
      setMessage(json.ok ? 'Uitnodiging aangemaakt' : json.code || 'Uitnodigen mislukt');
      if (json.ok) {
        setInviteEmail('');
        await refreshDetail(selectedId);
      }
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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p>Log in om je affiliatebedrijf te beheren.</p>
        <Link href="/login" className="text-orange-700 underline">
          Inloggen
        </Link>
      </main>
    );
  }

  const org = (detail as { organization?: Record<string, unknown> } | null)?.organization;
  const role = (detail as { role?: string } | null)?.role;
  const assets = (org?.trackingAssets as Array<Record<string, unknown>> | undefined) ?? [];
  const campaigns = (org?.campaigns as Array<Record<string, unknown>> | undefined) ?? [];
  const members = (org?.members as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">
          <Link href="/affiliate" className="underline">
            Affiliate
          </Link>{' '}
          / Bedrijf
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Affiliatebedrijf</h1>
        <p className="text-neutral-600 max-w-2xl">
          Beheer campagnes, marketeers en verdiensten. Referrals horen economisch bij het bedrijf —
          niet bij de individuele marketeer.
        </p>
      </header>

      {message && (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <section className="space-y-3 border-t border-neutral-200 pt-6">
        <h2 className="text-xl font-medium">Nieuw bedrijf</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded border border-neutral-300 px-3 py-2"
            placeholder="Bedrijfsnaam"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || companyName.trim().length < 2}
            onClick={() => void createCompany()}
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Bedrijf aanmaken
          </button>
        </div>
      </section>

      {memberships.length > 0 && (
        <section className="space-y-3 border-t border-neutral-200 pt-6">
          <h2 className="text-xl font-medium">Jouw bedrijven</h2>
          <select
            className="w-full max-w-md rounded border border-neutral-300 px-3 py-2"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-neutral-200 pt-6">
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

          {(role === 'OWNER' || role === 'ADMIN') && (
            <section className="space-y-3 border-t border-neutral-200 pt-6">
              <h2 className="text-xl font-medium">Marketeer uitnodigen</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded border border-neutral-300 px-3 py-2"
                  placeholder="email@marketeer.nl"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void inviteMarketer()}
                  className="rounded border border-neutral-900 px-4 py-2"
                >
                  Uitnodigen
                </button>
              </div>
            </section>
          )}

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-xl font-medium">Campagne + trackinglink</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded border border-neutral-300 px-3 py-2"
                placeholder="Campagnenaam"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createCampaignAndLink()}
                className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50"
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
            <h2 className="text-xl font-medium">Team</h2>
            <ul className="text-sm space-y-1">
              {members.map((m) => (
                <li key={String(m.id)}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import OperationsShell from '@/components/operations/OperationsShell';
import { useTranslation } from '@/hooks/useTranslation';

type PartnerRow = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  status: string;
  createdAt: string;
  referralCount?: number;
  overrideCents?: number;
};

type PendingInvite = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  expiresAt: string;
  inviteLink?: string;
};

type PartnersPayload = {
  affiliate: { status: string; canManagePartners?: boolean; isSubAffiliate?: boolean };
  subAffiliates?: PartnerRow[];
  pendingInvites?: PendingInvite[];
};

function euro(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );
}

export default function MyPartnersClient({ openInvite }: { openInvite?: boolean }) {
  const { t, language } = useTranslation();
  const [data, setData] = useState<PartnersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(openInvite));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/affiliate/dashboard');
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const json = (await res.json()) as PartnersPayload;
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (openInvite) setShowForm(true);
  }, [openInvite]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setInviteLink(null);
    try {
      const res = await fetch('/api/affiliate/create-sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          locale: language === 'en' ? 'en' : 'nl',
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || t('affiliate.dashboard.subAffiliateCreateError'));
        return;
      }
      if (result.invite?.inviteLink) {
        setInviteLink(result.invite.inviteLink);
        setNotice(
          result.invite.emailSent
            ? t('partners.myPartners.emailSent')
            : t('partners.myPartners.emailMissing'),
        );
        try {
          await navigator.clipboard.writeText(result.invite.inviteLink);
        } catch {
          /* link stays visible */
        }
      }
      setEmail('');
      setName('');
      setShowForm(false);
      await load();
    } catch {
      setError(t('affiliate.dashboard.subAffiliateCreateError'));
    } finally {
      setBusy(false);
    }
  }

  const partners = data?.subAffiliates ?? [];
  const pending = data?.pendingInvites ?? [];
  const canInvite = Boolean(data?.affiliate?.canManagePartners);

  return (
    <OperationsShell
      pageTitle={t('partners.myPartners.title')}
      pageSubtitle={t('partners.myPartners.emptyBody')}
      breadcrumbLabel={t('partners.myPartners.nav')}
      contentClassName="py-0"
    >
      <div className="max-w-3xl py-6 sm:py-8 space-y-6">
        <Link
          href="/affiliate/dashboard"
          className="inline-flex text-sm font-medium text-emerald-800 hover:underline"
        >
          {t('partners.myPartners.back')}
        </Link>

        {loading ? (
          <p className="text-sm text-gray-600">{t('affiliate.dashboard.loading')}</p>
        ) : null}

        {!loading && data && !canInvite ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {t('partners.myPartners.suspended')}
          </p>
        ) : null}

        {!loading && partners.length === 0 && pending.length === 0 ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('partners.myPartners.emptyTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {t('partners.myPartners.emptyBody')}
            </p>
            {canInvite ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
              >
                {t('partners.myPartners.invite')}
              </button>
            ) : null}
          </section>
        ) : null}

        {canInvite ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {(partners.length > 0 || pending.length > 0) && !showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {t('partners.myPartners.invite')}
              </button>
            ) : null}
            <Link
              href="/affiliate/dashboard?tab=sub-affiliates&manage=1"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {t('affiliate.dashboard.updateCommissions')}
            </Link>
          </div>
        ) : null}

        {canInvite ? (
          <section className="rounded-2xl border bg-white p-5 sm:p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('partners.inviteOffer.title')}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {t('partners.inviteOffer.intro')}
            </p>
            <p className="text-sm font-medium text-gray-800">
              {t('partners.inviteOffer.earnTitle')}
            </p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-800">
              {t('partners.inviteOffer.rate')}
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              {t('partners.inviteOffer.detail')}
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              {t('partners.inviteOffer.notOrder')}
            </p>
          </section>
        ) : null}

        {showForm && canInvite ? (
          <form onSubmit={onInvite} className="rounded-2xl border bg-white p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('partners.myPartners.invite')}
            </h2>
            <label className="block text-sm font-medium text-gray-800">
              {t('affiliate.dashboard.subName')}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={t('affiliate.dashboard.fullName')}
              />
            </label>
            <label className="block text-sm font-medium text-gray-800">
              {t('affiliate.dashboard.subEmail')}
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={t('affiliate.dashboard.emailPlaceholder')}
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t('affiliate.dashboard.creating') : t('partners.myPartners.invite')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
              >
                {t('affiliate.dashboard.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        ) : null}
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950 space-y-2">
            <p>{notice}</p>
            {inviteLink ? (
              <p className="break-all font-medium">
                {t('partners.myPartners.linkReady')}: {inviteLink}
              </p>
            ) : null}
          </div>
        ) : null}

        {pending.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">
              {t('partners.myPartners.pendingTitle')}
            </h2>
            <ul className="space-y-3">
              {pending.map((invite) => (
                <li key={invite.id} className="rounded-xl border bg-white p-4">
                  <p className="font-medium text-gray-900">{invite.name || invite.email}</p>
                  <p className="text-sm text-gray-600">{invite.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('partners.myPartners.invited')} ·{' '}
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                  {invite.inviteLink ? (
                    <button
                      type="button"
                      className="mt-3 text-sm font-medium text-emerald-800 hover:underline"
                      onClick={() => navigator.clipboard.writeText(invite.inviteLink || '')}
                    >
                      {t('partners.myPartners.copyLink')}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {partners.length > 0 ? (
          <ul className="space-y-3">
            {partners.map((partner) => (
              <li key={partner.id} className="rounded-xl border bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {partner.name || partner.username || partner.email}
                    </p>
                    {partner.username ? (
                      <p className="text-sm text-gray-600">@{partner.username}</p>
                    ) : null}
                    <p className="text-sm text-gray-600">{partner.email}</p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                      partner.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {partner.status === 'ACTIVE'
                      ? t('partners.myPartners.active')
                      : t('partners.myPartners.inactive')}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-gray-500">{t('partners.myPartners.joined')}</dt>
                    <dd>{new Date(partner.createdAt).toLocaleDateString()}</dd>
                  </div>
                  {typeof partner.referralCount === 'number' ? (
                    <div>
                      <dt className="text-xs text-gray-500">{t('partners.myPartners.referrals')}</dt>
                      <dd>{partner.referralCount}</dd>
                    </div>
                  ) : null}
                  {typeof partner.overrideCents === 'number' ? (
                    <div>
                      <dt className="text-xs text-gray-500">{t('partners.myPartners.override')}</dt>
                      <dd>{euro(partner.overrideCents)}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </OperationsShell>
  );
}

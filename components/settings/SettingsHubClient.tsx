'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Phone,
  Shield,
  Bell,
  CreditCard,
  Truck,
  TrendingUp,
  Crown,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import ProfileSettings from '@/components/profile/ProfileSettings';
import MakerContactSettings from '@/components/profile/MakerContactSettings';
import PrivacySettings from '@/components/profile/PrivacySettings';
import NotificationSettings from '@/components/profile/NotificationSettings';
import AccountSettings from '@/components/profile/AccountSettings';
import StripeConnectSetup from '@/components/profile/StripeConnectSetup';
import HelpSettings from '@/components/onboarding/HelpSettings';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getVisibleSettingsTabs,
  isSettingsTabId,
  type SettingsTabId,
} from '@/lib/settings/settings-hub';
import {
  countEarningRoles,
  userHasEarningsHub,
} from '@/lib/navigation/primary-dashboard';

export type SettingsHubUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  quote: string | null;
  place: string | null;
  gender: string | null;
  interests: string[];
  profileImage: string | null;
  role: string;
  sellerRoles: string[];
  buyerRoles: string[];
  displayFullName: boolean;
  displayNameOption: string;
  encryptionEnabled: boolean;
  hasPassword: boolean;
  emailVerified: Date | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  SellerProfile?: {
    subscriptionId: string | null;
    subscriptionValidUntil: Date | null;
    Subscription?: { name: string; priceCents: number } | null;
  } | null;
};

type TabDef = {
  id: SettingsTabId;
  labelKey: string;
  fallback: string;
  icon: typeof User;
};

const TAB_DEFS: TabDef[] = [
  { id: 'profile', labelKey: 'navbar.myProfile', fallback: 'Profiel', icon: User },
  { id: 'contact', labelKey: 'makerContact.settingsTitle', fallback: 'Bereikbaarheid', icon: Phone },
  { id: 'privacy', labelKey: 'navbar.privacy', fallback: 'Privacy', icon: Shield },
  { id: 'notifications', labelKey: 'notificationSettings.title', fallback: 'Meldingen', icon: Bell },
  { id: 'payments', labelKey: 'settingsHub.payments', fallback: 'Betalingen', icon: CreditCard },
  { id: 'delivery', labelKey: 'settingsHub.delivery', fallback: 'Bezorging', icon: Truck },
  { id: 'affiliate', labelKey: 'navbar.affiliateDashboard', fallback: 'Affiliate', icon: TrendingUp },
  { id: 'subscription', labelKey: 'settingsHub.subscription', fallback: 'Abonnement', icon: Crown },
];

type Props = {
  user: SettingsHubUser;
  hubContext: {
    role?: string | null;
    sellerRoles?: string[];
    hasDeliveryProfile?: boolean;
    hasAffiliate?: boolean;
    subscriptionId?: string | null;
  };
};

export default function SettingsHubClient({ user, hubContext }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');
  const accountTabParam = searchParams.get('accountTab');
  const visibleIds = useMemo(
    () => getVisibleSettingsTabs(hubContext),
    [hubContext]
  );
  const showCombinedEarningsLink = useMemo(
    () => userHasEarningsHub(hubContext) && countEarningRoles(hubContext) >= 2,
    [hubContext]
  );
  const initialTab = isSettingsTabId(tabParam) && visibleIds.includes(tabParam)
    ? tabParam
    : visibleIds[0] ?? 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  const accountInitialTab =
    accountTabParam === 'delete'
      ? 'delete'
      : accountTabParam === 'password'
        ? 'password'
        : 'password';
  const deleteInitialStep = accountTabParam === 'delete' ? 3 : 1;

  const setTab = useCallback(
    (id: SettingsTabId) => {
      setActiveTab(id);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  const visibleTabs = TAB_DEFS.filter((tab) => visibleIds.includes(tab.id));

  const handleProfileSave = async (data: Record<string, unknown>) => {
    const response = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(typeof err.error === 'string' ? err.error : 'Save failed');
    }
    window.location.reload();
  };

  const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
    const res = await fetch('/api/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Password update failed');
    }
  };

  const noopAsync = async () => {};

  return (
    <div className="min-h-screen hc-dorpsplein-page pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('settingsHub.backToProfile') || 'Terug naar profiel'}
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('navigation.settings') || 'Instellingen'}
          </h1>
          <p className="text-base text-gray-600 mt-2 max-w-xl leading-relaxed">
            {t('settingsHub.intro') ||
              'Beheer profiel, bereikbaarheid, privacy en account op één plek.'}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          <nav
            className="lg:w-56 shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0"
            aria-label={t('navigation.settings') || 'Instellingen'}
          >
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'hc-settings-nav-active'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-primary-50/50 hover:border-primary-brand/20'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t(tab.labelKey) || tab.fallback}
                </button>
              );
            })}
          </nav>

          <main className="flex-1 min-w-0">
            <div className="hc-dorpsplein-card bg-white p-5 sm:p-8 shadow-sm">
              {activeTab === 'profile' && (
                <ProfileSettings
                  user={user as Parameters<typeof ProfileSettings>[0]['user']}
                  onSave={handleProfileSave}
                  scrollToSection={sectionParam}
                />
              )}

              {activeTab === 'contact' && <MakerContactSettings />}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <PrivacySettings embedded />
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {t('settingsMenu.accountTitle') || 'Account'}
                    </h3>
                    <AccountSettings
                      user={{
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        hasPassword: user.hasPassword,
                        emailVerified: user.emailVerified,
                      }}
                      onUpdatePassword={handlePasswordUpdate}
                      onUpdateEmail={noopAsync}
                      onAccountDeleted={() => {
                        window.location.href = '/';
                      }}
                      hideEmailTab
                      initialTab={accountInitialTab}
                      deleteInitialStep={deleteInitialStep}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <NotificationSettings onUpdateSettings={noopAsync} />
                  <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">
                    {t('settingsHub.nativeAppHint') || 'App-meldingen en systeemrechten: '}
                    <Link href="/settings/app" className="text-emerald-700 hover:underline">
                      {t('settingsHub.nativeAppLink') || 'App-instellingen'}
                    </Link>
                  </p>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <StripeConnectSetup
                    stripeConnectAccountId={user.stripeConnectAccountId}
                    stripeConnectOnboardingCompleted={user.stripeConnectOnboardingCompleted}
                    onUpdate={() => router.refresh()}
                  />
                  <Link
                    href="/verkoper/revenue"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
                  >
                    {t('settingsHub.payoutsLink') || 'Uitbetalingen & omzet'}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  {showCombinedEarningsLink ? (
                    <Link
                      href="/verdiensten"
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-700 hover:underline"
                    >
                      {t('navbar.combinedEarnings')}
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : null}
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {t('settingsHub.deliveryIntro') ||
                      'Beheer beschikbaarheid, radius, GPS en planning voor bezorgen.'}
                  </p>
                  <Link
                    href="/delivery/settings"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    {t('settingsHub.openDeliverySettings') || 'Bezorginstellingen openen'}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {activeTab === 'affiliate' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {t('settingsHub.affiliateIntro') ||
                      'Referral-link, commissies en uitbetalingen beheer je in het affiliate-dashboard.'}
                  </p>
                  <Link
                    href="/affiliate/dashboard"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    {t('navbar.affiliateDashboard') || 'Affiliate dashboard'}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-4">
                  {user.SellerProfile?.Subscription ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-semibold text-gray-900">
                        {user.SellerProfile.Subscription.name}
                      </p>
                      {user.SellerProfile.subscriptionValidUntil && (
                        <p className="text-sm text-gray-600 mt-1">
                          {t('settingsHub.validUntil') || 'Geldig tot'}:{' '}
                          {new Date(user.SellerProfile.subscriptionValidUntil).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {t('settingsHub.noSubscription') ||
                        'Geen actief abonnement. Premium geeft extra zichtbaarheid en contactopties.'}
                    </p>
                  )}
                  <Link
                    href="/sell"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-emerald-200 text-emerald-800 text-sm font-semibold hover:bg-emerald-50"
                  >
                    {t('settingsHub.viewPlans') || 'Abonnementen bekijken'}
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-4">
              <HelpSettings />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Handshake,
  Heart,
  ImagePlus,
  Package,
  Palette,
  Pencil,
  Shield,
  Sparkles,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import RoleQuickLinksSection from '@/components/navigation/RoleQuickLinksSection';
import { useSession } from 'next-auth/react';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';
import { useTranslation } from '@/hooks/useTranslation';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import {
  deriveOwnerSidepanelData,
  emptyWorkspaceCounts,
  getHighlightedCommunityAction,
  getHighlightedQuickAction,
  parseWorkspacePhotoCounts,
  type QuickActionId,
} from '@/lib/profile/profile-v2/owner-sidepanel-data';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import { PROFILE_DEALS_NAV } from '@/lib/profile/deals-navigation';
import type {
  ProfileV2AanbodFilter,
  ProfileV2Context,
  ProfileV2InspiratieFilter,
  ProfileV2TabId,
} from '@/lib/profile/profile-v2/types';
import { cn } from '@/lib/utils';

export type ProfileV2OwnerSidepanelProps = {
  ctx: ProfileV2Context;
  activeTab: ProfileV2TabId;
  aanbodFilter: ProfileV2AanbodFilter;
  inspiratieFilter: ProfileV2InspiratieFilter;
  onTabChange: (tab: ProfileV2TabId) => void;
  onEditProfile?: () => void;
};

type Surface = 'mobile-inline' | 'desktop-sticky';

type SidepanelContextValue = ProfileV2OwnerSidepanelProps & {
  derived: ReturnType<typeof deriveOwnerSidepanelData>;
  openAddAanbod: () => void;
  openAddInspiratie: () => void;
  openStripeSetup: () => void;
  stripeLoading: boolean;
};

const SidepanelContext = createContext<SidepanelContextValue | null>(null);

function useSidepanelContext(): SidepanelContextValue {
  const value = useContext(SidepanelContext);
  if (!value) {
    throw new Error('ProfileV2OwnerSidepanel must be used within ProfileV2OwnerSidepanelProvider');
  }
  return value;
}

export function ProfileV2OwnerSidepanelProvider({
  children,
  ...props
}: ProfileV2OwnerSidepanelProps & { children: ReactNode }) {
  const { ctx } = props;
  const createFlow = useCreateFlow();
  const [workspaceCounts, setWorkspaceCounts] = useState(emptyWorkspaceCounts);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    if (!ctx.viewerIsOwner) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/profile/workspace-photos?userId=${encodeURIComponent(ctx.user.id)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          photos?: Record<string, unknown[] | undefined>;
        };
        if (cancelled) return;
        setWorkspaceCounts(parseWorkspacePhotoCounts(data.photos));
      } catch {
        /* ignore — completeness falls back to incomplete workspace */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctx.viewerIsOwner, ctx.user.id]);

  const allowedVerticals = sellerRolesToAllowedVerticals(
    ctx.user.sellerRoles ?? [],
  );

  const openAddAanbod = useCallback(() => {
    createFlow.openCreateFlowWithIntent({
      mode: 'dorpsplein',
      allowedVerticals,
    });
  }, [createFlow, allowedVerticals]);

  const openAddInspiratie = useCallback(() => {
    createFlow.openCreateFlowWithIntent({
      mode: 'inspiratie',
      allowedVerticals,
    });
  }, [createFlow, allowedVerticals]);

  const openStripeSetup = useCallback(() => {
    setStripeLoading(true);
    void startStripeConnectOnboarding().finally(() => setStripeLoading(false));
  }, []);

  const derived = useMemo(
    () => deriveOwnerSidepanelData(ctx, workspaceCounts),
    [ctx, workspaceCounts],
  );

  const value = useMemo(
    () => ({
      ...props,
      derived,
      openAddAanbod,
      openAddInspiratie,
      openStripeSetup,
      stripeLoading,
    }),
    [
      props,
      derived,
      openAddAanbod,
      openAddInspiratie,
      openStripeSetup,
      stripeLoading,
    ],
  );

  return (
    <SidepanelContext.Provider value={value}>{children}</SidepanelContext.Provider>
  );
}

function SidepanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('hc-dorpsplein-card border-primary-brand/10 bg-white px-4 py-3', className)}>
      <h3 className="hc-section-title mb-3 text-base">{title}</h3>
      {children}
    </section>
  );
}

function SidepanelActionCard({
  icon,
  title,
  description,
  highlighted,
  onClick,
  href,
  disabled,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  highlighted?: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const inner = (
    <div
      className={cn(
        'group flex min-h-[44px] w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition touch-manipulation',
        highlighted
          ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm ring-1 ring-emerald-200/60'
          : 'border-gray-200/80 bg-white hover:border-secondary-brand/30 hover:bg-secondary-50/40',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span
        className={cn(
          'mt-0.5 inline-flex shrink-0 rounded-lg p-2',
          highlighted
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-50 text-gray-600 group-hover:bg-secondary-50/80',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ?? (
        <ArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
          aria-hidden
        />
      )}
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} prefetch={false} className="block w-full">
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block w-full"
    >
      {inner}
    </button>
  );
}

function RoleQuickLinksQuickBlock() {
  const { data: session } = useSession();
  const ctx = primaryDashboardContextFromUser(
    session?.user as Record<string, unknown> | undefined,
  );

  return (
    <RoleQuickLinksSection
      ctx={ctx}
      surface="profile"
      titleKey="roleQuickLinks.profileTitle"
      max={4}
      compact
      className="border-0 shadow-none"
    />
  );
}

function QuickActionsBlock() {
  const { t } = useTranslation();
  const {
    activeTab,
    onTabChange,
    onEditProfile,
    openAddAanbod,
    openAddInspiratie,
    derived,
  } = useSidepanelContext();
  const highlight = getHighlightedQuickAction(activeTab);

  const actions: Array<{
    id: QuickActionId;
    icon: ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
  }> = [
    {
      id: 'addAanbod',
      icon: <Store className="h-4 w-4" />,
      title: t('profileV2.sidepanel.quickActions.addAanbod'),
      description: t('profileV2.sidepanel.quickActions.addAanbodDesc'),
      onClick: openAddAanbod,
    },
    {
      id: 'addInspiratie',
      icon: <Sparkles className="h-4 w-4" />,
      title: t('profileV2.sidepanel.quickActions.addInspiratie'),
      description: t('profileV2.sidepanel.quickActions.addInspiratieDesc'),
      onClick: openAddInspiratie,
    },
    {
      id: 'trust',
      icon: <Shield className="h-4 w-4" />,
      title: t('profileV2.sidepanel.quickActions.trust'),
      description: t('profileV2.sidepanel.quickActions.trustDesc'),
      onClick: () => onTabChange('vertrouwen'),
    },
    {
      id: 'editProfile',
      icon: <Pencil className="h-4 w-4" />,
      title: t('profileV2.sidepanel.quickActions.editProfile'),
      description: t('profileV2.sidepanel.quickActions.editProfileDesc'),
      onClick: () => {
        if (onEditProfile) onEditProfile();
        else window.location.href = '/settings';
      },
    },
  ];

  if (!derived.hasSellerRoles) {
    return (
      <SidepanelSection title={t('profileV2.sidepanel.quickActions.title')}>
        <SidepanelActionCard
          icon={<Pencil className="h-4 w-4" />}
          title={t('profileV2.sidepanel.quickActions.editProfile')}
          description={t('profileV2.aanbod.noMakerDesc')}
          href="/onboarding/seller"
        />
      </SidepanelSection>
    );
  }

  return (
    <SidepanelSection title={t('profileV2.sidepanel.quickActions.title')}>
      <div className="space-y-2">
        {actions.map((action) => (
          <SidepanelActionCard
            key={action.id}
            icon={action.icon}
            title={action.title}
            description={action.description}
            highlighted={highlight === action.id}
            onClick={action.onClick}
          />
        ))}
      </div>
    </SidepanelSection>
  );
}

function CompletenessBlock({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { derived } = useSidepanelContext();
  const { completenessItems, completenessPercent } = derived;

  const visibleItems = compact
    ? completenessItems.filter((item) => !item.done).slice(0, 3)
    : completenessItems;

  return (
    <SidepanelSection
      title={t('profileV2.sidepanel.completeness.title')}
      className="hc-dorpsplein-card-warm border-amber-200/50"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-600">
          {completenessPercent >= 100
            ? t('profileV2.sidepanel.completeness.completeHint')
            : t('profileV2.sidepanel.completeness.hint')}
        </p>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {completenessPercent}%
        </span>
      </div>
      <div className="hc-reputation-progress mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500 ease-out"
          style={{ width: `${completenessPercent}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {visibleItems.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-xs text-gray-700">
            {item.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
            )}
            <span className={item.done ? 'text-gray-500 line-through' : undefined}>
              {t(item.labelKey)}
            </span>
          </li>
        ))}
      </ul>
    </SidepanelSection>
  );
}

function NextStepBlock() {
  const { t } = useTranslation();
  const {
    activeTab,
    derived,
    onTabChange,
    openAddAanbod,
    openAddInspiratie,
    openStripeSetup,
    stripeLoading,
  } = useSidepanelContext();
  const { nextStep, publicProfileHref } = derived;

  const handleClick = () => {
    switch (nextStep.id) {
      case 'setupRoles':
        window.location.href = '/onboarding/seller';
        break;
      case 'firstAanbod':
        openAddAanbod();
        break;
      case 'firstInspiratie':
        openAddInspiratie();
        break;
      case 'stripe':
        openStripeSetup();
        break;
      case 'viewPublicProfile':
        if (publicProfileHref) {
          window.location.href = publicProfileHref;
        } else {
          onTabChange('community');
        }
        break;
      case 'workspacePhotos':
        onTabChange('vertrouwen');
        break;
      default:
        if (nextStep.tab) onTabChange(nextStep.tab);
    }
  };

  const highlighted =
    (nextStep.tab && activeTab === nextStep.tab) ||
    (nextStep.id === 'viewPublicProfile' && activeTab === 'community');

  return (
    <SidepanelSection title={t('profileV2.sidepanel.nextStep.sectionTitle')}>
      <SidepanelActionCard
        icon={<Sparkles className="h-4 w-4" />}
        title={t(nextStep.titleKey)}
        description={t(nextStep.descriptionKey)}
        highlighted={highlighted}
        onClick={handleClick}
        disabled={nextStep.id === 'stripe' && stripeLoading}
        trailing={
          nextStep.id === 'viewPublicProfile' && publicProfileHref ? (
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          ) : undefined
        }
      />
      <p className="mt-2 text-xs font-semibold text-emerald-800">
        {t(nextStep.ctaKey)}
      </p>
    </SidepanelSection>
  );
}

function TrustBlock() {
  const { t } = useTranslation();
  const { derived, onTabChange, activeTab } = useSidepanelContext();
  const { trustActions } = derived;

  if (trustActions.length === 0) return null;

  const icons = {
    kitchen: <Package className="h-4 w-4" />,
    garden: <ImagePlus className="h-4 w-4" />,
    studio: <Palette className="h-4 w-4" />,
    vehicle: <Store className="h-4 w-4" />,
  };

  return (
    <SidepanelSection title={t('profileV2.sidepanel.trust.title')}>
      <div className="space-y-2">
        {trustActions.map((action) => (
          <SidepanelActionCard
            key={action.id}
            icon={icons[action.id]}
            title={t(action.labelKey)}
            description={
              action.done
                ? t('profileV2.sidepanel.trust.done')
                : t('profileV2.sidepanel.trust.add')
            }
            highlighted={activeTab === 'vertrouwen' && !action.done}
            onClick={() => onTabChange('vertrouwen')}
            trailing={
              action.done ? (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : undefined
            }
          />
        ))}
      </div>
    </SidepanelSection>
  );
}

function CommunityBlock() {
  const { t } = useTranslation();
  const { ctx, activeTab, onTabChange, derived } = useSidepanelContext();
  const highlight = getHighlightedCommunityAction(activeTab);
  const { publicProfileHref } = derived;
  const fans = ctx.stats?.followers ?? 0;

  return (
    <SidepanelSection title={t('profileV2.sidepanel.community.title')}>
      <div className="space-y-2">
        <SidepanelActionCard
          icon={<Users className="h-4 w-4" />}
          title={t('profileV2.sidepanel.community.fans')}
          description={t('profileV2.sidepanel.community.fansDesc', { count: fans })}
          highlighted={highlight === 'fans'}
          onClick={() => onTabChange('community')}
        />
        <SidepanelActionCard
          icon={<Star className="h-4 w-4" />}
          title={t('profileV2.sidepanel.community.reviews')}
          description={t('profileV2.sidepanel.community.reviewsDesc')}
          onClick={() => onTabChange('community')}
        />
        {PROFILE_DEALS_NAV.enabled ? (
          <SidepanelActionCard
            icon={<Handshake className="h-4 w-4" />}
            title={t(PROFILE_DEALS_NAV.labelKey)}
            description={t('profileV2.sidepanel.community.dealsDesc')}
            href={PROFILE_DEALS_NAV.href}
            trailing={<ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
          />
        ) : null}
        {publicProfileHref ? (
          <SidepanelActionCard
            icon={<Heart className="h-4 w-4" />}
            title={t('profileV2.sidepanel.community.publicProfile')}
            description={t('profileV2.sidepanel.community.publicProfileDesc')}
            highlighted={highlight === 'publicProfile'}
            href={publicProfileHref}
            trailing={<ExternalLink className="mt-1 h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
          />
        ) : (
          <SidepanelActionCard
            icon={<Pencil className="h-4 w-4" />}
            title={t('profileV2.sidepanel.community.setUsername')}
            description={t('profileV2.sidepanel.community.setUsernameDesc')}
            onClick={() => onTabChange('overview')}
          />
        )}
      </div>
    </SidepanelSection>
  );
}

function HcpCompactStrip() {
  const { t } = useTranslation();
  const { ctx } = useSidepanelContext();
  const hcp = ctx.hcp;
  if (!hcp || hcp.totalHcp <= 0) return null;

  return (
    <div className="hc-dorpsplein-card border-amber-200/50 bg-gradient-to-br from-amber-50/70 to-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
            {t('profileV2.sidepanel.hcpLabel')}
          </p>
          <p className="text-lg font-bold tabular-nums text-gray-900">{hcp.totalHcp} HCP</p>
        </div>
        <Link
          href="/mijn-hcp"
          prefetch={false}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
        >
          {t('profileV2.community.hcpLink')}
        </Link>
      </div>
    </div>
  );
}

function SidepanelContent({ surface }: { surface: Surface }) {
  const compact = surface === 'mobile-inline';

  return (
    <div className={cn('flex flex-col gap-3', compact ? 'mb-2' : undefined)}>
      <NextStepBlock />
      {compact ? <CompletenessBlock compact /> : null}
      <QuickActionsBlock />
      <RoleQuickLinksQuickBlock />
      {!compact ? <CompletenessBlock /> : null}
      <TrustBlock />
      <CommunityBlock />
      {!compact ? <HcpCompactStrip /> : null}
    </div>
  );
}

export function ProfileV2OwnerSidepanelSurface({ surface }: { surface: Surface }) {
  const { t } = useTranslation();
  const label = t('profileV2.sidepanel.assistantLabel');

  if (surface === 'mobile-inline') {
    return (
      <div className="xl:hidden" aria-label={label}>
        <SidepanelContent surface={surface} />
      </div>
    );
  }

  return (
    <div className="hidden xl:block" aria-label={label}>
      <SidepanelContent surface={surface} />
    </div>
  );
}

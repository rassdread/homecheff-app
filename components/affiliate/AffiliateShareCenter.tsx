'use client';

import {
  Bike,
  Building2,
  Clapperboard,
  Share2,
  Store,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import {
  OPPORTUNITY_DESTINATIONS,
  type OpportunityId,
} from '@/lib/share/ecosystem-opportunities';

type ShareCardDef = {
  id: OpportunityId;
  icon: LucideIcon;
  accent: string;
  titleKey: string;
  descriptionKey: string;
  shareCopyKey: string;
};

const SHARE_CARDS: ShareCardDef[] = [
  {
    id: 'hub',
    icon: Share2,
    accent: 'bg-emerald-100 text-emerald-700',
    titleKey: 'affiliateDashboard.share.hub.title',
    descriptionKey: 'affiliateDashboard.share.hub.description',
    shareCopyKey: 'hub',
  },
  {
    id: 'seller',
    icon: Store,
    accent: 'bg-emerald-100 text-emerald-700',
    titleKey: 'affiliateDashboard.share.seller.title',
    descriptionKey: 'affiliateDashboard.share.seller.description',
    shareCopyKey: 'seller',
  },
  {
    id: 'delivery_individual',
    icon: Bike,
    accent: 'bg-sky-100 text-sky-700',
    titleKey: 'affiliateDashboard.share.delivery.title',
    descriptionKey: 'affiliateDashboard.share.delivery.description',
    shareCopyKey: 'delivery_individual',
  },
  {
    id: 'delivery_company',
    icon: Building2,
    accent: 'bg-indigo-100 text-indigo-700',
    titleKey: 'affiliateDashboard.share.deliveryCompany.title',
    descriptionKey: 'affiliateDashboard.share.deliveryCompany.description',
    shareCopyKey: 'delivery_company',
  },
  {
    id: 'affiliate',
    icon: Users,
    accent: 'bg-amber-100 text-amber-800',
    titleKey: 'affiliateDashboard.share.affiliate.title',
    descriptionKey: 'affiliateDashboard.share.affiliate.description',
    shareCopyKey: 'affiliate',
  },
  {
    id: 'affiliate_company',
    icon: Users,
    accent: 'bg-orange-100 text-orange-800',
    titleKey: 'affiliateDashboard.share.affiliateCompany.title',
    descriptionKey: 'affiliateDashboard.share.affiliateCompany.description',
    shareCopyKey: 'affiliate_company',
  },
  {
    id: 'studio',
    icon: Clapperboard,
    accent: 'bg-violet-100 text-violet-700',
    titleKey: 'affiliateDashboard.share.studio.title',
    descriptionKey: 'affiliateDashboard.share.studio.description',
    shareCopyKey: 'studio',
  },
  {
    id: 'growth',
    icon: TrendingUp,
    accent: 'bg-teal-100 text-teal-800',
    titleKey: 'affiliateDashboard.share.growth.title',
    descriptionKey: 'affiliateDashboard.share.growth.description',
    shareCopyKey: 'growth',
  },
];

/**
 * Commercial "Deel & verdien" share center for the Affiliate dashboard.
 * URLs stay internal to EcosystemShareAction — never shown as primary labels.
 */
export default function AffiliateShareCenter() {
  const { t, tOr, isReady } = useTranslation();

  const heading = tOr(
    'affiliateDashboard.share.title',
    'Share & earn',
    'Deel & verdien',
  );
  const subtitle = tOr(
    'affiliateDashboard.share.subtitle',
    'Choose what to promote. HomeCheff creates the right affiliate link for you.',
    'Kies wat je wilt promoten. HomeCheff maakt automatisch de juiste affiliate-link voor je.',
  );

  return (
    <section
      aria-labelledby="share-center-heading"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5"
      data-affiliate-share-center
    >
      <h2 id="share-center-heading" className="text-lg font-semibold text-slate-900">
        {heading}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SHARE_CARDS.map((card) => {
          const dest = OPPORTUNITY_DESTINATIONS[card.id];
          const Icon = card.icon;
          const title = isReady
            ? t(card.titleKey) || fallbackTitle(card.id)
            : fallbackTitle(card.id);
          const description = isReady
            ? t(card.descriptionKey) || fallbackDescription(card.id)
            : fallbackDescription(card.id);
          const shareText = isReady
            ? t(`verdienHub.shareCopy.${card.shareCopyKey}`) || description
            : description;

          return (
            <li
              key={card.id}
              className="flex flex-col gap-3 rounded-xl border border-emerald-100/80 bg-white p-4 shadow-sm"
              data-share-opportunity={card.id}
              data-share-href={dest.href}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.accent}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 break-words">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 break-words">
                    {description}
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <EcosystemShareAction
                  destinationHref={dest.href}
                  title={title}
                  text={shareText}
                  surface="affiliate_share_center"
                  product={dest.product}
                  opportunityId={card.id}
                  label={tOr('share.shareItem', 'Share', 'Delen')}
                  variant="button"
                  className="w-full justify-center"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function fallbackTitle(id: OpportunityId): string {
  switch (id) {
    case 'hub':
      return 'Alle mogelijkheden';
    case 'seller':
      return 'Verkopers & makers aanmelden';
    case 'delivery_individual':
      return 'Bezorgers aanmelden';
    case 'delivery_company':
      return 'Bezorgbedrijven aanmelden';
    case 'affiliate':
      return 'Affiliates aanmelden';
    case 'affiliate_company':
      return 'Zakelijke affiliatepartners';
    case 'studio':
      return 'HomeCheff Studio';
    case 'growth':
      return 'HomeCheff Growth';
    default:
      return 'HomeCheff';
  }
}

function fallbackDescription(id: OpportunityId): string {
  switch (id) {
    case 'hub':
      return 'Deel het overzicht van alle manieren om mee te doen met HomeCheff.';
    case 'seller':
      return 'Breng makers naar HomeCheff en verdien volgens het geldende affiliateprogramma.';
    case 'delivery_individual':
      return 'Nodig zelfstandige bezorgers uit om lokaal opdrachten te ontvangen.';
    case 'delivery_company':
      return 'Introduceer lokale bezorgbedrijven met eigen chauffeurs.';
    case 'affiliate':
      return 'Nodig anderen uit om HomeCheff te promoten in hun netwerk.';
    case 'affiliate_company':
      return 'Deel de zakelijke partnerroute voor marketing- en acquisitieteams.';
    case 'studio':
      return 'Promoot Studio bij makers, bedrijven en creators.';
    case 'growth':
      return 'Promoot Growth bij bedrijven die zakelijke leads zoeken.';
    default:
      return 'Deel deze HomeCheff-mogelijkheid.';
  }
}

/** Exported for regression tests — human labels must never be raw routes. */
export const AFFILIATE_SHARE_CENTER_IDS = SHARE_CARDS.map((c) => c.id);
export const AFFILIATE_SHARE_CENTER_HREFS = Object.fromEntries(
  SHARE_CARDS.map((c) => [c.id, OPPORTUNITY_DESTINATIONS[c.id].href]),
) as Record<OpportunityId, string>;

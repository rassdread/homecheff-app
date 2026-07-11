import Link from 'next/link';
import type { EvidenceListItem, EvidenceSnapshot } from '@/lib/living-platform/evidence-queries';
import type { LivingPlatformLang } from '@/lib/living-platform/server-i18n';
import { lpString } from '@/lib/living-platform/server-i18n';

const NS = 'livingPlatformEvidence';

function EvidenceModule({
  title,
  items,
  emptyLabel,
  countLabel,
  count,
}: {
  title: string;
  items: EvidenceListItem[];
  emptyLabel: string;
  countLabel?: string;
  count?: number;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {countLabel != null && count != null ? (
        <p className="mt-1 text-sm text-gray-600">
          {countLabel}: <span className="font-medium text-gray-900">{count}</span>
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={`${item.label}-${i}`} className="text-sm">
              {item.href ? (
                <Link href={item.href} className="font-medium text-emerald-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-900">{item.label}</span>
              )}
              {item.meta ? <span className="ml-2 text-gray-500">{item.meta}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Props = {
  snapshot: EvidenceSnapshot;
  lang: LivingPlatformLang;
  emptyLabel: string;
};

export default function EvidenceDashboard({ snapshot, lang, emptyLabel }: Props) {
  const t = (key: string) => lpString(NS, key, lang);

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <EvidenceModule title={t('sectionMakersTitle')} items={snapshot.recentMakers} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionListingsTitle')} items={snapshot.recentListings} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionInspirationTitle')} items={snapshot.recentInspiration} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionRequestsTitle')} items={snapshot.recentRequests} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionBarterTitle')} items={snapshot.recentBarterListings} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionCitiesTitle')} items={snapshot.activeCities} emptyLabel={emptyLabel} />
      <EvidenceModule title={t('sectionCategoriesTitle')} items={snapshot.categoryActivity} emptyLabel={emptyLabel} />
      <EvidenceModule
        title={t('sectionDeliveryTitle')}
        items={[]}
        emptyLabel={emptyLabel}
        countLabel={t('deliveryCountLabel')}
        count={snapshot.deliveryPartnersCount}
      />
      <EvidenceModule
        title={t('sectionCommunityOrdersTitle')}
        items={[]}
        emptyLabel={emptyLabel}
        countLabel={t('communityOrdersCountLabel')}
        count={snapshot.completedCommunityOrdersWeek}
      />
    </div>
  );
}

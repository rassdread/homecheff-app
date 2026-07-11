import type { PlatformStatistics } from '@/lib/living-platform/evidence-queries';
import type { LivingPlatformLang } from '@/lib/living-platform/server-i18n';
import { lpString } from '@/lib/living-platform/server-i18n';

const NS = 'livingPlatformStatistics';

type Props = {
  stats: PlatformStatistics;
  lang: LivingPlatformLang;
};

export default function StatisticsTable({ stats, lang }: Props) {
  const t = (key: string) => lpString(NS, key, lang);

  const rows: Array<{ label: string; value: number }> = [
    { label: t('statPublicProfiles'), value: stats.publicProfiles },
    { label: t('statPublicListings'), value: stats.publicListings },
    { label: t('statInspiration'), value: stats.publishedInspiration },
    { label: t('statReviews'), value: stats.productReviews },
    { label: t('statDelivery'), value: stats.activeDeliveryPartners },
    { label: t('statCommunityOrders'), value: stats.completedCommunityOrders },
    { label: t('statBarter'), value: stats.barterOpenListings },
    { label: t('statRequests'), value: stats.neighbourhoodRequests },
    { label: t('statBusiness'), value: stats.businessSubscriptionsActive },
    { label: t('statCategories'), value: stats.categoriesInUse },
    { label: t('statIndexedCities'), value: stats.indexedCityHubs },
  ];

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-900">{t('colMetric')}</th>
            <th className="px-4 py-3 font-semibold text-gray-900">{t('colValue')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">{row.label}</td>
              <td className="px-4 py-3 font-mono text-gray-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

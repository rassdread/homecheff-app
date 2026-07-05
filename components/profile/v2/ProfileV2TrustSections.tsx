'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Clock, MapPin, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ProfileV2Context, ProfileV2SellerRole } from '@/lib/profile/profile-v2/types';
import {
  ProfileV2EmptyState,
  ProfileV2SectionCard,
} from '@/components/profile/v2/ProfileV2Ui';
import {
  ProfileV2VehiclePhotos,
  type ProfileV2VehiclePhoto,
} from '@/components/profile/v2/ProfileV2VehiclePhotos';

const WorkspacePhotoUpload = dynamic(
  () => import('@/components/workspace/WorkspacePhotoUpload'),
  { loading: () => <div className="h-32 animate-pulse rounded-xl bg-gray-100" />, ssr: false },
);

const WorkspacePhotosDisplay = dynamic(
  () => import('@/components/profile/WorkspacePhotosDisplay'),
  { loading: () => <div className="h-32 animate-pulse rounded-xl bg-gray-100" />, ssr: false },
);

type WorkspaceApiRole = 'CHEFF' | 'GROWN' | 'DESIGNER';

const WORKSPACE_SECTIONS: Array<{
  sellerRole: ProfileV2SellerRole;
  userType: WorkspaceApiRole;
  titleKey: string;
  descriptionKey: string;
}> = [
  {
    sellerRole: 'chef',
    userType: 'CHEFF',
    titleKey: 'profileV2.vertrouwen.sections.kitchen.title',
    descriptionKey: 'profilePage.workspaceDescriptions.kitchen',
  },
  {
    sellerRole: 'garden',
    userType: 'GROWN',
    titleKey: 'profileV2.vertrouwen.sections.garden.title',
    descriptionKey: 'profilePage.workspaceDescriptions.garden',
  },
  {
    sellerRole: 'designer',
    userType: 'DESIGNER',
    titleKey: 'profileV2.vertrouwen.sections.studio.title',
    descriptionKey: 'profilePage.workspaceDescriptions.studio',
  },
];

function TrustSectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <ProfileV2SectionCard>
      <h3 className="text-lg font-bold tracking-tight text-gray-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      <div className="mt-4 min-w-0">{children}</div>
    </ProfileV2SectionCard>
  );
}

const TRANSPORT_LABELS: Record<string, string> = {
  BIKE: '🚴 Fiets',
  EBIKE: '🚴 E-Bike',
  SCOOTER: '🛵 Scooter',
  CAR: '🚗 Auto',
};

function normalizeVehiclePhotos(raw: unknown): ProfileV2VehiclePhoto[] {
  if (!Array.isArray(raw)) return [];
  const out: ProfileV2VehiclePhoto[] = [];
  for (const item of raw) {
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? '');
    const fileUrl = String(row.fileUrl ?? row.url ?? '');
    if (!id || !fileUrl) continue;
    out.push({
      id,
      fileUrl,
      sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : undefined,
    });
  }
  return out;
}

function ProfileV2DeliveryTrustSection({ ctx }: { ctx: ProfileV2Context }) {
  const { t } = useTranslation();
  const dp = ctx.user.DeliveryProfile;
  if (!dp) return null;

  return (
    <TrustSectionCard
      title={t('profileV2.vertrouwen.sections.delivery.title')}
      description={t('profileV2.vertrouwen.sections.delivery.description')}
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-gray-700">
          {dp.bio?.trim() || ctx.user.bio?.trim() || t('profileV2.vertrouwen.sections.delivery.defaultBio')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Truck className="h-4 w-4 text-blue-600" aria-hidden />
              {t('profileV2.vertrouwen.sections.delivery.transport')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(dp.transportation ?? []).map((mode) => (
                <span
                  key={mode}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-800"
                >
                  {TRANSPORT_LABELS[mode] ?? mode}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-emerald-600" aria-hidden />
              {t('profileV2.vertrouwen.sections.delivery.availability')}
            </h4>
            <div className="space-y-1 text-sm text-gray-700">
              {(dp.availableDays ?? []).length > 0 ? (
                <p>
                  <span className="font-medium">{t('profileV2.vertrouwen.sections.delivery.days')}:</span>{' '}
                  {(dp.availableDays ?? []).join(', ')}
                </p>
              ) : null}
              {(dp.availableTimeSlots ?? []).length > 0 ? (
                <p>
                  <span className="font-medium">{t('profileV2.vertrouwen.sections.delivery.times')}:</span>{' '}
                  {(dp.availableTimeSlots ?? []).join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {t('profileV2.vertrouwen.sections.delivery.maxDistance', { km: dp.maxDistance ?? 0 })}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1">
            {t('profileV2.vertrouwen.sections.delivery.deliveries', {
              count: dp.totalDeliveries ?? 0,
            })}
          </span>
          {dp.isVerified ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
              {t('profileV2.vertrouwen.sections.delivery.verified')}
            </span>
          ) : null}
        </div>
      </div>
    </TrustSectionCard>
  );
}

export function ProfileV2TrustPhotoSections({ ctx }: { ctx: ProfileV2Context }) {
  const { t } = useTranslation();
  const { viewerIsOwner, user } = ctx;
  const sellerRoles = user.sellerRoles ?? [];
  const activeSections = WORKSPACE_SECTIONS.filter((s) =>
    sellerRoles.includes(s.sellerRole),
  );
  const hasDelivery = Boolean(user.DeliveryProfile);
  const vehiclePhotos = normalizeVehiclePhotos(user.DeliveryProfile?.vehiclePhotos);

  if (activeSections.length === 0 && !hasDelivery) {
    return (
      <ProfileV2EmptyState
        title={t('profileV2.vertrouwen.title')}
        description={
          viewerIsOwner
            ? t('profileV2.vertrouwen.emptyOwner')
            : t('profileV2.vertrouwen.emptyPublic')
        }
        actionLabel={viewerIsOwner ? t('profileV2.actions.editProfile') : undefined}
        actionHref={viewerIsOwner ? '/settings' : undefined}
        icon={<MapPin className="h-8 w-8" aria-hidden />}
      />
    );
  }

  return (
    <div className="space-y-8">
      {activeSections.length > 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="hc-section-title">{t('profileV2.vertrouwen.sections.workspaceGroup.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('profileV2.vertrouwen.sections.workspaceGroup.description')}
            </p>
          </div>

          {activeSections.map((section) => (
            <TrustSectionCard
              key={section.sellerRole}
              title={t(section.titleKey)}
              description={t(section.descriptionKey)}
            >
              <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-gray-100" />}>
                {viewerIsOwner ? (
                  <WorkspacePhotoUpload maxPhotos={10} userType={section.userType} />
                ) : (
                  <WorkspacePhotosDisplay
                    userId={user.id}
                    userRoles={[section.userType]}
                    hideGroupTitle
                    compactSection
                    className="!space-y-4"
                  />
                )}
              </Suspense>
            </TrustSectionCard>
          ))}
        </div>
      ) : null}

      {hasDelivery ? (
        <>
          <ProfileV2DeliveryTrustSection ctx={ctx} />
          <TrustSectionCard
            title={t('profileV2.vertrouwen.sections.vehicle.title')}
            description={t('profileV2.vertrouwen.sections.vehicle.description')}
          >
            {viewerIsOwner ? (
              <ProfileV2VehiclePhotos mode="owner" initialPhotos={vehiclePhotos} />
            ) : (
              <ProfileV2VehiclePhotos mode="public" photos={vehiclePhotos} />
            )}
          </TrustSectionCard>
        </>
      ) : null}
    </div>
  );
}

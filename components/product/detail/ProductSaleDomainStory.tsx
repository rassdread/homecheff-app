'use client';

import {
  ChefHat,
  Clock,
  Sprout,
  Palette,
  MapPin,
  Leaf,
  Ruler,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ProductSaleCollapsibleSection from '@/components/product/detail/ProductSaleCollapsibleSection';
import ProductInspirationLinkCard, {
  type ProductInspirationLink,
} from '@/components/product/detail/ProductInspirationLinkCard';
import SmartFitMediaImage from '@/components/inspiratie/SmartFitMediaImage';

type StepPhoto = {
  id: string;
  url: string;
  stepNumber: number;
  description?: string | null;
};

type GrowthPhoto = {
  id: string;
  url: string;
  phaseNumber: number;
  description?: string | null;
};

export type ProductSaleDishInfo = {
  isDish: boolean;
  category?: string | null;
  ingredients?: string[];
  instructions?: string[];
  stepPhotos?: StepPhoto[];
  growthPhotos?: GrowthPhoto[];
  materials?: string[];
  plantType?: string | null;
  sunlight?: string | null;
  waterNeeds?: string | null;
  harvestDate?: string | null;
  location?: string | null;
  soilType?: string | null;
  growthDuration?: number | null;
  dimensions?: string | null;
  notes?: string | null;
  difficulty?: string | null;
  prepTime?: number | null;
  servings?: number | null;
  tags?: string[];
};

type Props = {
  dishInfo: ProductSaleDishInfo;
  inspirationLink?: ProductInspirationLink | null;
};

const GROWTH_PHASE_NAMES = [
  '🌱 Zaaien/Planten',
  '🌿 Kiemen',
  '🌾 Groeien',
  '🌺 Bloeien',
  '🍅 Oogsten',
];

const GROW_LOCATION_LABELS: Record<string, string> = {
  INDOOR: '🏠 Binnen',
  OUTDOOR: '🌳 Buiten',
  GREENHOUSE: '🏡 Serre',
  BALCONY: '🪴 Balkon',
};

function formatGrowLocation(value?: string | null) {
  if (!value) return null;
  return GROW_LOCATION_LABELS[value] || value;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 text-right">{value}</dd>
    </div>
  );
}

export default function ProductSaleDomainStory({ dishInfo, inspirationLink }: Props) {
  const { t } = useTranslation();

  if (!dishInfo.isDish && !inspirationLink) return null;

  const hasGardenMeta =
    dishInfo.category === 'GROWN' &&
    Boolean(
      dishInfo.plantType ||
        dishInfo.sunlight ||
        dishInfo.waterNeeds ||
        dishInfo.harvestDate ||
        dishInfo.location ||
        dishInfo.soilType ||
        dishInfo.growthDuration ||
        dishInfo.difficulty,
    );

  const hasDesignerMeta =
    dishInfo.category === 'DESIGNER' &&
    Boolean(dishInfo.dimensions || dishInfo.notes?.trim());

  return (
    <div className="space-y-4">
      {inspirationLink ? <ProductInspirationLinkCard link={inspirationLink} /> : null}

      {!dishInfo.isDish ? null : (
        <>
      {hasGardenMeta ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.growingInfo')}
          icon={<Leaf className="h-5 w-5 text-emerald-600" aria-hidden />}
          defaultOpen
        >
          <dl className="space-y-2">
            {dishInfo.plantType ? (
              <MetaRow label={t('inspiratie.detail.plantType')} value={dishInfo.plantType} />
            ) : null}
            {dishInfo.sunlight ? (
              <MetaRow label={t('inspiratie.detail.sunlight')} value={dishInfo.sunlight} />
            ) : null}
            {dishInfo.waterNeeds ? (
              <MetaRow label={t('inspiratie.detail.waterNeeds')} value={dishInfo.waterNeeds} />
            ) : null}
            {dishInfo.harvestDate ? (
              <MetaRow label={t('inspiratie.detail.harvest')} value={dishInfo.harvestDate} />
            ) : null}
            {dishInfo.location ? (
              <MetaRow
                label={t('inspiratie.detail.growLocation')}
                value={formatGrowLocation(dishInfo.location) ?? dishInfo.location}
              />
            ) : null}
            {dishInfo.soilType ? (
              <MetaRow label={t('inspiratie.detail.soilType')} value={dishInfo.soilType} />
            ) : null}
            {dishInfo.growthDuration ? (
              <MetaRow
                label={t('inspiratie.detail.growth')}
                value={`${dishInfo.growthDuration} ${t('inspiratie.detail.days')}`}
              />
            ) : null}
            {dishInfo.difficulty ? (
              <MetaRow label={t('inspiratie.detail.difficulty')} value={dishInfo.difficulty} />
            ) : null}
          </dl>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'CHEFF' && (dishInfo.prepTime || dishInfo.servings || dishInfo.difficulty) ? (
        <div className="flex flex-wrap gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-gray-700">
          {dishInfo.prepTime ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-600" />
              {dishInfo.prepTime} min
            </span>
          ) : null}
          {dishInfo.servings ? (
            <span>
              {dishInfo.servings} {t('inspiratie.detail.portions')}
            </span>
          ) : null}
          {dishInfo.difficulty ? (
            <span>
              {t('inspiratie.detail.difficulty')}: {dishInfo.difficulty}
            </span>
          ) : null}
        </div>
      ) : null}

      {dishInfo.category === 'CHEFF' && (dishInfo.ingredients?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.ingredients')}
          icon={<ChefHat className="h-5 w-5 text-orange-600" aria-hidden />}
        >
          <ul className="space-y-2">
            {dishInfo.ingredients!.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                {ingredient}
              </li>
            ))}
          </ul>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'CHEFF' && (dishInfo.instructions?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.instructions')}
          icon={<Clock className="h-5 w-5 text-orange-600" aria-hidden />}
        >
          <div className="space-y-4">
            {dishInfo.instructions!.map((instruction, index) => {
              const stepNumber = index + 1;
              const stepPhotos =
                dishInfo.stepPhotos?.filter((p) => p.stepNumber === stepNumber) ?? [];
              return (
                <div key={index} className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                  <p className="mb-2 flex gap-2 text-sm text-gray-800">
                    <span className="font-bold text-orange-700">{stepNumber}.</span>
                    {instruction}
                  </p>
                  {stepPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {stepPhotos.map((photo) => (
                        <SmartFitMediaImage
                          key={photo.id}
                          src={photo.url}
                          alt={`Stap ${stepNumber}`}
                          mode="product-story-step"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'GROWN' && (dishInfo.growthPhotos?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.instructions.carePlan')}
          icon={<Sprout className="h-5 w-5 text-emerald-600" aria-hidden />}
        >
          <div className="space-y-4">
            {Array.from(
              new Set((dishInfo.growthPhotos ?? []).map((p) => Number(p.phaseNumber))),
            )
              .filter((p) => !Number.isNaN(p))
              .sort((a, b) => a - b)
              .map((phaseNumber) => {
                const phasePhotos =
                  dishInfo.growthPhotos?.filter(
                    (p) => Number(p.phaseNumber) === phaseNumber,
                  ) ?? [];
                if (phasePhotos.length === 0) return null;
                const phaseName =
                  GROWTH_PHASE_NAMES[phaseNumber] || `Fase ${phaseNumber + 1}`;
                return (
                  <div key={phaseNumber} className="space-y-2">
                    <h4 className="text-sm font-bold text-emerald-900">{phaseName}</h4>
                    {phasePhotos[0]?.description ? (
                      <p className="text-sm text-gray-700">{phasePhotos[0].description}</p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      {phasePhotos.map((photo) => (
                        <SmartFitMediaImage
                          key={photo.id}
                          src={photo.url}
                          alt={phaseName}
                          mode="product-story-step"
                          wrapperClassName="border border-emerald-200"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'GROWN' && dishInfo.notes?.trim() ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.notes')}
          icon={<MapPin className="h-5 w-5 text-emerald-600" aria-hidden />}
        >
          <p className="text-sm leading-relaxed text-gray-700">{dishInfo.notes}</p>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'DESIGNER' && (dishInfo.materials?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.materials')}
          icon={<Palette className="h-5 w-5 text-purple-600" aria-hidden />}
        >
          <ul className="space-y-2">
            {dishInfo.materials!.map((material, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                {material}
              </li>
            ))}
          </ul>
        </ProductSaleCollapsibleSection>
      ) : null}

      {hasDesignerMeta ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.detail.specifications')}
          icon={<Ruler className="h-5 w-5 text-purple-600" aria-hidden />}
          defaultOpen
        >
          <dl className="space-y-2">
            {dishInfo.dimensions ? (
              <MetaRow label={t('inspiratie.detail.dimensions')} value={dishInfo.dimensions} />
            ) : null}
          </dl>
          {dishInfo.notes?.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-700">{dishInfo.notes}</p>
          ) : null}
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'DESIGNER' && (dishInfo.instructions?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title={t('inspiratie.instructions.workDescription')}
          icon={<Palette className="h-5 w-5 text-purple-600" aria-hidden />}
        >
          <ol className="space-y-3">
            {dishInfo.instructions!.map((step, index) => (
              <li key={index} className="flex gap-2 text-sm text-gray-700">
                <span className="font-bold text-purple-700">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </ProductSaleCollapsibleSection>
      ) : null}
        </>
      )}
    </div>
  );
}

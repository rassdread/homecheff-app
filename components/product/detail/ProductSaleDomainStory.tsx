'use client';

import Image from 'next/image';
import { ChefHat, Clock, Sprout, Palette } from 'lucide-react';
import ProductSaleCollapsibleSection from '@/components/product/detail/ProductSaleCollapsibleSection';

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

type Props = {
  dishInfo: {
    isDish: boolean;
    category?: string | null;
    ingredients?: string[];
    instructions?: string[];
    stepPhotos?: StepPhoto[];
    growthPhotos?: GrowthPhoto[];
    materials?: string[];
  };
};

const GROWTH_PHASE_NAMES = [
  '🌱 Zaaien/Planten',
  '🌿 Kiemen',
  '🌾 Groeien',
  '🌺 Bloeien',
  '🍅 Oogsten',
];

export default function ProductSaleDomainStory({ dishInfo }: Props) {
  if (!dishInfo.isDish) return null;

  return (
    <div className="space-y-4">
      {dishInfo.category === 'CHEFF' && (dishInfo.ingredients?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title="Ingrediënten"
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
          title="Bereidingswijze"
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
                        <div
                          key={photo.id}
                          className="relative h-28 overflow-hidden rounded-lg border border-orange-200"
                        >
                          <Image
                            src={photo.url}
                            alt={`Stap ${stepNumber}`}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        </div>
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
          title="Groeifases"
          icon={<Sprout className="h-5 w-5 text-emerald-600" aria-hidden />}
        >
          <div className="space-y-4">
            {Array.from(
              new Set(
                (dishInfo.growthPhotos ?? []).map((p) => Number(p.phaseNumber)),
              ),
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
                        <div
                          key={photo.id}
                          className="relative aspect-video overflow-hidden rounded-lg border border-emerald-200"
                        >
                          <Image
                            src={photo.url}
                            alt={phaseName}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </ProductSaleCollapsibleSection>
      ) : null}

      {dishInfo.category === 'DESIGNER' && (dishInfo.materials?.length ?? 0) > 0 ? (
        <ProductSaleCollapsibleSection
          title="Materialen"
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
    </div>
  );
}

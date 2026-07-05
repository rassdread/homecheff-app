'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import InspirationFitImage from '@/components/inspiratie/InspirationFitImage';
import { ChefHat, Palette, Printer, Sprout } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getDisplayName } from '@/lib/displayName';
import {
  buildInstructionContent,
  INSTRUCTION_STEPS_LABEL_KEY,
  INSTRUCTION_SUPPLIES_LABEL_KEY,
  INSTRUCTION_TYPE_LABEL_KEY,
  type InspirationCategory,
  type InstructionMeta,
} from '@/lib/inspiratie/instruction-content';

export type InspiratiePrintItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: InspirationCategory;
  subcategory?: string | null;
  tags: string[];
  createdAt: string;
  ingredients: string[];
  instructions: string[];
  materials: string[];
  stepPhotos: Array<{
    id: string;
    url: string;
    stepNumber: number;
    description?: string | null;
  }>;
  growthPhotos: Array<{
    id: string;
    url: string;
    phaseNumber: number;
    description?: string | null;
  }>;
  photos: Array<{ id: string; url: string; isMain?: boolean }>;
  notes?: string | null;
  prepTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  plantType?: string | null;
  sunlight?: string | null;
  waterNeeds?: string | null;
  soilType?: string | null;
  growthDuration?: number | null;
  harvestDate?: string | null;
  plantDate?: string | null;
  plantDistance?: string | null;
  dimensions?: string | null;
  location?: string | null;
  user: {
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
};

type Props = {
  item: InspiratiePrintItem;
  canonicalUrl: string;
  autoPrint?: boolean;
};

const GROW_LOCATION_LABELS: Record<string, string> = {
  INDOOR: '🏠 Binnen',
  OUTDOOR: '🌳 Buiten',
  GREENHOUSE: '🏡 Serre',
  BALCONY: '🪴 Balkon',
};

export default function InspiratiePrintView({ item, canonicalUrl, autoPrint = false }: Props) {
  const { t, language } = useTranslation();

  const meta: InstructionMeta = {
    prepTime: item.prepTime,
    servings: item.servings,
    difficulty: item.difficulty,
    subcategory: item.subcategory,
    location: item.location,
    plantType: item.plantType,
    sunlight: item.sunlight,
    waterNeeds: item.waterNeeds,
    soilType: item.soilType,
    growthDuration: item.growthDuration,
    harvestDate: item.harvestDate,
    plantDate: item.plantDate,
    plantDistance: item.plantDistance,
    dimensions: item.dimensions,
  };

  const { steps, supplies } = buildInstructionContent({
    category: item.category,
    instructions: item.instructions,
    ingredients: item.ingredients,
    materials: item.materials,
    stepPhotos: item.stepPhotos,
    growthPhotos: item.growthPhotos,
    notes: item.notes,
    meta,
  });

  const mainPhoto = item.photos.find((p) => p.isMain) ?? item.photos[0];
  const makerName = getDisplayName(item.user);

  const dateStr = (() => {
    try {
      return new Intl.DateTimeFormat(language === 'nl' ? 'nl-NL' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(item.createdAt));
    } catch {
      return item.createdAt;
    }
  })();

  const CategoryIcon =
    item.category === 'CHEFF' ? ChefHat : item.category === 'GROWN' ? Sprout : Palette;

  const notesUsedAsSteps =
    item.category === 'DESIGNER' &&
    item.instructions.filter((s) => s.trim()).length === 0 &&
    steps.length > 0 &&
    Boolean(item.notes?.trim());

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const absoluteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${canonicalUrl}`
      : canonicalUrl;

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          nav,
          header:not(#inspiratie-print-root header),
          footer:not(#inspiratie-print-root footer),
          [data-bottom-nav],
          [data-navbar] {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #inspiratie-print-root,
          #inspiratie-print-root * {
            visibility: visible;
          }
          #inspiratie-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-step-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href={canonicalUrl}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← {t('buttons.back')}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" />
            {t('inspiratie.instructions.printOrSavePdf')}
          </button>
        </div>
      </div>

      <div
        id="inspiratie-print-root"
        className="mx-auto max-w-3xl bg-white px-4 py-8 text-gray-900 sm:px-8"
      >
        <header className="border-b-2 border-emerald-600 pb-6 print-avoid-break">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 shrink-0">
              <Image src="/icon-192.png" alt="HomeCheff" fill className="object-contain" sizes="32px" />
            </div>
            <span className="text-xl font-bold text-emerald-700">HomeCheff</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {t(INSTRUCTION_TYPE_LABEL_KEY[item.category])}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {item.title || t('inspiratie.instructions.untitled')}
          </h1>
          {item.description ? (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>
              {t('inspiratie.detail.maker')}:{' '}
              <strong className="text-gray-900">{makerName}</strong>
            </span>
            <span>
              {t('inspiratie.detail.published')}: {dateStr}
            </span>
            {item.subcategory ? <span>{item.subcategory}</span> : null}
          </div>
        </header>

        {mainPhoto ? (
          <InspirationFitImage
            src={mainPhoto.url}
            context="print-hero"
            containerClassName="print-avoid-break"
          />
        ) : null}

        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm print-avoid-break">
          {item.category === 'CHEFF' ? (
            <>
              {item.prepTime ? (
                <span>
                  {t('inspiratie.instructions.prepTime')}: <strong>{item.prepTime} min</strong>
                </span>
              ) : null}
              {item.servings ? (
                <span>
                  {t('inspiratie.instructions.servings')}: <strong>{item.servings}</strong>
                </span>
              ) : null}
              {item.difficulty ? (
                <span>
                  {t('inspiratie.detail.difficulty')}: <strong>{item.difficulty}</strong>
                </span>
              ) : null}
            </>
          ) : null}
          {item.category === 'GROWN' ? (
            <>
              {item.plantType ? (
                <span>
                  {t('inspiratie.detail.plantType')}: <strong>{item.plantType}</strong>
                </span>
              ) : null}
              {item.sunlight ? (
                <span>
                  {t('inspiratie.detail.sunlight')}: <strong>{item.sunlight}</strong>
                </span>
              ) : null}
              {item.waterNeeds ? (
                <span>
                  {t('inspiratie.detail.waterNeeds')}: <strong>{item.waterNeeds}</strong>
                </span>
              ) : null}
              {item.harvestDate ? (
                <span>
                  {t('inspiratie.detail.harvest')}: <strong>{item.harvestDate}</strong>
                </span>
              ) : null}
              {item.location ? (
                <span>
                  {t('inspiratie.detail.growLocation')}:{' '}
                  <strong>{GROW_LOCATION_LABELS[item.location] || item.location}</strong>
                </span>
              ) : null}
            </>
          ) : null}
          {item.category === 'DESIGNER' ? (
            <>
              {supplies.length > 0 ? (
                <span>
                  {t('inspiratie.instructions.materials')}:{' '}
                  <strong>
                    {supplies.length} {t('inspiratie.instructions.materialItems')}
                  </strong>
                </span>
              ) : null}
              {item.dimensions ? (
                <span>
                  {t('inspiratie.detail.dimensions')}: <strong>{item.dimensions}</strong>
                </span>
              ) : null}
              {item.difficulty ? (
                <span>
                  {t('inspiratie.detail.difficulty')}: <strong>{item.difficulty}</strong>
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        {supplies.length > 0 ? (
          <section className="mb-8 print-avoid-break">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
              <CategoryIcon className="h-5 w-5" />
              {t(INSTRUCTION_SUPPLIES_LABEL_KEY[item.category])}
            </h2>
            <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
              {supplies.map((s, i) => (
                <li key={`${s}-${i}`} className="flex gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {steps.length > 0 ? (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-emerald-800">
              {t(INSTRUCTION_STEPS_LABEL_KEY[item.category])}
            </h2>
            <ol className="mt-4 space-y-5">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="print-avoid-break rounded-lg border border-gray-200 p-4"
                >
                  <div className="print-step-row flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                        {step.number}
                      </span>
                      <p className="flex-1 text-sm leading-relaxed text-gray-800">{step.text}</p>
                    </div>
                    {step.photos[0] ? (
                      <InspirationFitImage
                        src={step.photos[0].url}
                        context="print-step"
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {item.notes?.trim() && !notesUsedAsSteps ? (
          <section className="mb-8 rounded-lg border border-emerald-100 bg-emerald-50 p-4 print-avoid-break">
            <h3 className="text-sm font-semibold text-emerald-800">
              {item.category === 'DESIGNER'
                ? t('inspiratie.instructions.workDescription')
                : t('inspiratie.instructions.chefTip')}
            </h3>
            <p className="mt-1 text-sm text-emerald-900">{item.notes}</p>
          </section>
        ) : null}

        <footer className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-500 print-avoid-break">
          <p className="font-semibold text-emerald-700">HomeCheff</p>
          <p className="mt-1 break-all text-gray-600">{absoluteUrl}</p>
          <p className="mt-2">{t('inspiratie.instructions.printDisclaimer')}</p>
          <p className="mt-2 text-gray-400">
            {t('inspiratie.instructions.madeVia', { maker: makerName })}
          </p>
        </footer>
      </div>
    </>
  );
}

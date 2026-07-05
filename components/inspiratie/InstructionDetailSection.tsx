'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ChefHat,
  Clock,
  ExternalLink,
  Leaf,
  Palette,
  Printer,
  Sparkles,
  Sprout,
  Sun,
  Droplet,
  Users,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';
import InspirationFitImage from '@/components/inspiratie/InspirationFitImage';
import { useTranslation } from '@/hooks/useTranslation';
import {
  EXTRA_MEDIA_LABEL_KEY,
  INSTRUCTION_STEPS_LABEL_KEY,
  INSTRUCTION_SUPPLIES_LABEL_KEY,
  INSTRUCTION_TYPE_LABEL_KEY,
  type InspirationCategory,
  type InstructionStep,
  type ExtraMediaItem,
  type InstructionMeta,
} from '@/lib/inspiratie/instruction-content';
import type { InstructionDownloadState } from '@/lib/inspiratie/instruction-download';

type Props = {
  category: InspirationCategory;
  steps: InstructionStep[];
  supplies: string[];
  extraMedia: ExtraMediaItem[];
  meta: InstructionMeta;
  notes?: string | null;
  tags?: string[];
  downloadState: InstructionDownloadState;
  onPhotoClick: (mediaId: string) => void;
  makerUsername?: string | null;
  /** When designer notes were split into steps, hide duplicate notes block. */
  hideNotes?: boolean;
};

const CATEGORY_ACCENT: Record<InspirationCategory, string> = {
  CHEFF: 'text-orange-600',
  GROWN: 'text-emerald-600',
  DESIGNER: 'text-purple-600',
};

const CATEGORY_RING: Record<InspirationCategory, string> = {
  CHEFF: 'ring-orange-200 bg-orange-50',
  GROWN: 'ring-emerald-200 bg-emerald-50',
  DESIGNER: 'ring-purple-200 bg-purple-50',
};

const CATEGORY_BORDER: Record<InspirationCategory, string> = {
  CHEFF: 'border-orange-100',
  GROWN: 'border-emerald-100',
  DESIGNER: 'border-purple-100',
};

function formatMinutes(minutes?: number | null, t?: (k: string) => string) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins
    ? `${hrs} ${t?.('inspiratie.instructions.hours') ?? 'uur'} ${mins} min`
    : `${hrs} ${t?.('inspiratie.instructions.hours') ?? 'uur'}`;
}

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

function InstructionMetaPanel({
  category,
  meta,
  suppliesCount,
}: {
  category: InspirationCategory;
  meta: InstructionMeta;
  suppliesCount: number;
}) {
  const { t } = useTranslation();

  if (category === 'CHEFF') {
    const items = [
      meta.prepTime
        ? { label: t('inspiratie.instructions.prepTime'), value: formatMinutes(meta.prepTime, t) }
        : null,
      meta.servings
        ? {
            label: t('inspiratie.instructions.servings'),
            value: `${meta.servings} ${t('inspiratie.detail.portions')}`,
          }
        : null,
      meta.difficulty
        ? { label: t('inspiratie.detail.difficulty'), value: meta.difficulty }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string | null }>;

    if (items.length === 0) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-orange-700/80">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }

  if (category === 'GROWN') {
    const items = [
      meta.plantType
        ? { label: t('inspiratie.detail.plantType'), value: meta.plantType }
        : null,
      meta.sunlight ? { label: t('inspiratie.detail.sunlight'), value: meta.sunlight } : null,
      meta.waterNeeds
        ? { label: t('inspiratie.detail.waterNeeds'), value: meta.waterNeeds }
        : null,
      meta.harvestDate ? { label: t('inspiratie.detail.harvest'), value: meta.harvestDate } : null,
      meta.location
        ? { label: t('inspiratie.detail.growLocation'), value: formatGrowLocation(meta.location) }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string | null }>;

    if (items.length === 0) return null;

    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-emerald-800">
          {t('inspiratie.instructions.careSection')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = [
    suppliesCount > 0
      ? {
          label: t('inspiratie.instructions.materials'),
          value: `${suppliesCount} ${t('inspiratie.instructions.materialItems')}`,
        }
      : null,
    meta.dimensions ? { label: t('inspiratie.detail.dimensions'), value: meta.dimensions } : null,
    meta.difficulty ? { label: t('inspiratie.detail.difficulty'), value: meta.difficulty } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | null }>;

  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-purple-700/80">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function StepCard({
  step,
  ring,
  accent,
  onPhotoClick,
}: {
  step: InstructionStep;
  ring: string;
  accent: string;
  onPhotoClick: (mediaId: string) => void;
}) {
  const primaryPhoto = step.photos[0];

  return (
    <li className="print-avoid-break rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2',
              ring,
              accent,
            )}
          >
            {step.number}
          </div>
          <div className="min-w-0 flex-1">
            {step.title ? <p className="font-semibold text-gray-900">{step.title}</p> : null}
            {step.text ? (
              <p className="mt-1 text-sm leading-relaxed text-gray-700 sm:text-[15px]">
                {step.text}
              </p>
            ) : null}
            {step.photos.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                {step.photos.slice(1).map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => onPhotoClick(photo.id)}
                    className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 touch-manipulation"
                  >
                    <Image src={photo.url} alt="" fill className="hc-inspiration-media-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {primaryPhoto ? (
          <InspirationFitImage
            src={primaryPhoto.url}
            context="step"
            onClick={() => onPhotoClick(primaryPhoto.id)}
            containerClassName="rounded-xl border border-gray-200"
          />
        ) : null}
      </div>

      {step.photos.length > 1 ? (
        <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
          {step.photos.slice(1).map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onPhotoClick(photo.id)}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 touch-manipulation"
            >
              <Image src={photo.url} alt="" fill className="hc-inspiration-media-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function InstructionDetailSection({
  category,
  steps,
  supplies,
  extraMedia,
  meta,
  notes,
  tags,
  downloadState,
  onPhotoClick,
  makerUsername,
  hideNotes = false,
}: Props) {
  const { t } = useTranslation();
  const accent = CATEGORY_ACCENT[category];
  const ring = CATEGORY_RING[category];
  const border = CATEGORY_BORDER[category];

  const SupplyIcon = category === 'CHEFF' ? ChefHat : category === 'GROWN' ? Sprout : Palette;
  const TypeIcon = SupplyIcon;

  const handlePrintOrSave = () => {
    window.open(downloadState.printUrl, '_blank', 'noopener,noreferrer');
  };

  const showNotesTip = Boolean(notes?.trim()) && !hideNotes;

  if (steps.length === 0 && supplies.length === 0 && extraMedia.length === 0) {
    return null;
  }

  return (
    <section
      className={clsx(
        'rounded-3xl border bg-white p-5 shadow-sm sm:p-6 lg:p-8',
        border,
      )}
      aria-labelledby="instruction-section-title"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={clsx('inline-flex items-center gap-2 text-sm font-semibold', accent)}>
            <TypeIcon className="h-4 w-4" aria-hidden />
            {t(INSTRUCTION_TYPE_LABEL_KEY[category])}
          </p>
          <h2 id="instruction-section-title" className="mt-1 text-2xl font-bold text-gray-900">
            {t('inspiratie.instructions.sectionTitle')}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={handlePrintOrSave}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 touch-manipulation"
          >
            <Printer className="h-4 w-4" />
            {t('inspiratie.instructions.printOrSavePdf')}
          </button>
          <p className="max-w-xs text-xs text-gray-500 sm:text-right">
            {t('inspiratie.instructions.printDownloadHint')}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-6">
          <InstructionMetaPanel category={category} meta={meta} suppliesCount={supplies.length} />

          {(meta.prepTime || meta.servings || meta.difficulty || tags?.length) &&
          category === 'CHEFF' ? (
            <div className="flex flex-wrap gap-3 lg:hidden">
              {meta.prepTime ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  {formatMinutes(meta.prepTime, t)}
                </span>
              ) : null}
              {meta.servings ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {meta.servings} {t('inspiratie.detail.portions')}
                </span>
              ) : null}
              {meta.difficulty ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  {meta.difficulty}
                </span>
              ) : null}
            </div>
          ) : null}

          {supplies.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
              <h3 className={clsx('flex items-center gap-2 text-lg font-semibold text-gray-900', accent)}>
                <SupplyIcon className="h-5 w-5" />
                {t(INSTRUCTION_SUPPLIES_LABEL_KEY[category])}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {supplies.map((item, i) => (
                  <li key={`${item}-${i}`} className="flex gap-2">
                    <span
                      className={clsx(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        accent.replace('text-', 'bg-'),
                      )}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {steps.length > 0 ? (
            <div>
              <h3 className={clsx('flex items-center gap-2 text-lg font-semibold text-gray-900', accent)}>
                <Sparkles className="h-5 w-5 text-emerald-600" />
                {t(INSTRUCTION_STEPS_LABEL_KEY[category])}
              </h3>
              <ol className="mt-4 space-y-4">
                {steps.map((step) => (
                  <StepCard
                    key={step.number}
                    step={step}
                    ring={ring}
                    accent={accent}
                    onPhotoClick={onPhotoClick}
                  />
                ))}
              </ol>
            </div>
          ) : null}

          {showNotesTip && notes?.trim() ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <ChefHat className="h-4 w-4" />
                {category === 'DESIGNER'
                  ? t('inspiratie.instructions.workDescription')
                  : t('inspiratie.instructions.chefTip')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">{notes}</p>
            </div>
          ) : null}

          {extraMedia.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                {t(EXTRA_MEDIA_LABEL_KEY[category])}
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {extraMedia.map((media) => (
                  <div
                    key={media.id}
                    className="group overflow-hidden rounded-xl border border-gray-100 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <InspirationFitImage
                      src={media.url}
                      context="extra"
                      onClick={() => onPhotoClick(media.id)}
                    />
                    {media.caption ? (
                      <p className="p-3 text-sm text-gray-600">{media.caption}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t('inspiratie.instructions.atGlance')}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {meta.prepTime && category === 'CHEFF' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.instructions.prepTime')}</dt>
                  <dd className="font-medium text-emerald-700">{formatMinutes(meta.prepTime, t)}</dd>
                </div>
              ) : null}
              {meta.servings && category === 'CHEFF' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.instructions.servings')}</dt>
                  <dd className="font-medium text-emerald-700">
                    {meta.servings} {t('inspiratie.detail.portions')}
                  </dd>
                </div>
              ) : null}
              {meta.difficulty ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.detail.difficulty')}</dt>
                  <dd className="font-medium text-emerald-700">{meta.difficulty}</dd>
                </div>
              ) : null}
              {meta.plantType && category === 'GROWN' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">
                    <Leaf className="inline h-3.5 w-3.5" /> {t('inspiratie.detail.plantType')}
                  </dt>
                  <dd className="font-medium text-emerald-700">{meta.plantType}</dd>
                </div>
              ) : null}
              {meta.sunlight && category === 'GROWN' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">
                    <Sun className="inline h-3.5 w-3.5" /> {t('inspiratie.detail.sunlight')}
                  </dt>
                  <dd className="font-medium text-emerald-700">{meta.sunlight}</dd>
                </div>
              ) : null}
              {meta.waterNeeds && category === 'GROWN' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">
                    <Droplet className="inline h-3.5 w-3.5" /> {t('inspiratie.detail.waterNeeds')}
                  </dt>
                  <dd className="font-medium text-emerald-700">{meta.waterNeeds}</dd>
                </div>
              ) : null}
              {meta.harvestDate && category === 'GROWN' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.detail.harvest')}</dt>
                  <dd className="font-medium text-emerald-700">{meta.harvestDate}</dd>
                </div>
              ) : null}
              {meta.location && category === 'GROWN' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">
                    <MapPin className="inline h-3.5 w-3.5" /> {t('inspiratie.detail.growLocation')}
                  </dt>
                  <dd className="font-medium text-emerald-700">{formatGrowLocation(meta.location)}</dd>
                </div>
              ) : null}
              {meta.dimensions && category === 'DESIGNER' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.detail.dimensions')}</dt>
                  <dd className="font-medium text-emerald-700">{meta.dimensions}</dd>
                </div>
              ) : null}
              {supplies.length > 0 && category === 'DESIGNER' ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">{t('inspiratie.instructions.materials')}</dt>
                  <dd className="font-medium text-emerald-700">
                    {supplies.length} {t('inspiratie.instructions.materialItems')}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {makerUsername ? (
            <Link
              href={`/user/${makerUsername}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 touch-manipulation"
            >
              <ExternalLink className="h-4 w-4" />
              {t('inspiratie.instructions.viewAllFromMaker')}
            </Link>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

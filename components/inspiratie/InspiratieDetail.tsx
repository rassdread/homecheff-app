"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Share2,
  Maximize2,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  ChefHat,
  Sprout,
  Palette,
  MapPin,
  Sparkles,
  X,
  Eye,
  Printer,
} from 'lucide-react';
import clsx from 'clsx';
import InspirationFitImage from '@/components/inspiratie/InspirationFitImage';
import {
  getMediaFitMode,
  inspirationMediaClass,
  loadImageAspectRatio,
} from '@/lib/inspiratie/media-fit';
import DishReviewSection from './DishReviewSection';
import ShareButton from '@/components/ui/ShareButton';
import FavoriteButton from '@/components/favorite/FavoriteButton';
import { useTranslation } from '@/hooks/useTranslation';
import { EdgeAwareVideo } from '@/components/ui/EdgeAwareVideo';
import { getDisplayName } from '@/lib/displayName';
import { getVideoUrlWithCors } from '@/lib/videoUtils';
import MakerContactSection from '@/components/profile/MakerContactSection';
import PublicItemOwnerActions from '@/components/items/PublicItemOwnerActions';
import InstructionDetailSection from '@/components/inspiratie/InstructionDetailSection';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import {
  buildHeroMediaItems,
  buildFullLightboxItems,
  buildInstructionContent,
} from '@/lib/inspiratie/instruction-content';
import { buildInstructionDownloadState } from '@/lib/inspiratie/instruction-download';

type InspirationCategory = 'CHEFF' | 'GROWN' | 'DESIGNER';

type MediaItem = {
  id: string;
  url: string;
  kind: 'image' | 'video';
  thumbnail?: string | null;
  title?: string | null;
  isMain?: boolean;
  idx?: number;
};

type StepPhoto = {
  id: string;
  url: string;
  idx: number;
  stepNumber: number;
  description?: string | null;
};

type GrowthPhoto = {
  id: string;
  url: string;
  idx: number;
  phaseNumber: number;
  description?: string | null;
};

export type InspiratieDetailProps = {
  item: {
    id: string;
    title: string | null;
    description: string | null;
    status: string;
    category: InspirationCategory;
    subcategory?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    difficulty?: string | null;
    prepTime?: number | null;
    servings?: number | null;
    ingredients: string[];
    instructions: string[];
    materials: string[];
    dimensions?: string | null;
    notes?: string | null;
    growthDuration?: number | null;
    harvestDate?: string | null;
    location?: string | null;
    plantDate?: string | null;
    plantDistance?: string | null;
    plantType?: string | null;
    soilType?: string | null;
    sunlight?: string | null;
    waterNeeds?: string | null;
    priceCents?: number | null;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
    };
    photos: Array<{
      id: string;
      url: string;
      idx?: number | null;
      isMain?: boolean;
    }>;
    stepPhotos: StepPhoto[];
    growthPhotos: GrowthPhoto[];
    videos: Array<{
      id: string;
      url: string;
      thumbnail?: string | null;
      title?: string | null;
    }>;
    viewCount?: number;
    propsCount?: number;
  };
  publicContactChannels?: PublicContactChannel[];
  isOwner?: boolean;
};

const CATEGORY_LABEL_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'inspiratie.instructions.recipe',
  GROWN: 'inspiratie.instructions.growingGuide',
  DESIGNER: 'inspiratie.instructions.designWork',
};

const CATEGORY_BADGE: Record<InspirationCategory, string> = {
  CHEFF: 'bg-orange-100 text-orange-700 border border-orange-200',
  GROWN: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  DESIGNER: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const CATEGORY_ICON: Record<InspirationCategory, typeof ChefHat> = {
  CHEFF: ChefHat,
  GROWN: Sprout,
  DESIGNER: Palette,
};

const CATEGORY_GRADIENT: Record<InspirationCategory, string> = {
  CHEFF: 'from-orange-50 via-rose-50 to-amber-50',
  GROWN: 'from-emerald-50 via-green-50 to-lime-50',
  DESIGNER: 'from-purple-50 via-pink-50 to-amber-50',
};

const CATEGORY_ACCENT: Record<InspirationCategory, string> = {
  CHEFF: 'text-orange-700',
  GROWN: 'text-emerald-700',
  DESIGNER: 'text-purple-700',
};

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatTime = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return null;
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hrs} uur ${mins} min` : `${hrs} uur`;
};

export default function InspiratieDetail({
  item,
  publicContactChannels = [],
  isOwner = false,
}: InspiratieDetailProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxTouchStartX = useRef<number | null>(null);
  const lightboxTouchStartY = useRef<number | null>(null);
  const lightboxIsSwipe = useRef(false);
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [heroFit, setHeroFit] = useState<'cover' | 'contain'>('contain');

  const categoryIcon = CATEGORY_ICON[item.category];

  const instructionContent = useMemo(
    () =>
      buildInstructionContent({
        category: item.category,
        instructions: item.instructions,
        ingredients: item.ingredients,
        materials: item.materials,
        stepPhotos: item.stepPhotos,
        growthPhotos: item.growthPhotos,
        notes: item.notes,
        meta: {
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
        },
      }),
    [item],
  );

  const notesUsedAsSteps =
    item.category === 'DESIGNER' &&
    item.instructions.filter((s) => s.trim()).length === 0 &&
    instructionContent.steps.length > 0 &&
    Boolean(item.notes?.trim());

  const heroMediaItems = useMemo(
    () => buildHeroMediaItems(item.photos, item.videos),
    [item.photos, item.videos],
  );

  const lightboxItems = useMemo(
    () =>
      buildFullLightboxItems(
        heroMediaItems,
        instructionContent.steps,
        instructionContent.extraMedia,
      ),
    [heroMediaItems, instructionContent.steps, instructionContent.extraMedia],
  );

  const downloadState = useMemo(
    () => buildInstructionDownloadState(item.category, item.id, { isOwner }),
    [item.category, item.id, isOwner],
  );

  const mediaItems = heroMediaItems;

  useEffect(() => {
    if (mediaItems.length > 0) {
      setActiveIndex(0);
    }
  }, [mediaItems.length]);

  const currentMedia = mediaItems[activeIndex];

  useEffect(() => {
    if (currentMedia?.kind !== 'image') {
      setHeroFit('contain');
      return;
    }
    let cancelled = false;
    void loadImageAspectRatio(currentMedia.url).then((ratio) => {
      if (!cancelled) setHeroFit(getMediaFitMode(ratio, 'hero'));
    });
    return () => {
      cancelled = true;
    };
  }, [currentMedia?.url, currentMedia?.kind]);

  // Share functionality is now handled by ShareButton component

  const handleDownload = useCallback(() => {
    window.open(downloadState.printUrl, '_blank', 'noopener,noreferrer');
  }, [downloadState.printUrl]);

  const handleLightboxOpen = (index: number) => {
    if (index >= 0 && index < lightboxItems.length) {
      setLightboxIndex(index);
    }
  };

  const handlePhotoClickById = useCallback(
    (mediaId: string) => {
      const idx = lightboxItems.findIndex((m) => m.id === mediaId);
      if (idx >= 0) handleLightboxOpen(idx);
    },
    [lightboxItems],
  );

  const handleLightboxClose = () => {
    setLightboxIndex(null);
  };

  const handleLightboxPrev = useCallback(() => {
    setLightboxIndex(prev => {
      if (prev === null || lightboxItems.length < 2) {
        return prev;
      }
      return prev === 0 ? lightboxItems.length - 1 : prev - 1;
    });
  }, [lightboxItems.length]);

  const handleLightboxNext = useCallback(() => {
    setLightboxIndex(prev => {
      if (prev === null || lightboxItems.length < 2) {
        return prev;
      }
      return prev === lightboxItems.length - 1 ? 0 : prev + 1;
    });
  }, [lightboxItems.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleLightboxClose();
      if (e.key === 'ArrowLeft') handleLightboxPrev();
      if (e.key === 'ArrowRight') handleLightboxNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, handleLightboxPrev, handleLightboxNext]);

  const handlePrev = () => {
    if (mediaItems.length < 2) return;
    setIsAutoSliding(false); // Pause auto-slide on manual navigation
    setActiveIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    // Resume auto-slide after 10 seconds
    setTimeout(() => setIsAutoSliding(true), 10000);
  };

  const handleNext = () => {
    if (mediaItems.length < 2) return;
    setIsAutoSliding(false); // Pause auto-slide on manual navigation
    setActiveIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    // Resume auto-slide after 10 seconds
    setTimeout(() => setIsAutoSliding(true), 10000);
  };

  // Swipe handlers for lightbox
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    lightboxTouchStartX.current = e.touches[0].clientX;
    lightboxTouchStartY.current = e.touches[0].clientY;
    lightboxIsSwipe.current = false;
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (lightboxTouchStartX.current === null || lightboxTouchStartY.current === null) return;
    
    const diffX = Math.abs(e.touches[0].clientX - lightboxTouchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - lightboxTouchStartY.current);
    
    // Determine if this is a horizontal swipe
    if (diffX > diffY && diffX > 10) {
      lightboxIsSwipe.current = true;
      e.preventDefault(); // Prevent scrolling during swipe
    }
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (lightboxTouchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = lightboxTouchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (lightboxIsSwipe.current && Math.abs(diff) > minSwipeDistance && lightboxItems.length > 1) {
      if (diff > 0) {
        // Swipe left - next
        handleLightboxNext();
      } else {
        // Swipe right - previous
        handleLightboxPrev();
      }
    }

    lightboxTouchStartX.current = null;
    lightboxTouchStartY.current = null;
    lightboxIsSwipe.current = false;
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 max-lg:pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] lg:pb-12" data-inspiratie-page>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        {isOwner ? (
          <PublicItemOwnerActions
            item={{
              ...item,
              priceCents: item.priceCents ?? null,
            }}
            isOwner={isOwner}
          />
        ) : null}
        <div
          className={clsx(
            'relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-xl backdrop-blur',
            'p-6 sm:p-10',
            `bg-gradient-to-br ${CATEGORY_GRADIENT[item.category]}`
          )}
        >
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            {/* Media gallery */}
            <section className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg">
                {currentMedia ? (
                  <div className="group relative aspect-[4/3] w-full cursor-pointer bg-gray-50" onClick={() => handleLightboxOpen(activeIndex)}>
                    {currentMedia.kind === 'image' ? (
                      <>
                        <Image
                          src={currentMedia.url}
                          alt={item.title || 'Inspiratiefoto'}
                          fill
                          className={clsx(
                            inspirationMediaClass(heroFit),
                            'transition-transform duration-300 group-hover:scale-[1.02]',
                          )}
                          sizes="(max-width: 1024px) 100vw, 720px"
                          priority={currentMedia.isMain}
                        />
                      </>
                    ) : (
                      <div className="relative h-full w-full">
                        <EdgeAwareVideo
                          ref={(el) => {
                            if (el) {
                              el.playsInline = true;
                              el.setAttribute('playsinline', '');
                              el.setAttribute('webkit-playsinline', '');
                            }
                          }}
                          src={getVideoUrlWithCors(currentMedia.url)}
                          fallbackSrc={currentMedia.url}
                          poster={currentMedia.thumbnail || undefined}
                          className="h-full w-full rounded-3xl object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center justify-center rounded-full bg-black/30 p-3 text-white backdrop-blur">
                            <PlayCircle className="h-10 w-10" />
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLightboxOpen(activeIndex);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    {mediaItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                          }}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                          }}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
                            <span>{activeIndex + 1}</span>
                            <span className="text-white/70">/</span>
                            <span>{mediaItems.length}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
                    <Sparkles className="h-12 w-12" />
                  </div>
                )}
              </div>

              {mediaItems.length > 1 && (
                <div className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-visible pb-2">
                  {mediaItems.map((media, index) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => {
                        setIsAutoSliding(false); // Pause auto-slide on thumbnail click
                        setActiveIndex(index);
                        // Resume auto-slide after 10 seconds
                        setTimeout(() => setIsAutoSliding(true), 10000);
                      }}
                      className={clsx(
                        'relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition',
                        activeIndex === index
                          ? 'border-emerald-500 shadow-lg scale-105'
                          : 'border-transparent hover:border-emerald-200 opacity-70 hover:opacity-100'
                      )}
                    >
                      {media.kind === 'image' ? (
                        <Image
                          src={media.thumbnail || media.url}
                          alt="thumbnail"
                          fill
                          className="hc-inspiration-media-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/60 text-white">
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      )}
                      {activeIndex === index && (
                        <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Details */}
            <aside className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-lg backdrop-blur border border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    CATEGORY_BADGE[item.category],
                  )}
                >
                  {(() => {
                    const Icon = categoryIcon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {t(CATEGORY_LABEL_KEY[item.category])}
                </span>
                {item.subcategory && (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
                    {item.subcategory}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {t('inspiratie.detail.published')} {formatDate(item.createdAt)}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {item.title || 'Inspiratie-item'}
                </h1>
                {item.description && (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  <Printer className="h-4 w-4" />
                  {t('inspiratie.instructions.printOrSavePdf')}
                </button>
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  title={item.title || 'Inspiratie-item'}
                  description={item.description || 'Bekijk dit inspiratie-item op HomeCheff'}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                />
                <div className="ml-auto flex items-center gap-3">
                  {(item.viewCount ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <Eye className="h-4 w-4" aria-hidden />
                      {item.viewCount}
                    </span>
                  ) : null}
                  <FavoriteButton
                    dishId={item.id}
                    productTitle={item.title || t('common.dish')}
                    size="sm"
                    variant="button"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex flex-wrap items-center gap-6">
                  {item.prepTime && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {formatTime(item.prepTime)}
                    </span>
                  )}
                  {item.servings && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <Users className="h-4 w-4 text-gray-500" />
                      {item.servings} {t('inspiratie.detail.portions')}
                    </span>
                  )}
                  {item.difficulty && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="h-4 w-4 text-gray-500" />
                      {t('inspiratie.detail.difficulty')}: {item.difficulty}
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {item.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow">
                    {item.user.profileImage ? (
                      <Image
                        src={item.user.profileImage}
                        alt={getDisplayName(item.user)}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg font-semibold text-gray-600">
                        {getDisplayName(item.user).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('inspiratie.detail.postedBy')}</p>
                    <p className="text-base font-semibold text-gray-900">
                      {getDisplayName(item.user)}
                    </p>
                    {item.user.username && (
                      <Link
                        href={`/user/${item.user.username}`}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        {t('inspiratie.detail.viewProfile')}
                      </Link>
                    )}
                  </div>
                </div>
                {publicContactChannels.length > 0 ? (
                  <MakerContactSection
                    variant="inspiration"
                    makerId={item.user.id}
                    makerName={getDisplayName(item.user)}
                    channels={publicContactChannels}
                    className="mt-4"
                  />
                ) : null}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {instructionContent.hasInstructionContent ? (
          <InstructionDetailSection
            category={item.category}
            steps={instructionContent.steps}
            supplies={instructionContent.supplies}
            extraMedia={instructionContent.extraMedia}
            meta={{
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
            }}
            notes={item.notes}
            tags={item.tags}
            downloadState={downloadState}
            onPhotoClick={handlePhotoClickById}
            makerUsername={item.user.username}
            hideNotes={notesUsedAsSteps}
          />
        ) : null}

        {/* Reviews Section */}
        <DishReviewSection dishId={item.id} />
      </div>

      {lightboxIndex !== null && lightboxItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur"
          data-lightbox
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
          onTouchEnd={handleLightboxTouchEnd}
          onClick={handleLightboxClose}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-6 top-6 z-10 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              handleLightboxClose();
            }}
            aria-label={t('buttons.close')}
          >
            <X className="h-6 w-6" />
          </button>
          {lightboxItems.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30 sm:left-6 touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxPrev();
                }}
                aria-label={t('common.previous')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30 sm:right-6 touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxNext();
                }}
                aria-label={t('common.next')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center overflow-hidden rounded-3xl bg-black/50 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxItems[lightboxIndex].kind === 'image' ? (
              <InspirationFitImage
                src={lightboxItems[lightboxIndex].url}
                context="lightbox"
                className="max-h-[75vh] max-w-[85vw] rounded-2xl"
              />
            ) : (
              <EdgeAwareVideo
                ref={(el) => {
                  if (el) {
                    el.playsInline = true;
                    el.setAttribute('playsinline', '');
                    el.setAttribute('webkit-playsinline', '');
                  }
                }}
                src={getVideoUrlWithCors(lightboxItems[lightboxIndex].url)}
                fallbackSrc={lightboxItems[lightboxIndex].url}
                poster={lightboxItems[lightboxIndex].thumbnail || undefined}
                className="max-h-[75vh] max-w-[85vw] rounded-2xl"
                controls
                playsInline
                preload="metadata"
              />
            )}
            <div className="mt-3 flex w-full flex-col items-center gap-1 px-2 text-center text-white">
              {lightboxItems.length > 1 ? (
                <p className="text-sm text-white/80">
                  {t('inspiratie.instructions.imageCounter', {
                    current: lightboxIndex + 1,
                    total: lightboxItems.length,
                  })}
                </p>
              ) : null}
              {lightboxItems[lightboxIndex].caption ? (
                <p className="max-w-lg text-sm leading-relaxed text-white/90">
                  {lightboxItems[lightboxIndex].caption}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

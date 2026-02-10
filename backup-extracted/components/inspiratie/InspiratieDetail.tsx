"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Download,
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
  Sun,
  Droplet,
  Leaf,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';

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
  };
};

const CATEGORY_META: Record<
  InspirationCategory,
  {
    label: string;
    icon: typeof ChefHat;
    badge: string;
    gradient: string;
    accent: string;
  }
> = {
  CHEFF: {
    label: 'Recept',
    icon: ChefHat,
    badge: 'bg-orange-100 text-orange-700 border border-orange-200',
    gradient: 'from-orange-50 via-rose-50 to-amber-50',
    accent: 'text-orange-700',
  },
  GROWN: {
    label: 'Kweek',
    icon: Sprout,
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    gradient: 'from-emerald-50 via-green-50 to-lime-50',
    accent: 'text-emerald-700',
  },
  DESIGNER: {
    label: 'Design',
    icon: Palette,
    badge: 'bg-purple-100 text-purple-700 border border-purple-200',
    gradient: 'from-purple-50 via-pink-50 to-amber-50',
    accent: 'text-purple-700',
  },
};

const PRINTABLE_URLS: Record<InspirationCategory, (id: string) => string> = {
  CHEFF: (id: string) => `/recipe/${id}`,
  GROWN: (id: string) => `/garden/${id}`,
  DESIGNER: (id: string) => `/design/${id}`,
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

export default function InspiratieDetail({ item }: InspiratieDetailProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const categoryMeta = CATEGORY_META[item.category];

  const mediaItems = useMemo<MediaItem[]>(() => {
    const sortedPhotos = [...(item.photos ?? [])].sort((a, b) => {
      const aIdx = typeof a.idx === 'number' ? a.idx : 0;
      const bIdx = typeof b.idx === 'number' ? b.idx : 0;
      return aIdx - bIdx;
    });

    if (sortedPhotos.length > 0) {
      const mainIndex = sortedPhotos.findIndex(photo => photo.isMain);
      if (mainIndex > 0) {
        const [mainPhoto] = sortedPhotos.splice(mainIndex, 1);
        sortedPhotos.unshift(mainPhoto);
      }
    }

    const photosAsMedia = sortedPhotos.map(photo => ({
      id: photo.id,
      url: photo.url,
      kind: 'image' as const,
      thumbnail: photo.url,
      isMain: photo.isMain,
      idx: typeof photo.idx === 'number' ? photo.idx : undefined,
    }));

    const videosAsMedia = (item.videos ?? []).map(video => ({
      ...video,
      kind: 'video' as const,
    }));

    const stepPhotosAsMedia = (item.stepPhotos ?? []).map(photo => ({
      id: photo.id,
      url: photo.url,
      kind: 'image' as const,
      thumbnail: photo.url,
      idx: photo.idx,
    }));

    const growthPhotosAsMedia = (item.growthPhotos ?? []).map(photo => ({
      id: photo.id,
      url: photo.url,
      kind: 'image' as const,
      thumbnail: photo.url,
      idx: photo.idx,
    }));

    const combined = [
      ...photosAsMedia,
      ...videosAsMedia,
      ...stepPhotosAsMedia,
      ...growthPhotosAsMedia,
    ];

    const seen = new Set<string>();
    return combined.filter(media => {
      if (seen.has(media.id)) {
        return false;
      }
      seen.add(media.id);
      return true;
    });
  }, [item.photos, item.videos, item.stepPhotos, item.growthPhotos]);

  useEffect(() => {
    if (mediaItems.length > 0) {
      setActiveIndex(0);
    }
  }, [mediaItems.length]);

  const currentMedia = mediaItems[activeIndex];

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: item.title || 'Inspiratie-item',
      text: item.description || 'Bekijk dit inspiratie-item op HomeCheff',
      url: shareUrl,
    };

    try {
      setShareError(null);
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareError('Link gekopieerd naar klembord!');
        setTimeout(() => setShareError(null), 3000);
      }
    } catch (err) {
      setShareError('Kon niet delen, probeer later opnieuw.');
    }
  }, [item.title, item.description]);

  const handleDownload = useCallback(() => {
    const urlBuilder = PRINTABLE_URLS[item.category] || PRINTABLE_URLS.CHEFF;
    const printableUrl = urlBuilder(item.id);
    window.open(printableUrl, '_blank', 'noopener,noreferrer');
  }, [item.category, item.id]);

  const handleLightboxOpen = (index: number) => {
    if (index >= 0 && index < mediaItems.length) {
      setLightboxIndex(index);
    }
  };

  const handleLightboxClose = () => {
    setLightboxIndex(null);
  };

  const handlePrev = () => {
    if (mediaItems.length < 2) return;
    setActiveIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (mediaItems.length < 2) return;
    setActiveIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleLightboxPrev = () => {
    setLightboxIndex(prev => {
      if (prev === null || mediaItems.length < 2) {
        return prev;
      }
      return prev === 0 ? mediaItems.length - 1 : prev - 1;
    });
  };

  const handleLightboxNext = () => {
    setLightboxIndex(prev => {
      if (prev === null || mediaItems.length < 2) {
        return prev;
      }
      return prev === mediaItems.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div
          className={clsx(
            'relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-xl backdrop-blur',
            'p-6 sm:p-10',
            `bg-gradient-to-br ${categoryMeta.gradient}`
          )}
        >
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            {/* Media gallery */}
            <section className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg">
                {currentMedia ? (
                  <div className="group relative aspect-[4/3] w-full">
                    {currentMedia.kind === 'image' ? (
                      <Image
                        src={currentMedia.url}
                        alt={item.title || 'Inspiratiefoto'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                        sizes="(max-width: 1024px) 100vw, 720px"
                        priority={currentMedia.isMain}
                        onClick={() => handleLightboxOpen(activeIndex)}
                      />
                    ) : (
                      <video
                        src={currentMedia.url}
                        className="h-full w-full rounded-3xl object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    )}
                    <button
                      type="button"
                      className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/90 p-2 text-gray-800 shadow transition hover:bg-white"
                      onClick={() => handleLightboxOpen(activeIndex)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    {mediaItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow transition hover:bg-white"
                          onClick={handlePrev}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow transition hover:bg-white"
                          onClick={handleNext}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {currentMedia.kind === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-black/30 p-3 text-white backdrop-blur">
                          <PlayCircle className="h-10 w-10" />
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
                    <Sparkles className="h-12 w-12" />
                  </div>
                )}
              </div>

              {mediaItems.length > 1 && (
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {mediaItems.map((media, index) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={clsx(
                        'relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition',
                        activeIndex === index
                          ? 'border-emerald-500 shadow-lg'
                          : 'border-transparent hover:border-emerald-200'
                      )}
                    >
                      {media.kind === 'image' ? (
                        <Image
                          src={media.thumbnail || media.url}
                          alt="thumbnail"
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/60 text-white">
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Details */}
            <aside className="flex flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    categoryMeta.badge
                  )}
                >
                  <categoryMeta.icon className="h-4 w-4" />
                  {categoryMeta.label}
                </span>
                {item.subcategory && (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
                    {item.subcategory}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Gepubliceerd {formatDate(item.createdAt)}
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
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                  Delen
                </button>
                <Link
                  href={PRINTABLE_URLS[item.category](item.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Open printweergave
                </Link>
                {shareError && (
                  <span className="text-sm text-emerald-600">{shareError}</span>
                )}
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
                      {item.servings} porties
                    </span>
                  )}
                  {item.difficulty && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="h-4 w-4 text-gray-500" />
                      Moeilijkheid: {item.difficulty}
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
                        alt={item.user.name || item.user.username || 'Maker'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg font-semibold text-gray-600">
                        {(item.user.name || item.user.username || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Geplaatst door</p>
                    <p className="text-base font-semibold text-gray-900">
                      {item.user.name || item.user.username || 'Onbekende maker'}
                    </p>
                    {item.user.username && (
                      <Link
                        href={`/user/${item.user.username}`}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        Bekijk profiel
                      </Link>
                    )}
                  </div>
                </div>
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

        <section className="grid gap-8 md:grid-cols-2">
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <ChefHat className="h-5 w-5 text-orange-500" />
                Ingrediënten
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {item.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient}-${index}`} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.instructions && item.instructions.length > 0 && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Stappenplan
              </h2>
              <ol className="mt-4 space-y-4 text-sm text-gray-700">
                {item.instructions.map((step, index) => (
                  <li key={`${step}-${index}`}>
                    <span className="font-semibold text-emerald-600">
                      Stap {index + 1}
                    </span>
                    <p className="mt-1 leading-relaxed text-gray-700">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {item.materials && item.materials.length > 0 && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Palette className="h-5 w-5 text-purple-500" />
                Materialen
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {item.materials.map((material, index) => (
                  <li key={`${material}-${index}`} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.dimensions && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Leaf className="h-5 w-5 text-purple-500" />
                Specificaties
              </h2>
              <p className="mt-3 text-sm text-gray-700">Afmetingen: {item.dimensions}</p>
              {item.notes && (
                <p className="mt-2 text-sm text-gray-600">Notities: {item.notes}</p>
              )}
            </div>
          )}

          {(item.plantType ||
            item.sunlight ||
            item.waterNeeds ||
            item.soilType ||
            item.growthDuration ||
            item.harvestDate) && (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Sprout className="h-5 w-5 text-emerald-500" />
                Kweekinformatie
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {item.plantType && (
                  <p className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    Planttype: {item.plantType}
                  </p>
                )}
                {item.sunlight && (
                  <p className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Zonlicht: {item.sunlight}
                  </p>
                )}
                {item.waterNeeds && (
                  <p className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-sky-500" />
                    Waterbehoefte: {item.waterNeeds}
                  </p>
                )}
                {item.soilType && (
                  <p className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    Bodem: {item.soilType}
                  </p>
                )}
                {item.growthDuration && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Groei: {item.growthDuration} dagen
                  </p>
                )}
                {item.harvestDate && (
                  <p className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Oogst: {item.harvestDate}
                  </p>
                )}
                {item.plantDate && (
                  <p className="flex items-center gap-2">
                    <CalendarIcon />
                    Zaaien: {item.plantDate}
                  </p>
                )}
                {item.plantDistance && (
                  <p className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Plantafstand: {item.plantDistance}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {(item.stepPhotos.length > 0 || item.growthPhotos.length > 0) && (
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Extra beeldmateriaal
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {item.stepPhotos.map(photo => (
                <button
                  key={`step-${photo.id}`}
                  type="button"
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  onClick={() =>
                    handleLightboxOpen(
                      mediaItems.findIndex(media => media.id === photo.id)
                    )
                  }
                >
                  <div className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={photo.description || `Stap ${photo.stepNumber}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-1 p-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Stap {photo.stepNumber}
                    </span>
                    {photo.description && (
                      <p className="text-sm text-gray-600">{photo.description}</p>
                    )}
                  </div>
                </button>
              ))}

              {item.growthPhotos.map(photo => (
                <button
                  key={`growth-${photo.id}`}
                  type="button"
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  onClick={() =>
                    handleLightboxOpen(
                      mediaItems.findIndex(media => media.id === photo.id)
                    )
                  }
                >
                  <div className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={photo.description || `Fase ${photo.phaseNumber}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-1 p-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Groei fase {photo.phaseNumber}
                    </span>
                    {photo.description && (
                      <p className="text-sm text-gray-600">{photo.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {lightboxIndex !== null && mediaItems[lightboxIndex] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur">
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
            onClick={handleLightboxClose}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30"
            onClick={handleLightboxPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30"
            onClick={handleLightboxNext}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl bg-black/50 p-4 shadow-2xl">
            {mediaItems[lightboxIndex].kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaItems[lightboxIndex].url}
                alt="Lightbox media"
                className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain"
              />
            ) : (
              <video
                src={mediaItems[lightboxIndex].url}
                className="max-h-[80vh] max-w-[80vw] rounded-2xl"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 text-emerald-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}


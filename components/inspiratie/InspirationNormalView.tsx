"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, Sprout, Palette, Clock, Eye, Printer, Download,
  ArrowLeft, Share2, Heart, Star, Calendar, Droplet, Sun, MapPin, Ruler, Tag
} from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import ShareButton from '@/components/ui/ShareButton';
import FavoriteButton from '@/components/favorite/FavoriteButton';
import ImageSlider from '@/components/ui/ImageSlider';
import { useTranslation } from '@/hooks/useTranslation';
import { getDisplayName } from '@/lib/displayName';

type InspirationNormalViewProps = {
  item: {
    id: string;
    title: string | null;
    description: string | null;
    category: string | null;
    subcategory: string | null;
    photos: Array<{ id: string; url: string; isMain?: boolean; idx: number }>;
    video?: { url: string; thumbnail?: string | null } | null;
    ingredients?: string[];
    instructions?: string[];
    stepPhotos?: Array<{ id: string; url: string; stepNumber: number; description?: string | null }>;
    growthPhotos?: Array<{ id: string; url: string; phaseNumber: number; description?: string | null }>;
    materials?: string[];
    plantType?: string | null;
    plantDate?: Date | null;
    harvestDate?: Date | null;
    growthDuration?: number | null;
    sunlight?: 'FULL' | 'PARTIAL' | 'SHADE' | null;
    waterNeeds?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    location?: 'INDOOR' | 'OUTDOOR' | 'GREENHOUSE' | 'BALCONY' | null;
    soilType?: string | null;
    plantDistance?: string | null;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null;
    tags?: string[];
    notes?: string | null;
    createdAt: Date;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      profileImage: string | null;
    };
  };
  isOwner: boolean;
  category: 'CHEFF' | 'GROWN' | 'DESIGNER';
};

const getCategoryTheme = (category: string) => {
  switch (category) {
    case 'CHEFF':
      return {
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: ChefHat,
        label: 'Chef Special',
        accent: 'bg-orange-500'
      };
    case 'GROWN':
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: Sprout,
        label: 'Garden Fresh',
        accent: 'bg-emerald-500'
      };
    case 'DESIGNER':
      return {
        gradient: 'from-purple-500 via-pink-500 to-yellow-500',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Palette,
        label: 'Designer Piece',
        accent: 'bg-purple-500'
      };
    default:
      return {
        gradient: 'from-gray-500 via-gray-600 to-gray-700',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: ChefHat,
        label: 'Special Item',
        accent: 'bg-gray-500'
      };
  }
};

// Growth phase names matching GardenManager
const GROWTH_PHASE_NAMES = [
  '🌱 Zaaien/Planten',  // Phase 0
  '🌿 Kiemen',          // Phase 1
  '🌾 Groeien',         // Phase 2
  '🌺 Bloeien',         // Phase 3
  '🍅 Oogsten'          // Phase 4
];

const SUNLIGHT_LABELS: Record<string, string> = {
  'FULL': '☀️ Vol zon (6+ uur)',
  'PARTIAL': '⛅ Half schaduw (3-6 uur)',
  'SHADE': '🌥️ Schaduw (< 3 uur)'
};

const WATER_LABELS: Record<string, string> = {
  'HIGH': '💧💧💧 Veel (dagelijks)',
  'MEDIUM': '💧💧 Matig (2-3x per week)',
  'LOW': '💧 Weinig (1x per week)'
};

const LOCATION_LABELS: Record<string, string> = {
  'INDOOR': '🏠 Binnen',
  'OUTDOOR': '🌳 Buiten',
  'GREENHOUSE': '🏡 Serre',
  'BALCONY': '🪴 Balkon'
};

const DIFFICULTY_LABELS: Record<string, string> = {
  'EASY': '🌱 Makkelijk',
  'MEDIUM': '🌿 Gemiddeld',
  'HARD': '🌳 Gevorderd'
};

export default function InspirationNormalView({ item, isOwner, category }: InspirationNormalViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Debug: Log growth photos for garden items
  React.useEffect(() => {
    if (category === 'GROWN') {
      console.log('🌱 Garden item data:', {
        id: item.id,
        title: item.title,
        growthPhotos: item.growthPhotos,
        growthPhotosLength: item.growthPhotos?.length || 0,
        isArray: Array.isArray(item.growthPhotos),
        hasGrowthPhotos: item.growthPhotos && item.growthPhotos.length > 0
      });
    }
  }, [category, item.growthPhotos, item.id]);

  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;
  const images = item.photos || [];
  const currentImage = images[selectedImageIndex];
  const currentImageUrl = currentImage?.url;
  
  // Prepare media items for ImageSlider (all photos + stepPhotos + growthPhotos + video)
  // First, collect all photos in order: main photos first, then step photos, then growth photos
  const allPhotos = [
    ...(item.photos || []).filter(p => p && p.url).map(p => ({ 
      type: 'image' as const, 
      url: p.url,
      id: p.id,
      isMain: p.isMain,
      idx: p.idx || 0
    })),
    ...(item.stepPhotos || []).filter(p => p && p.url).map((p, index) => ({ 
      type: 'image' as const, 
      url: p.url,
      id: p.id,
      stepNumber: p.stepNumber,
      idx: index
    })),
    ...(item.growthPhotos || []).filter(p => p && p.url).map((p, index) => ({ 
      type: 'image' as const, 
      url: p.url,
      id: p.id,
      phaseNumber: p.phaseNumber,
      idx: (item.stepPhotos?.length || 0) + index
    }))
  ];
  
  // Sort by idx to maintain order, with main photos first
  const sortedPhotos = allPhotos.sort((a, b) => {
    // Main photos first
    if ('isMain' in a && a.isMain) return -1;
    if ('isMain' in b && b.isMain) return 1;
    // Then by idx
    return (a.idx || 0) - (b.idx || 0);
  });
  
  // Remove duplicates by URL
  const uniquePhotos = sortedPhotos.filter((photo, index, self) => 
    index === self.findIndex(p => p.url === photo.url)
  );
  
  const mediaItems = [
    ...(item.video && item.video.url ? [{
      type: 'video' as const,
      url: item.video.url,
      thumbnail: item.video.thumbnail || uniquePhotos[0]?.url || null
    }] : []),
    ...uniquePhotos.map(p => ({ type: 'image' as const, url: p.url }))
  ].filter(m => m && m.url && m.url.trim().length > 0);

  const getPrintUrl = () => {
    if (category === 'CHEFF') return `/recipe/${item.id}?view=print`;
    if (category === 'GROWN') return `/garden/${item.id}?view=print`;
    if (category === 'DESIGNER') return `/design/${item.id}?view=print`;
    return '';
  };

  const getDownloadUrl = () => {
    if (category === 'CHEFF') return `/recipe/${item.id}?view=print`;
    if (category === 'GROWN') return `/garden/${item.id}?view=print`;
    if (category === 'DESIGNER') return `/design/${item.id}?view=print`;
    return '';
  };

  // Group step photos by step number
  const stepPhotosMap: Record<number, Array<{ id: string; url: string; stepNumber: number; description?: string | null }>> = {};
  if (item.stepPhotos) {
    item.stepPhotos.forEach(photo => {
      if (!stepPhotosMap[photo.stepNumber]) {
        stepPhotosMap[photo.stepNumber] = [];
      }
      stepPhotosMap[photo.stepNumber]!.push(photo);
    });
  }

  return (
    <main className={`min-h-[100dvh] bg-gradient-to-br ${theme.bg} via-white to-gray-50`} data-inspiratie-page>
      {/* Hero Section with Large Image */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton fallbackUrl="/inspiratie" />
          </div>

          {/* Image Gallery with Carousel */}
          <div className="relative mx-auto w-full max-w-4xl px-0 sm:px-4 lg:px-6">
            {/* Main Image with Carousel */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/3] lg:max-h-[520px] rounded-3xl overflow-hidden bg-white shadow-2xl">
              {mediaItems.length > 0 ? (
                <>
                  <ImageSlider
                    media={mediaItems}
                    alt={item.title || 'Inspiratie item'}
                    className="w-full h-full"
                    showDots={mediaItems.length > 1}
                    showArrows={mediaItems.length > 1}
                    autoPlay={true}
                    autoPlayInterval={4000}
                    preventClick={false}
                    priority={true}
                    objectFit={category === 'GROWN' ? 'contain' : 'cover'}
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.badge} border-2 backdrop-blur-sm shadow-lg`}>
                      <CategoryIcon className="w-5 h-5" />
                      <span className="font-bold text-sm">{theme.label}</span>
                    </div>
                  </div>
                  
                  {/* Gradient overlay for garden items to ensure text readability */}
                  {category === 'GROWN' && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pointer-events-none z-[5]" />
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <CategoryIcon className="w-32 h-32 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Details */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">
                      {item.title}
                    </h1>
                    {item.subcategory && (
                      <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                        {item.subcategory}
                      </div>
                    )}
                  </div>
                  <FavoriteButton 
                    productId={item.id}
                    productTitle={item.title || ''}
                    size="lg"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Gepost {new Date(item.createdAt).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Over dit item</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.description || 'Geen beschrijving beschikbaar'}
                  </p>
                </div>
              </div>

              {/* Ingredients (for recipes) */}
              {category === 'CHEFF' && item.ingredients && item.ingredients.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ChefHat className="w-6 h-6 text-orange-600" />
                    Ingrediënten
                  </h3>
                  <ul className="space-y-2">
                    {item.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions with Step Photos (for recipes) */}
              {category === 'CHEFF' && item.instructions && item.instructions.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-orange-600" />
                    Bereidingswijze
                  </h3>
                  <div className="space-y-6">
                    {item.instructions.map((instruction, index) => {
                      const stepNumber = index + 1;
                      const stepPhotos = stepPhotosMap[stepNumber] || [];
                      
                      return (
                        <div key={index} className="flex gap-4 items-start bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                              {stepNumber}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed text-lg mb-3">{instruction}</p>
                            {stepPhotos.length > 0 && (
                              <div className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {stepPhotos.map((photo) => (
                                    <div key={photo.id} className="relative group cursor-pointer">
                                      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-orange-300 shadow-md">
                                        <Image
                                          src={photo.url}
                                          alt={`Stap ${stepNumber} foto`}
                                          fill
                                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                                          sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                      </div>
                                      {photo.description && (
                                        <p className="mt-2 text-sm text-gray-600 text-center">{photo.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Garden Details (for garden projects) */}
              {category === 'GROWN' && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Sprout className="w-6 h-6 text-emerald-600" />
                    Kweek Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.plantType && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Sprout className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Plant Type</div>
                          <div className="text-sm text-gray-600">{item.plantType}</div>
                        </div>
                      </div>
                    )}
                    {item.plantDate && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Zaai/Plant Datum</div>
                          <div className="text-sm text-gray-600">
                            {new Date(item.plantDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}
                    {item.harvestDate && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Verwachte Oogst</div>
                          <div className="text-sm text-gray-600">
                            {new Date(item.harvestDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}
                    {item.growthDuration && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Groeiduur</div>
                          <div className="text-sm text-gray-600">{item.growthDuration} dagen</div>
                        </div>
                      </div>
                    )}
                    {item.sunlight && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Sun className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Zonlicht</div>
                          <div className="text-sm text-gray-600">{SUNLIGHT_LABELS[item.sunlight] || item.sunlight}</div>
                        </div>
                      </div>
                    )}
                    {item.waterNeeds && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Droplet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Water Behoefte</div>
                          <div className="text-sm text-gray-600">{WATER_LABELS[item.waterNeeds] || item.waterNeeds}</div>
                        </div>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Locatie</div>
                          <div className="text-sm text-gray-600">{LOCATION_LABELS[item.location] || item.location}</div>
                        </div>
                      </div>
                    )}
                    {item.soilType && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Sprout className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Grondsoort</div>
                          <div className="text-sm text-gray-600">{item.soilType}</div>
                        </div>
                      </div>
                    )}
                    {item.plantDistance && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Ruler className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Plantafstand</div>
                          <div className="text-sm text-gray-600">{item.plantDistance}</div>
                        </div>
                      </div>
                    )}
                    {item.difficulty && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Star className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Moeilijkheidsgraad</div>
                          <div className="text-sm text-gray-600">{DIFFICULTY_LABELS[item.difficulty] || item.difficulty}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.notes && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-2">Notities / Tips</h4>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Growth Phases (for garden projects) */}
              {category === 'GROWN' && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Sprout className="w-6 h-6 text-emerald-600" />
                    Groeifases
                  </h3>
                  <div className="space-y-6">
                    {(() => {
                      const growthPhotosArray = item.growthPhotos || [];
                      
                      // Get unique phase numbers and sort them numerically
                      const uniquePhases = Array.from(new Set(growthPhotosArray.map(p => Number(p.phaseNumber))))
                        .filter(p => !isNaN(p))
                        .sort((a, b) => a - b);
                      
                      return uniquePhases.map((phaseNumber) => {
                        const phasePhotos = growthPhotosArray.filter(photo => Number(photo.phaseNumber) === phaseNumber) || [];
                        
                        if (phasePhotos.length === 0) return null;
                        
                        // Get phase name (phaseNumber is 0-indexed in database: 0, 1, 2, 3, 4)
                        const phaseName = GROWTH_PHASE_NAMES[phaseNumber] || `Fase ${phaseNumber + 1}`;
                        
                        return (
                          <div key={phaseNumber} className="flex gap-4 items-start bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                {phaseNumber + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-emerald-900 mb-2">{phaseName}</h4>
                              {phasePhotos[0]?.description && (
                                <p className="text-gray-800 leading-relaxed mb-3">{phasePhotos[0].description}</p>
                              )}
                              <div className="grid grid-cols-2 gap-3 mt-4">
                                {phasePhotos.map((photo) => (
                                  <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden border-2 border-emerald-300 shadow-md group cursor-pointer">
                                    <Image
                                      src={photo.url}
                                      alt={`${phaseName} foto`}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {/* Fase badge */}
                                    <div className="absolute top-2 left-2 z-10">
                                      <div className="px-2 py-1 bg-emerald-600/90 backdrop-blur-sm text-white rounded-md text-xs font-bold shadow-lg">
                                        {phaseName.replace(/^[^\w\s]+\s*/, '') || `Fase ${phaseNumber + 1}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Materials (for designs) */}
              {category === 'DESIGNER' && item.materials && item.materials.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-purple-600" />
                    Materialen
                  </h3>
                  <ul className="space-y-2">
                    {item.materials.map((material, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar - Actions Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`bg-gradient-to-br ${theme.gradient} rounded-3xl p-6 shadow-2xl text-white sticky top-8`}>
                <h3 className="text-xl font-bold mb-6">Acties</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(getPrintUrl())}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Printen</span>
                  </button>
                  <button
                    onClick={() => router.push(getDownloadUrl())}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20 flex gap-2">
                  <ShareButton
                    url={`${baseUrl}${category === 'CHEFF' ? `/recipe/${item.id}` : category === 'GROWN' ? `/garden/${item.id}` : `/design/${item.id}`}`}
                    title={item.title || ''}
                    description={item.description || ''}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Grid, Camera, ChefHat, Sprout, Palette, ChevronLeft, ChevronRight, ZoomIn, Eye } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import PhotoCarousel from '@/components/ui/PhotoCarousel';

interface WorkspacePhoto {
  id: string;
  url: string;
  sortOrder: number;
}

interface WorkspacePhotosDisplayProps {
  userId: string;
  userRoles: string[];
  className?: string;
}

const ROLE_ICONS = {
  'CHEFF': ChefHat,
  'GROWN': Sprout,
  'DESIGNER': Palette,
  'SELLER': Grid
};

const ROLE_LABELS = {
  'CHEFF': 'De Keuken',
  'GROWN': 'De Tuin', 
  'DESIGNER': 'Het Atelier',
  'SELLER': 'Werkruimte'
};

const ROLE_DESCRIPTIONS = {
  'CHEFF': 'Waar de magie van koken gebeurt',
  'GROWN': 'Waar groenten en kruiden groeien',
  'DESIGNER': 'Waar creativiteit tot leven komt',
  'SELLER': 'Waar producten worden gemaakt'
};

export default function WorkspacePhotosDisplay({ 
  userId, 
  userRoles, 
  className = '' 
}: WorkspacePhotosDisplayProps) {
  const [photos, setPhotos] = useState<Record<string, WorkspacePhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentRolePhotos, setCurrentRolePhotos] = useState<WorkspacePhoto[]>([]);

  useEffect(() => {
    loadWorkspacePhotos();
  }, [userId]);

  const loadWorkspacePhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/workspace-photos?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load workspace photos');
      }
      
      const data = await response.json();
      setPhotos(data.photos || {});
    } catch (err) {
      console.error('Error loading workspace photos:', err);
      setError('Kon werkruimte foto\'s niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const hasPhotos = Object.values(photos).some(rolePhotos => rolePhotos.length > 0);

  if (!hasPhotos) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nog geen werkruimte foto's gedeeld</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-8 ${className}`}>
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Werkruimte</h3>
        </div>

        {userRoles.map(role => {
          const rolePhotos = photos[role] || [];
          if (rolePhotos.length === 0) return null;

          const IconComponent = ROLE_ICONS[role as keyof typeof ROLE_ICONS] || Grid;
          const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || 'Werkruimte';
          const description = ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS] || 'Waar producten worden gemaakt';

          // Transform photos for PhotoCarousel component
          const carouselPhotos = rolePhotos.map(photo => ({
            id: photo.id,
            fileUrl: photo.url,
            sortOrder: photo.sortOrder
          }));

          return (
            <div key={role} className="space-y-6">
              {/* Role Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <IconComponent className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{label}</h4>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
              
              {/* Desktop: Carousel + Grid hybrid */}
              <div className="space-y-6">
                {/* Main Carousel (Desktop) */}
                <div className="hidden md:block">
                  <PhotoCarousel
                    photos={carouselPhotos}
                    className="w-full"
                    showThumbnails={true}
                    autoPlay={true}
                    autoPlayInterval={5000}
                  />
                </div>

                {/* Mobile: Carousel only */}
                <div className="md:hidden">
                  <PhotoCarousel
                    photos={carouselPhotos}
                    className="w-full"
                    showThumbnails={false}
                    autoPlay={true}
                    autoPlayInterval={4000}
                  />
                </div>

                {/* Grid View (Desktop) */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Alle {label} Foto's ({rolePhotos.length})
                    </h5>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {rolePhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          setSelectedImage(photo.url);
                          setSelectedImageIndex(index);
                          setCurrentRolePhotos(rolePhotos);
                        }}
                      >
                        <SafeImage
                          src={photo.url}
                          alt={`${label} foto`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Grid (compact) */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-medium text-gray-600">
                      {label} ({rolePhotos.length} foto's)
                    </h5>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {rolePhotos.slice(0, 6).map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          setSelectedImage(photo.url);
                          setSelectedImageIndex(index);
                          setCurrentRolePhotos(rolePhotos);
                        }}
                      >
                        <SafeImage
                          src={photo.url}
                          alt={`${label} foto`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-200"
                          sizes="33vw"
                        />
                      </div>
                    ))}
                    {rolePhotos.length > 6 && (
                      <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">
                          +{rolePhotos.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && currentRolePhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button - Desktop: Fixed buttons, Mobile: Transparent overlay */}
          {currentRolePhotos.length > 1 && selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex - 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(currentRolePhotos[newIndex].url);
              }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 md:bg-white/30 hover:bg-white/40 rounded-full text-white transition-all duration-200 z-10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Next Button - Desktop: Fixed buttons, Mobile: Transparent overlay */}
          {currentRolePhotos.length > 1 && selectedImageIndex < currentRolePhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex + 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(currentRolePhotos[newIndex].url);
              }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 md:bg-white/30 hover:bg-white/40 rounded-full text-white transition-all duration-200 z-10 backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Image Container */}
          <div 
            className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={selectedImage}
              alt="Werkruimte foto"
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Photo Counter */}
          {currentRolePhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm">
              {selectedImageIndex + 1} / {currentRolePhotos.length}
            </div>
          )}

          {/* Swipe hint for mobile */}
          <div className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            Swipe voor volgende foto
          </div>
        </div>
      )}
    </>
  );
}

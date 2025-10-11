"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Palette, ArrowLeft, Printer, Share2, Edit3, 
  Ruler, Package, Sparkles, Eye, Heart, Star,
  Brush, Scissors, Layers, Frame
} from 'lucide-react';
import Image from 'next/image';

type DesignPhoto = {
  id: string;
  url: string;
  isMain?: boolean;
  description?: string | null;
  idx: number;
};

type DesignData = {
  id: string;
  title: string | null;
  description: string | null;
  materials?: string[];
  dimensions?: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photos: DesignPhoto[];
  user: {
    id: string;
    username: string | null;
    name: string | null;
    profileImage: string | null;
  };
};

type DesignViewProps = {
  design: DesignData;
  isOwner: boolean;
};

export default function DesignView({ design, isOwner }: DesignViewProps) {
  const router = useRouter();

  const mainPhoto = design.photos.find(p => p.isMain) || design.photos[0];
  const otherPhotos = design.photos.filter(p => !p.isMain && p !== mainPhoto);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog with a hint to save as PDF
    alert('💡 In het print venster: kies "Opslaan als PDF" als bestemming om te downloaden!');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: design.title || 'Design',
          text: design.description || '',
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link gekopieerd naar klembord!');
    }
  };

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-design,
          #printable-design * {
            visibility: visible;
          }
          
          #printable-design {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-page-break {
            page-break-before: always;
            margin-top: 0;
            padding-top: 0;
          }
          
          .print-avoid-break {
            page-break-inside: avoid;
          }
          
          .artisan-border {
            border: 3px double #78350f !important;
          }
        }
        
        /* Vintage artisan styling */
        .artisan-frame {
          position: relative;
          background: linear-gradient(to bottom, #fefce8, #fef3c7);
        }
        
        .artisan-corner {
          position: absolute;
          width: 50px;
          height: 50px;
          border-color: #78350f;
        }
        
        .artisan-corner-tl {
          top: 0;
          left: 0;
          border-top: 4px double currentColor;
          border-left: 4px double currentColor;
        }
        
        .artisan-corner-tr {
          top: 0;
          right: 0;
          border-top: 4px double currentColor;
          border-right: 4px double currentColor;
        }
        
        .artisan-corner-bl {
          bottom: 0;
          left: 0;
          border-bottom: 4px double currentColor;
          border-left: 4px double currentColor;
        }
        
        .artisan-corner-br {
          bottom: 0;
          right: 0;
          border-bottom: 4px double currentColor;
          border-right: 4px double currentColor;
        }
        
        /* Elegant portfolio typography */
        .portfolio-title {
          font-family: 'Georgia', 'Garamond', serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        
        .portfolio-subtitle {
          font-family: 'Georgia', 'Garamond', serif;
          font-style: italic;
        }
        
        /* Vintage paper texture */
        .vintage-paper {
          background-image: 
            repeating-linear-gradient(
              0deg,
              rgba(120, 53, 15, 0.03) 0px,
              rgba(120, 53, 15, 0.03) 1px,
              transparent 1px,
              transparent 2px
            );
        }
        
        /* Gold accent */
        .gold-accent {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        {/* Header - No print */}
        <div className="no-print bg-white border-b border-yellow-300 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-yellow-800 hover:text-yellow-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Terug naar Atelier</span>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {isOwner && (
                <button
                  onClick={() => router.push(`/profile?tab=designs&edit=${design.id}`)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-yellow-800 border-2 border-yellow-700 rounded-lg hover:bg-yellow-50 transition-all hover:shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Bewerken</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delen</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-yellow-600 to-amber-700 text-white rounded-lg hover:from-yellow-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Printen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Printable */}
        <div id="printable-design" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Vintage Artisan Header Card */}
          <div className="artisan-frame vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-yellow-800 artisan-border relative">
            {/* Decorative corners */}
            <div className="artisan-corner artisan-corner-tl"></div>
            <div className="artisan-corner artisan-corner-tr"></div>
            <div className="artisan-corner artisan-corner-bl"></div>
            <div className="artisan-corner artisan-corner-br"></div>
            
            {/* Decorative top border with pattern */}
            <div className="bg-gradient-to-r from-yellow-900 via-amber-800 to-yellow-900 h-4 relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
              }}></div>
            </div>
            
            <div className="p-8 sm:p-12">
              {/* Artisan decoration */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-4 text-yellow-800">
                  <Brush className="w-6 h-6 opacity-60" />
                  <Palette className="w-8 h-8 opacity-80" />
                  <Scissors className="w-6 h-6 opacity-60" />
                </div>
              </div>

              {/* Main Title with vintage typography */}
              <h1 className="portfolio-title text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-yellow-900 mb-4 tracking-wider">
                {design.title || 'Design'}
              </h1>
              
              {/* Category subtitle */}
              {design.subcategory && (
                <p className="portfolio-subtitle text-center text-xl sm:text-2xl text-yellow-800 mb-6 font-light">
                  {design.subcategory}
                </p>
              )}

              {/* Decorative divider line */}
              <div className="flex items-center justify-center my-6">
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent w-full max-w-md"></div>
                <Sparkles className="w-8 h-8 mx-4 text-yellow-700 flex-shrink-0" />
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent w-full max-w-md"></div>
              </div>

              {/* Design Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center mt-8">
                {/* Category */}
                {design.category && (
                  <div className="border-2 border-yellow-300 rounded-lg p-4 bg-gradient-to-b from-white to-yellow-50">
                    <div className="text-xs uppercase tracking-wider text-yellow-700 mb-2 font-semibold">Categorie</div>
                    <div className="text-lg font-bold text-gray-800">{design.category}</div>
                  </div>
                )}
                
                {/* Dimensions */}
                {design.dimensions && (
                  <div className="border-2 border-yellow-300 rounded-lg p-4 bg-gradient-to-b from-white to-yellow-50">
                    <div className="text-xs uppercase tracking-wider text-yellow-700 mb-2 font-semibold">
                      <Ruler className="w-4 h-4 inline mr-1" />
                      Afmetingen
                    </div>
                    <div className="text-lg font-bold text-gray-800">{design.dimensions}</div>
                  </div>
                )}
              </div>

              {/* Artist/Maker Info */}
              <div className="mt-8 pt-6 border-t-2 border-yellow-300">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-xs uppercase tracking-wider text-yellow-700 font-semibold">Gemaakt door</div>
                  {design.user.profileImage ? (
                    <Image
                      src={design.user.profileImage}
                      alt={design.user.name || design.user.username || 'Maker'}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-yellow-600"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-yellow-600">
                      <Palette className="w-5 h-5 text-yellow-800" />
                    </div>
                  )}
                  <span className="font-bold text-gray-800">
                    {design.user.name || design.user.username || 'Artisan'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative bottom border */}
            <div className="bg-gradient-to-r from-yellow-900 via-amber-800 to-yellow-900 h-4 relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
              }}></div>
            </div>
          </div>

          {/* Featured Image Gallery Style */}
          {mainPhoto && (
            <div className="artisan-frame bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-yellow-700 relative">
              <div className="artisan-corner artisan-corner-tl"></div>
              <div className="artisan-corner artisan-corner-tr"></div>
              <div className="artisan-corner artisan-corner-bl"></div>
              <div className="artisan-corner artisan-corner-br"></div>
              
              {/* Gallery frame effect */}
              <div className="p-4 bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100">
                <div className="relative w-full bg-white p-2 shadow-inner" style={{ paddingTop: '75%' }}>
                  <Image
                    src={mainPhoto.url}
                    alt={design.title || 'Design'}
                    fill
                    className="object-contain p-4"
                    priority
                  />
                </div>
                {/* Exhibition label */}
                <div className="mt-4 text-center bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                  <p className="portfolio-subtitle text-yellow-900 text-sm">
                    <Frame className="w-4 h-4 inline mr-2" />
                    {design.title}
                    {design.dimensions && <span className="text-xs ml-2">({design.dimensions})</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {design.description && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-6">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-2xl sm:text-3xl font-bold text-yellow-900 px-4">
                  Over dit Ontwerp
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-justify portfolio-subtitle text-lg">
                  {design.description}
                </p>
              </div>
            </div>
          )}

          {/* Materials & Process */}
          {design.materials && Array.isArray(design.materials) && design.materials.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-8">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-2xl font-bold text-yellow-900 px-4 flex items-center">
                  <Layers className="w-6 h-6 mr-2 text-yellow-700" />
                  Materialen & Technieken
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-300">
                <ul className="space-y-3">
                  {design.materials.map((material, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-yellow-700 transition-colors">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-lg leading-relaxed">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Additional Photos Gallery */}
          {otherPhotos.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-8">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-2xl sm:text-3xl font-bold text-yellow-900 px-4">
                  📸 Detailfoto's
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {otherPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="artisan-frame relative group bg-yellow-50 p-3 border-2 border-yellow-300 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all hover:scale-105"
                  >
                    <div className="relative w-full h-48 bg-white">
                      <Image
                        src={photo.url}
                        alt={`Detail ${index + 1}`}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    {photo.description && (
                      <p className="mt-2 text-xs text-yellow-800 text-center italic">{photo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {design.notes && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-6">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-2xl font-bold text-yellow-900 px-4">
                  💭 Maker's Notes
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-8 border-2 border-yellow-300 shadow-inner">
                <div className="relative">
                  <div className="absolute -top-4 -left-2 text-6xl text-yellow-300 opacity-50 font-serif">"</div>
                  <div className="relative z-10">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed portfolio-subtitle text-lg pl-8">
                      {design.notes}
                    </p>
                  </div>
                  <div className="absolute -bottom-8 -right-2 text-6xl text-yellow-300 opacity-50 font-serif">"</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {design.tags && design.tags.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-8">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-2xl sm:text-3xl font-bold text-yellow-900 px-4">
                  🏷️ Kenmerken
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {design.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-900 rounded-full text-sm font-bold border-2 border-yellow-500 shadow-md hover:shadow-lg transition-all hover:scale-105"
                  >
                    <span className="mr-2">✨</span>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Artisan Signature */}
          <div className="text-center mt-12 mb-8 print-avoid-break">
            <div className="inline-flex items-center justify-center space-x-4 text-yellow-700 opacity-60">
              <Palette className="w-6 h-6" />
              <div className="text-center">
                <p className="portfolio-subtitle text-lg text-yellow-900">
                  Handgemaakt met passie en aandacht
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  HomeCheff Atelier
                </p>
              </div>
              <Brush className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


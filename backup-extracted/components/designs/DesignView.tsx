"use client";

import { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { useRouter } from 'next/navigation';
import { 
  Palette, ArrowLeft, Printer, Share2, Edit3, 
  Ruler, Sparkles, Brush, Scissors, Layers, Frame, Download, MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import BackButton from '@/components/navigation/BackButton';
import StartChatButton from '@/components/chat/StartChatButton';

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
          margin: 12mm;
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
            <BackButton 
              fallbackUrl="/profile?tab=designs"
              label="Terug naar Atelier"
              variant="minimal"
              className="text-yellow-800 hover:text-yellow-900"
            />

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
              {!isOwner && (
                <StartChatButton
                  sellerId={design.user.id}
                  sellerName={design.user.name || getDisplayName(design.user)}
                  productId={design.id}
                  showSuccessMessage={true}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Printable */}
        <div id="printable-design" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-4">
          {/* Vintage Artisan Header Card - Compacter */}
          <div className="artisan-frame vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl overflow-hidden mb-6 print:mb-4 print-avoid-break border-3 border-yellow-800 artisan-border relative">
            {/* Decorative corners */}
            <div className="artisan-corner artisan-corner-tl"></div>
            <div className="artisan-corner artisan-corner-tr"></div>
            <div className="artisan-corner artisan-corner-bl"></div>
            <div className="artisan-corner artisan-corner-br"></div>
            
            {/* Decorative top border */}
            <div className="bg-gradient-to-r from-yellow-900 via-amber-800 to-yellow-900 h-2 relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
              }}></div>
            </div>
            
            <div className="p-6 sm:p-8 print:p-6">
              {/* Artisan decoration - Kleiner */}
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center space-x-3 text-yellow-800">
                  <Brush className="w-4 h-4 opacity-60" />
                  <Palette className="w-5 h-5 opacity-80" />
                  <Scissors className="w-4 h-4 opacity-60" />
                </div>
              </div>

              {/* Main Title - Compacter */}
              <h1 className="portfolio-title text-center text-3xl sm:text-4xl font-bold text-yellow-900 mb-2 tracking-wider print:text-3xl">
                {design.title || 'Design'}
              </h1>
              
              {/* Category subtitle */}
              {design.subcategory && (
                <p className="portfolio-subtitle text-center text-lg sm:text-xl text-yellow-800 mb-4 font-light print:text-lg print:mb-3">
                  {design.subcategory}
                </p>
              )}

              {/* Decorative divider - Kleiner */}
              <div className="flex items-center justify-center my-4 print:my-3">
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent w-full max-w-md"></div>
                <Sparkles className="w-6 h-6 mx-3 text-yellow-700 flex-shrink-0" />
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent w-full max-w-md"></div>
              </div>

              {/* Design Meta - Compacter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center mt-4 print:gap-2 print:mt-3">
                {/* Category */}
                {design.category && (
                  <div className="border-2 border-yellow-300 rounded-lg p-3 bg-gradient-to-b from-white to-yellow-50 print:p-2">
                    <div className="text-xs uppercase tracking-wider text-yellow-700 mb-1 font-semibold">Categorie</div>
                    <div className="text-base font-bold text-gray-800">{design.category}</div>
                  </div>
                )}
                
                {/* Dimensions */}
                {design.dimensions && (
                  <div className="border-2 border-yellow-300 rounded-lg p-3 bg-gradient-to-b from-white to-yellow-50 print:p-2">
                    <div className="text-xs uppercase tracking-wider text-yellow-700 mb-1 font-semibold">
                      <Ruler className="w-4 h-4 inline mr-1" />
                      Afmetingen
                    </div>
                    <div className="text-base font-bold text-gray-800">{design.dimensions}</div>
                  </div>
                )}
              </div>

              {/* Artist/Maker Info - Compacter */}
              <div className="mt-4 pt-4 border-t-2 border-yellow-300 print:mt-3 print:pt-3">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-xs uppercase tracking-wider text-yellow-700 font-semibold">Gemaakt door</div>
                  {design.user.profileImage ? (
                    <Image
                      src={design.user.profileImage}
                      alt={design.user.name || getDisplayName(design.user)}
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
                    {design.user.name || getDisplayName(design.user)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative bottom border */}
            <div className="bg-gradient-to-r from-yellow-900 via-amber-800 to-yellow-900 h-2 relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
              }}></div>
            </div>
          </div>

          {/* Featured Image - Compacter */}
          {mainPhoto && (
            <div className="artisan-frame bg-white rounded-none sm:rounded-2xl shadow-xl overflow-hidden mb-6 print:mb-4 print-avoid-break border-3 border-yellow-700 relative">
              <div className="artisan-corner artisan-corner-tl"></div>
              <div className="artisan-corner artisan-corner-tr"></div>
              <div className="artisan-corner artisan-corner-bl"></div>
              <div className="artisan-corner artisan-corner-br"></div>
              
              {/* Gallery frame - Compacter */}
              <div className="p-3 bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100 print:p-2">
                <div className="relative w-full bg-white p-2 shadow-inner" style={{ paddingTop: '66.67%' }}>
                  <Image
                    src={mainPhoto.url}
                    alt={design.title || 'Design'}
                    fill
                    className="object-contain p-4"
                    priority
                  />
                </div>
                {/* Exhibition label */}
                <div className="mt-3 text-center bg-yellow-50 border-2 border-yellow-300 rounded-lg p-2 print:p-1.5">
                  <p className="portfolio-subtitle text-yellow-900 text-sm print:text-xs">
                    <Frame className="w-4 h-4 inline mr-2" />
                    {design.title}
                    {design.dimensions && <span className="text-xs ml-2">({design.dimensions})</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description - Compacter */}
          {design.description && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-4 print:mb-3">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-xl sm:text-2xl font-bold text-yellow-900 px-4 print:text-xl">
                  Over dit Ontwerp
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-justify portfolio-subtitle text-base print:text-sm">
                  {design.description}
                </p>
              </div>
            </div>
          )}

          {/* Materials - Compacter */}
          {design.materials && Array.isArray(design.materials) && design.materials.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-xl sm:text-2xl font-bold text-yellow-900 px-4 flex items-center print:text-xl">
                  <Layers className="w-5 h-5 mr-2 text-yellow-700" />
                  Materialen & Technieken
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border-2 border-yellow-300 print:p-4">
                <ul className="space-y-2 print:space-y-1.5">
                  {design.materials.map((material, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-yellow-700 transition-colors">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-base leading-relaxed print:text-sm">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Additional Photos - Compacter */}
          {otherPhotos.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-xl sm:text-2xl font-bold text-yellow-900 px-4 print:text-xl">
                  📸 Detailfoto's
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-3">
                {otherPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="artisan-frame relative group bg-yellow-50 p-2 border-2 border-yellow-300 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105 print:p-1.5"
                  >
                    <div className="relative w-full h-40 bg-white print:h-32">
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

          {/* Notes - Compacter */}
          {design.notes && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-4 print:mb-3">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-xl sm:text-2xl font-bold text-yellow-900 px-4 print:text-xl">
                  💭 Maker's Notes
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-yellow-300 shadow-inner print:p-4">
                <div className="relative">
                  <div className="absolute -top-3 -left-1 text-5xl text-yellow-300 opacity-50 font-serif print:text-4xl">"</div>
                  <div className="relative z-10">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed portfolio-subtitle text-base pl-6 print:text-sm print:pl-5">
                      {design.notes}
                    </p>
                  </div>
                  <div className="absolute -bottom-6 -right-1 text-5xl text-yellow-300 opacity-50 font-serif print:text-4xl">"</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags - Compacter */}
          {design.tags && design.tags.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-yellow-400">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-yellow-400 flex-grow"></div>
                <h2 className="portfolio-title text-xl sm:text-2xl font-bold text-yellow-900 px-4 print:text-xl">
                  🏷️ Kenmerken
                </h2>
                <div className="h-px bg-yellow-400 flex-grow"></div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center print:gap-1.5">
                {design.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-900 rounded-full text-sm font-bold border-2 border-yellow-500 shadow-md hover:shadow-lg transition-all hover:scale-105 print:px-3 print:py-1.5 print:text-xs"
                  >
                    <span className="mr-2">✨</span>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HomeCheff Branding Footer */}
          <div className="mt-8 pt-6 border-t-2 border-yellow-300 print:mt-6 print:pt-4">
            <div className="flex flex-col items-center gap-3 print:gap-2">
              <div className="flex items-center gap-3">
                {/* HomeCheff Logo SVG */}
                <div className="w-6 h-6 relative">
                  <svg viewBox="0 0 60 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M15 10 Q20 5 25 10 L30 10 Q35 5 40 10 L40 20 Q40 25 35 25 L20 25 Q15 25 15 20 Z" fill="white" stroke="#1e40af" strokeWidth="2"/>
                      <rect x="22" y="25" width="16" height="30" fill="white" stroke="#1e40af" strokeWidth="2" rx="2"/>
                      <circle cx="30" cy="35" r="5" fill="white" stroke="#1e40af" strokeWidth="2"/>
                      <circle cx="28" cy="33" r="1" fill="#1e40af"/>
                      <circle cx="32" cy="33" r="1" fill="#1e40af"/>
                      <path d="M26 37 Q30 40 34 37" stroke="#1e40af" strokeWidth="1.5" fill="none"/>
                      <circle cx="30" cy="30" r="1" fill="#1e40af"/>
                      <circle cx="30" cy="35" r="1" fill="#1e40af"/>
                      <rect x="5" y="30" width="15" height="3" fill="#22c55e" stroke="#1e40af" strokeWidth="1" rx="1"/>
                      <circle cx="5" cy="31.5" r="3" fill="#22c55e" stroke="#1e40af" strokeWidth="1"/>
                      <circle cx="45" cy="35" r="10" fill="#3b82f6" stroke="#1e40af" strokeWidth="2"/>
                      <path d="M35 35 Q45 30 55 35 M35 35 Q45 40 55 35" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
                      <path d="M45 25 Q50 35 45 45 M45 25 Q40 35 45 45" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
                      <path d="M48 20 Q50 15 52 20 M50 18 Q52 13 54 18 M52 16 Q54 11 56 16" stroke="white" strokeWidth="2" fill="none"/>
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
                    HomeCheff
                  </span>
                  <span className="text-xs text-gray-500 -mt-1">
                    Creatieve Lokale Talenten
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  Gemaakt op HomeCheff Atelier
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Handgemaakt met passie en aandacht
                </p>
              </div>
              <div className="text-xs text-gray-400 print:text-gray-600">
                www.homecheff.nl
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


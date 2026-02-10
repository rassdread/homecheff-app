"use client";

import { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Droplet, Sun, MapPin, Sprout, Clock, 
  Gauge, StickyNote, Tag, User, ArrowLeft, Printer,
  Download, Share2, Edit3, Leaf, Flower, 
  CircleDot, ArrowRight, MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import BackButton from '@/components/navigation/BackButton';
import StartChatButton from '@/components/chat/StartChatButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';

type GardenPhoto = {
  id: string;
  url: string;
  isMain: boolean;
  idx: number;
};

type GrowthPhoto = {
  id: string;
  url: string;
  phaseNumber: number;
  description: string | null;
  idx: number;
};

type GardenProjectData = {
  id: string;
  title: string | null;
  description: string | null;
  plantType: string | null;
  plantDate: string | null;
  harvestDate: string | null;
  growthDuration: number | null;
  sunlight: string | null;
  waterNeeds: string | null;
  location: string | null;
  soilType: string | null;
  plantDistance: string | null;
  difficulty: string | null;
  tags: string[];
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photos: GardenPhoto[];
  growthPhotos: GrowthPhoto[];
  video: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    profileImage: string | null;
  };
};

type GardenProjectViewProps = {
  project: GardenProjectData;
  isOwner: boolean;
  ownerPermissions?: {
    downloadPermission: 'EVERYONE' | 'FANS_ONLY' | 'FAN_OF_ONLY' | 'ASK_PERMISSION' | 'NOBODY';
    printPermission: 'EVERYONE' | 'FANS_ONLY' | 'FAN_OF_ONLY' | 'ASK_PERMISSION' | 'NOBODY';
  };
  currentUser?: {
    id?: string;
    isFanOfOwner?: boolean;
  };
};

export default function GardenProjectView({ project, isOwner, ownerPermissions, currentUser }: GardenProjectViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { addAffiliateToUrl, isAffiliate } = useAffiliateLink();
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Check download permission
  const canDownload = () => {
    if (isOwner) return true; // Owner can always download
    if (!ownerPermissions || !currentUser?.id) return false;
    
    const permission = ownerPermissions.downloadPermission || 'EVERYONE';
    if (permission === 'EVERYONE') return true;
    if (permission === 'NOBODY') return false;
    if (permission === 'FANS_ONLY' || permission === 'FAN_OF_ONLY') {
      return currentUser.isFanOfOwner === true;
    }
    if (permission === 'ASK_PERMISSION') return false; // Would need to request permission
    return false;
  };

  // Check print permission
  const canPrint = () => {
    if (isOwner) return true; // Owner can always print
    if (!ownerPermissions || !currentUser?.id) return false;
    
    const permission = ownerPermissions.printPermission || 'EVERYONE';
    if (permission === 'EVERYONE') return true;
    if (permission === 'NOBODY') return false;
    if (permission === 'FANS_ONLY' || permission === 'FAN_OF_ONLY') {
      return currentUser.isFanOfOwner === true;
    }
    if (permission === 'ASK_PERMISSION') return false; // Would need to request permission
    return false;
  };

  const mainPhoto = project.photos.find(p => p.isMain) || project.photos[0];
  const otherPhotos = project.photos.filter(p => !p.isMain);

  // Group growth photos by phase
  const growthPhases = project.growthPhotos.reduce((acc, photo) => {
    if (!acc[photo.phaseNumber]) {
      acc[photo.phaseNumber] = [];
    }
    acc[photo.phaseNumber].push(photo);
    return acc;
  }, {} as Record<number, GrowthPhoto[]>);

  const sortedPhases = Object.keys(growthPhases).sort((a, b) => Number(a) - Number(b));

  // Phase names matching GardenManager
  const PHASE_NAMES = [
    t('garden.phaseSeedPlant'),
    t('garden.phaseGerminate'),
    t('garden.phaseGrow'),
    t('garden.phaseBloom'),
    t('garden.phaseHarvest')
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog with a hint to save as PDF
    const printHint = t('common.printDialogHintAlt').replace(/'/g, "\\'");
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print naar PDF - ${project.title}</title>
            <script>
              window.onload = function() {
                alert('${printHint}');
                window.print();
              }
            </script>
          </head>
          <body>
            ${document.getElementById('printable-content')?.innerHTML || ''}
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback: gebruik gewone print
      alert(t('common.printDialogTip'));
      window.print();
    }
  };

  const handleShare = async () => {
    const baseUrl = window.location.href;
    const url = addAffiliateToUrl(baseUrl);
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title || 'Kweekproject',
          text: project.description || '',
          url: url,
        });
        // Show notification if affiliate
        if (isAffiliate) {
          setTimeout(() => {
            alert('Je affiliate link is automatisch meegestuurd!');
          }, 500);
        }
      } catch (err) {

      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      if (isAffiliate) {
        alert('Link gekopieerd met je affiliate code!');
      } else {
        alert(t('errors.linkCopied'));
      }
    }
  };

  const difficultyLabels: Record<string, string> = {
    EASY: 'Makkelijk',
    MEDIUM: 'Gemiddeld',
    HARD: 'Moeilijk'
  };

  const sunlightLabels: Record<string, string> = {
    FULL: 'Volle zon',
    PARTIAL: 'Halfschaduw',
    SHADE: 'Schaduw'
  };

  const waterNeedsLabels: Record<string, string> = {
    HIGH: 'Veel water',
    MEDIUM: 'Gemiddeld',
    LOW: 'Weinig water'
  };

  const locationLabels: Record<string, string> = {
    INDOOR: 'Binnen',
    OUTDOOR: 'Buiten',
    GREENHOUSE: 'Kas',
    BALCONY: 'Balkon'
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
          
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          
          #printable-content {
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
          
          .print-botanical-border {
            border: 3px double #2d5016 !important;
            padding: 20px !important;
          }
          
          .print-shadow {
            box-shadow: none !important;
          }
          
          /* Botanical vintage print styling */
          .botanical-print-header {
            border-bottom: 2px solid #2d5016 !important;
            padding-bottom: 15px !important;
            margin-bottom: 20px !important;
          }
          
          .botanical-section {
            border: 1px solid #8b9e76 !important;
            margin: 15px 0 !important;
          }
        }
        
        /* Vintage botanical styling */
        .botanical-frame {
          position: relative;
          background: linear-gradient(to bottom, #fdfcfb, #f8f7f2);
        }
        
        .botanical-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: #2d5016;
        }
        
        .botanical-corner-tl {
          top: 0;
          left: 0;
          border-top: 3px double currentColor;
          border-left: 3px double currentColor;
        }
        
        .botanical-corner-tr {
          top: 0;
          right: 0;
          border-top: 3px double currentColor;
          border-right: 3px double currentColor;
        }
        
        .botanical-corner-bl {
          bottom: 0;
          left: 0;
          border-bottom: 3px double currentColor;
          border-left: 3px double currentColor;
        }
        
        .botanical-corner-br {
          bottom: 0;
          right: 0;
          border-bottom: 3px double currentColor;
          border-right: 3px double currentColor;
        }
        
        /* Elegant typography */
        .botanical-title {
          font-family: 'Georgia', 'Garamond', serif;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .botanical-subtitle {
          font-family: 'Georgia', 'Garamond', serif;
          font-style: italic;
        }
        
        /* Vintage paper texture */
        .vintage-paper {
          background-image: 
            repeating-linear-gradient(
              0deg,
              rgba(139, 158, 118, 0.03) 0px,
              rgba(139, 158, 118, 0.03) 1px,
              transparent 1px,
              transparent 2px
            );
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-lime-50">
        {/* Header - No print */}
        <div className="no-print bg-white border-b border-emerald-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <BackButton 
              fallbackUrl="/profile?tab=garden"
              label={t('common.backToGarden')}
              variant="minimal"
              className="text-emerald-700 hover:text-emerald-900"
            />

            <div className="flex items-center space-x-2 sm:space-x-3">
              {isOwner && (
                <button
                  onClick={() => router.push(`/profile?tab=garden&edit=${project.id}`)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-emerald-700 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-all hover:shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md relative group"
                title={isAffiliate ? "Deel dit kweekproject - je affiliate link wordt automatisch meegestuurd" : t('common.share')}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.share')}</span>
                {isAffiliate && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" title="Affiliate link wordt meegestuurd"></span>
                )}
              </button>
              {canDownload() && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.pdf')}</span>
                </button>
              )}
              {canPrint() && (
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Printen</span>
                </button>
              )}
              {!isOwner && (
                <StartChatButton
                  sellerId={project.user.id}
                  sellerName={project.user.name || getDisplayName(project.user)}
                  productId={project.id}
                  showSuccessMessage={true}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Printable */}
        <div id="printable-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
          {/* Vintage Botanical Header Card - Same format as recipes */}
          <div className="botanical-frame vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print:mb-4 print-avoid-break border-4 border-emerald-800 print-botanical-border relative">
            {/* Decorative corners */}
            <div className="botanical-corner botanical-corner-tl"></div>
            <div className="botanical-corner botanical-corner-tr"></div>
            <div className="botanical-corner botanical-corner-bl"></div>
            <div className="botanical-corner botanical-corner-br"></div>
            
            {/* Decorative top border */}
            <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 h-2"></div>
            
            <div className="p-8 sm:p-12 print:p-6">
              {/* Botanical illustration divider - Same size as recipes */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-3 text-emerald-700">
                  <Leaf className="w-6 h-6 opacity-60" />
                  <Sprout className="w-7 h-7 opacity-80" />
                  <Flower className="w-6 h-6 opacity-60" />
                </div>
              </div>

              {/* Main Title - Same size as recipes */}
              <h1 className="botanical-title text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-900 mb-4 tracking-wide">
                {project.title || 'Kweekproject'}
              </h1>
              
              {/* Plant type subtitle */}
              {project.plantType && (
                <p className="botanical-subtitle text-center text-xl sm:text-2xl text-emerald-700 mb-6 font-light">
                  {project.plantType}
                </p>
              )}

              {/* Decorative divider - Same size as recipes */}
              <div className="flex items-center justify-center my-6">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-600 to-transparent w-full max-w-md"></div>
                <Sprout className="w-8 h-8 mx-4 text-emerald-600 flex-shrink-0" />
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-600 to-transparent w-full max-w-md"></div>
              </div>

              {/* Metadata Grid - Same size as recipes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-8">
                {/* Difficulty */}
                {project.difficulty && (
                  <div className="border-2 border-emerald-200 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50">
                    <div className="text-xs uppercase tracking-wider text-emerald-600 mb-2 font-semibold">Moeilijkheidsgraad</div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                      project.difficulty === 'EASY' ? 'bg-green-100 text-green-800 border-2 border-green-400' :
                      project.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' :
                      'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}>
                      {difficultyLabels[project.difficulty] || project.difficulty}
                    </div>
                  </div>
                )}
                
                {/* Creation date */}
                <div className="border-2 border-emerald-200 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50">
                  <div className="text-xs uppercase tracking-wider text-emerald-600 mb-2 font-semibold">Gedocumenteerd</div>
                  <div className="text-lg font-bold text-gray-800">
                    {new Date(project.createdAt).toLocaleDateString('nl-NL', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Grower info */}
                <div className="border-2 border-emerald-200 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50">
                  <div className="text-xs uppercase tracking-wider text-emerald-600 mb-2 font-semibold">Gekweekt Door</div>
                  <div className="flex items-center justify-center space-x-2">
                    {project.user.profileImage ? (
                      <Image
                        src={project.user.profileImage}
                        alt={project.user.name || getDisplayName(project.user)}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-emerald-500"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center border-2 border-emerald-500">
                        <User className="w-4 h-4 text-emerald-700" />
                      </div>
                    )}
                    <span className="font-bold text-gray-800">
                      {project.user.name || getDisplayName(project.user)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative bottom border */}
            <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 h-3"></div>
          </div>

          {/* Featured Image - Same format as recipes */}
          {mainPhoto && (
            <div className="botanical-frame bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-emerald-700 relative">
              <div className="botanical-corner botanical-corner-tl"></div>
              <div className="botanical-corner botanical-corner-tr"></div>
              <div className="botanical-corner botanical-corner-bl"></div>
              <div className="botanical-corner botanical-corner-br"></div>
              
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <Image
                  src={mainPhoto.url}
                  alt={project.title || 'Hoofdfoto'}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="botanical-subtitle text-white text-lg text-center">
                    {project.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Video */}
          {project.video && project.video.url && (
            <div className="botanical-frame bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-emerald-700 relative no-print">
              <div className="botanical-corner botanical-corner-tl"></div>
              <div className="botanical-corner botanical-corner-tr"></div>
              <div className="botanical-corner botanical-corner-bl"></div>
              <div className="botanical-corner botanical-corner-br"></div>
              
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <video
                  src={project.video.url}
                  controls
                  className="w-full h-full object-cover"
                  poster={project.video.thumbnail || undefined}
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                >
                  Je browser ondersteunt geen video element.
                </video>
                {/* Video label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="botanical-subtitle text-white text-lg text-center">
                    Video: {project.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description - Same format as recipes */}
          {project.description && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 print-avoid-break border-4 border-emerald-300">
              <div className="flex items-center mb-4 print:mb-3">
                <div className="h-px bg-emerald-300 flex-grow"></div>
                <h2 className="botanical-title text-xl sm:text-2xl font-bold text-emerald-900 px-4 print:text-xl">
                  Beschrijving
                </h2>
                <div className="h-px bg-emerald-300 flex-grow"></div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-justify botanical-subtitle text-base print:text-sm">
                  {project.description}
                </p>
              </div>
            </div>
          )}

          {/* Growing Conditions - Same format as recipes */}
          <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 print-avoid-break border-4 border-emerald-300 botanical-section">
            <div className="flex items-center mb-5 print:mb-4">
              <div className="h-px bg-emerald-300 flex-grow"></div>
              <h2 className="botanical-title text-xl sm:text-2xl font-bold text-emerald-900 px-4 print:text-xl">
                Groeiomstandigheden & Verzorging
              </h2>
              <div className="h-px bg-emerald-300 flex-grow"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-3">
              {project.sunlight && (
                <div className="border-2 border-yellow-200 rounded-xl p-3 bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-lg transition-shadow print:p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="p-1.5 bg-yellow-200 rounded-full">
                      <Sun className="w-4 h-4 text-yellow-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-yellow-700 font-bold">Zonlicht</p>
                  </div>
                  <p className="font-bold text-base text-gray-900 ml-8 print:text-sm print:ml-7">
                    {sunlightLabels[project.sunlight] || project.sunlight}
                  </p>
                </div>
              )}

              {project.waterNeeds && (
                <div className="border-2 border-blue-200 rounded-xl p-3 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-shadow print:p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="p-1.5 bg-blue-200 rounded-full">
                      <Droplet className="w-4 h-4 text-blue-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-blue-700 font-bold">Water</p>
                  </div>
                  <p className="font-bold text-base text-gray-900 ml-8 print:text-sm print:ml-7">
                    {waterNeedsLabels[project.waterNeeds] || project.waterNeeds}
                  </p>
                </div>
              )}

              {project.location && (
                <div className="border-2 border-emerald-200 rounded-xl p-3 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-shadow print:p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="p-1.5 bg-emerald-200 rounded-full">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Locatie</p>
                  </div>
                  <p className="font-bold text-base text-gray-900 ml-8 print:text-sm print:ml-7">
                    {locationLabels[project.location] || project.location}
                  </p>
                </div>
              )}

              {project.plantDate && (
                <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-lime-50 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-200 rounded-full">
                      <Calendar className="w-6 h-6 text-green-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-green-700 font-bold">Zaai/Plant Datum</p>
                  </div>
                  <p className="font-bold text-lg text-gray-900 ml-11">
                    {new Date(project.plantDate).toLocaleDateString('nl-NL', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {project.harvestDate && (
                <div className="border-2 border-orange-200 rounded-xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-orange-200 rounded-full">
                      <Calendar className="w-6 h-6 text-orange-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-orange-700 font-bold">Oogstdatum</p>
                  </div>
                  <p className="font-bold text-lg text-gray-900 ml-11">
                    {new Date(project.harvestDate).toLocaleDateString('nl-NL', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {project.growthDuration && (
                <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-purple-200 rounded-full">
                      <Clock className="w-6 h-6 text-purple-700" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-purple-700 font-bold">Groeiduur</p>
                  </div>
                  <p className="font-bold text-lg text-gray-900 ml-11">
                    {project.growthDuration} dagen
                  </p>
                </div>
              )}
            </div>

            {/* Additional Details - Compacter */}
            {(project.soilType || project.plantDistance) && (
              <div className="mt-4 pt-4 border-t-2 border-emerald-200 print:mt-3 print:pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2">
                  {project.soilType && (
                    <div className="border-2 border-amber-200 rounded-xl p-5 bg-gradient-to-br from-amber-50 to-orange-50">
                      <p className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2">🌱 Grondsoort</p>
                      <p className="text-lg font-bold text-gray-900">{project.soilType}</p>
                    </div>
                  )}
                  {project.plantDistance && (
                    <div className="border-2 border-teal-200 rounded-xl p-5 bg-gradient-to-br from-teal-50 to-cyan-50">
                      <p className="text-xs uppercase tracking-wider text-teal-700 font-bold mb-2">📏 Plantafstand</p>
                      <p className="text-lg font-bold text-gray-900">{project.plantDistance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Growth Phases - Same format as recipes */}
          {sortedPhases.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 border-4 border-emerald-300">
              <div className="flex items-center mb-6 print:mb-4">
                <div className="h-px bg-emerald-300 flex-grow"></div>
                <h2 className="botanical-title text-xl sm:text-2xl font-bold text-emerald-900 px-4 print:text-xl">
                  ⏳ Groeifasen Tijdlijn
                </h2>
                <div className="h-px bg-emerald-300 flex-grow"></div>
              </div>

              <div className="relative">
                {/* Vertical timeline line */}
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 h-full rounded-full"></div>

                {sortedPhases.map((phaseNum, index) => {
                  const photos = growthPhases[Number(phaseNum)];
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div key={phaseNum} className={`relative mb-8 last:mb-0 print:mb-6 ${index > 0 && index % 2 === 0 ? 'print-page-break' : ''} print-avoid-break`}>
                      {/* Timeline dot - Kleiner */}
                      <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 -translate-y-3 items-center justify-center z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 border-3 border-white shadow-lg flex items-center justify-center">
                          <span className="text-white font-bold text-base">{Number(phaseNum) + 1}</span>
                        </div>
                      </div>

                      <div className={`md:grid md:grid-cols-2 md:gap-8 items-start ${isEven ? '' : 'md:flex-row-reverse'}`}>
                        {/* Phase info - Compacter */}
                        <div className={`${isEven ? 'md:text-right md:pr-8' : 'md:pl-8 md:col-start-2'} mb-4 md:mb-0 print:mb-3`}>
                          <div className={`inline-block ${isEven ? 'md:ml-auto' : 'md:mr-auto'} max-w-md`}>
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-4 shadow-lg print:p-3">
                              <div className="flex items-center mb-3 md:hidden">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold mr-3">
                                  {Number(phaseNum) + 1}
                                </div>
                                <h3 className="botanical-title text-xl font-bold text-emerald-800">
                                  {PHASE_NAMES[Number(phaseNum)] || `Fase ${Number(phaseNum) + 1}`}
                                </h3>
                              </div>
                              <h3 className="hidden md:block botanical-title text-xl font-bold text-emerald-800 mb-3">
                                {PHASE_NAMES[Number(phaseNum)] || `Fase ${Number(phaseNum) + 1}`}
                              </h3>
                              <p className="text-sm text-emerald-700 font-medium">
                                {photos.length} foto{photos.length !== 1 ? "'s" : ''} gedocumenteerd
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Phase photos - Compacter */}
                        <div className={`${isEven ? 'md:pl-8' : 'md:pr-8 md:col-start-1 md:row-start-1'}`}>
                          <div className="grid grid-cols-1 gap-3 print:gap-2">
                            {photos.map((photo, photoIndex) => (
                              <div 
                                key={photo.id} 
                                className="bg-white border-2 border-emerald-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                              >
                                <div className="relative w-full h-48 print:h-40">
                                  <Image
                                    src={photo.url}
                                    alt={photo.description || `Fase ${phaseNum}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute top-2 left-2 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                                    {photoIndex + 1}
                                  </div>
                                </div>
                                {photo.description && (
                                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-white border-t-2 border-emerald-100 print:p-2">
                                    <p className="text-sm text-gray-700 italic botanical-subtitle print:text-xs">
                                      "{photo.description}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Connection arrow for mobile */}
                      {index < sortedPhases.length - 1 && (
                        <div className="md:hidden flex justify-center my-6">
                          <ArrowRight className="w-6 h-6 text-emerald-500 transform rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timeline summary - Compacter */}
              <div className="mt-6 pt-4 border-t-2 border-emerald-200 print:mt-4 print:pt-3">
                <div className="bg-gradient-to-r from-emerald-100 via-green-100 to-emerald-100 rounded-xl p-4 border-2 border-emerald-300 print:p-3">
                  <div className="flex items-center justify-center space-x-4 text-emerald-800">
                    <CircleDot className="w-5 h-5" />
                    <p className="font-bold text-center">
                      {sortedPhases.length} groeifase{sortedPhases.length !== 1 ? 's' : ''} gedocumenteerd met totaal{' '}
                      {Object.values(growthPhases).reduce((sum, photos) => sum + photos.length, 0)} foto's
                    </p>
                    <CircleDot className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Photos - Same format as recipes */}
          {otherPhotos.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 print-avoid-break border-4 border-emerald-300">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-emerald-300 flex-grow"></div>
                <h2 className="botanical-title text-xl sm:text-2xl font-bold text-emerald-900 px-4 print:text-xl">
                  📸 Fotogalerij
                </h2>
                <div className="h-px bg-emerald-300 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 print:gap-2">
                {otherPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="relative group bg-white border-2 border-emerald-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
                  >
                    <div className="relative w-full h-40 print:h-32">
                      <Image
                        src={photo.url}
                        alt={`Extra foto ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-white font-bold text-xs">Foto {index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center print:mt-3">
                <p className="text-sm text-emerald-700 font-medium print:text-xs">
                  {otherPhotos.length} extra foto{otherPhotos.length !== 1 ? "'s" : ''} ter illustratie
                </p>
              </div>
            </div>
          )}

          {/* Notes - Same format as recipes */}
          {project.notes && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 print-avoid-break border-4 border-amber-300">
              <div className="flex items-center mb-4 print:mb-3">
                <div className="h-px bg-amber-300 flex-grow"></div>
                <h2 className="botanical-title text-xl sm:text-2xl font-bold text-amber-900 px-4 flex items-center print:text-xl">
                  <StickyNote className="w-5 h-5 mr-2 text-amber-600" />
                  Persoonlijke Notities
                </h2>
                <div className="h-px bg-amber-300 flex-grow"></div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200 shadow-inner print:p-4">
                <div className="relative">
                  <div className="absolute -top-3 -left-1 text-5xl text-amber-300 opacity-50 font-serif print:text-4xl">"</div>
                  <div className="relative z-10">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed botanical-subtitle text-base pl-6 print:text-sm print:pl-5">
                      {project.notes}
                    </p>
                  </div>
                  <div className="absolute -bottom-6 -right-1 text-5xl text-amber-300 opacity-50 font-serif print:text-4xl">"</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags - Same format as recipes */}
          {project.tags.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 print:p-5 print-avoid-break border-4 border-emerald-300">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-emerald-300 flex-grow"></div>
                <h2 className="botanical-title text-xl sm:text-2xl font-bold text-emerald-900 px-4 flex items-center print:text-xl">
                  <Tag className="w-5 h-5 mr-2 text-emerald-600" />
                  Labels & Kenmerken
                </h2>
                <div className="h-px bg-emerald-300 flex-grow"></div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center print:gap-1.5">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-800 rounded-full text-sm font-bold border-2 border-emerald-400 shadow-md hover:shadow-lg transition-all hover:scale-105 print:px-3 print:py-1.5 print:text-xs"
                  >
                    <span className="mr-2">🏷️</span>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Compacter */}
          <div className="text-center mt-8 mb-6 print:mt-6 print:mb-4 print-avoid-break">
            <div className="inline-flex items-center justify-center space-x-3 text-emerald-600 opacity-60">
              <Leaf className="w-5 h-5" />
              <div className="text-center">
                <p className="botanical-subtitle text-base text-emerald-800 print:text-sm">
                  Gedocumenteerd met zorg en passie
                </p>
                <p className="text-xs text-emerald-600 mt-1 print:text-xs">
                  HomeCheff Kweekdagboek
                </p>
              </div>
              <Flower className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


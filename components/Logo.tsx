'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  logoPath?: string; // Optioneel pad naar logo bestand
}

export default function Logo({ size = 'md', showText = true, className = '', logoPath }: LogoProps) {
  const router = useRouter();
  const { t, isReady } = useTranslation();
  
  // Logo afmetingen op basis van size (aangepast voor betere verhouding met tekst)
  const logoDimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 48, height: 48 },
    lg: { width: 56, height: 56 }
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl'
  };

  const isClickable = !className.includes('pointer-events-none');
  
  const handleClick = () => {
    if (isClickable) {
      try {
        router.push('/');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  // Probeer verschillende logo bestandsnamen
  const logoPaths = logoPath 
    ? [logoPath]
    : [
        '/logo.png',
        '/logo.svg',
        '/logo.webp',
        '/logo.jpg',
        '/homecheff-logo.png',
        '/homecheff-logo.svg',
        '/homecheff-logo.webp',
        '/homecheff-logo.jpg',
      ];

  // Gebruik het eerste beschikbare logo pad, of fallback naar SVG
  const useImageLogo = logoPaths[0];

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center space-x-2 sm:space-x-3 group ${isClickable ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Logo Image - probeer eerst afbeelding, fallback naar SVG */}
      {/* Responsive sizing: kleiner op mobiel, groter op desktop */}
      <div className={`relative flex-shrink-0 ${
        size === 'sm' ? 'w-9 h-9 sm:w-10 sm:h-9' :
        size === 'md' ? 'w-10 h-10 sm:w-12 sm:h-12' :
        'w-12 h-12 sm:w-14 sm:h-14'
      }`}>
        {useImageLogo ? (
          <Image
            src={useImageLogo}
            alt="HomeCheff Logo"
            width={logoDimensions[size].width}
            height={logoDimensions[size].height}
            className="object-contain w-full h-full"
            unoptimized={process.env.NODE_ENV === 'development'}
            priority
            sizes="(max-width: 640px) 40px, 48px"
            onError={(e) => {
              // Als afbeelding niet laadt, verberg het en gebruik fallback SVG
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback SVG Logo (alleen zichtbaar als afbeelding niet laadt) */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ display: useImageLogo ? 'none' : 'flex' }}>
          <svg
            viewBox="0 0 60 60"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Chef Character */}
            <g>
              {/* Chef Hat */}
              <path
                d="M15 10 Q20 5 25 10 L30 10 Q35 5 40 10 L40 20 Q40 25 35 25 L20 25 Q15 25 15 20 Z"
                fill="white"
                stroke="#1e40af"
                strokeWidth="2"
              />
              
              {/* Chef Body */}
              <rect
                x="22"
                y="25"
                width="16"
                height="30"
                fill="white"
                stroke="#1e40af"
                strokeWidth="2"
                rx="2"
              />
              
              {/* Chef Face */}
              <circle
                cx="30"
                cy="35"
                r="5"
                fill="white"
                stroke="#1e40af"
                strokeWidth="2"
              />
              
              {/* Eyes */}
              <circle cx="28" cy="33" r="1" fill="#1e40af" />
              <circle cx="32" cy="33" r="1" fill="#1e40af" />
              
              {/* Smile */}
              <path
                d="M26 37 Q30 40 34 37"
                stroke="#1e40af"
                strokeWidth="1.5"
                fill="none"
              />
              
              {/* Buttons */}
              <circle cx="30" cy="30" r="1" fill="#1e40af" />
              <circle cx="30" cy="35" r="1" fill="#1e40af" />
              
              {/* Spoon */}
              <rect
                x="5"
                y="30"
                width="15"
                height="3"
                fill="#22c55e"
                stroke="#1e40af"
                strokeWidth="1"
                rx="1"
              />
              <circle
                cx="5"
                cy="31.5"
                r="3"
                fill="#22c55e"
                stroke="#1e40af"
                strokeWidth="1"
              />
              
              {/* Globe */}
              <circle
                cx="45"
                cy="35"
                r="10"
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth="2"
              />
              <path
                d="M35 35 Q45 30 55 35 M35 35 Q45 40 55 35"
                stroke="#22c55e"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M45 25 Q50 35 45 45 M45 25 Q40 35 45 45"
                stroke="#22c55e"
                strokeWidth="1.5"
                fill="none"
              />
              
              {/* Steam from Globe */}
              <path
                d="M48 20 Q50 15 52 20 M50 18 Q52 13 54 18 M52 16 Q54 11 56 16"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Logo Text - alleen tonen als showText true is */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`${textSizes[size]} font-bold text-primary-700 dark:text-emerald-300 group-hover:text-primary-800 dark:group-hover:text-emerald-200 transition-all duration-300 tracking-tight`}>
            HomeCheff
          </span>
          {/* Subtitle - zichtbaar op alle schermen, maar kleiner op mobiel */}
          {isReady && t('logo.subtitle') && (
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 -mt-0.5 font-medium leading-tight">
              {t('logo.subtitle')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

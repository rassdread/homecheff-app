import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const router = useRouter();
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div 
      onClick={() => router.push('/')}
      className={`flex items-center space-x-3 group cursor-pointer ${className}`}
    >
      {/* Custom Chef Icon */}
      <div className={`${sizeClasses[size]} relative`}>
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
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-green-800 transition-all duration-300 tracking-tight`}>
            HomeCheff
          </span>
          <span className="text-xs text-gray-500 -mt-1 hidden sm:block">
            Lokale Culinaire Parels
          </span>
        </div>
      )}
    </div>
  );
}

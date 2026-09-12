/**
 * Distinct HomeCheff package illustrations — proportions convey physical size class.
 * Not carrier-branded; not identical icons.
 */

import type { ParcelPresetId } from '@/lib/shipping/package-presets';

export function PackageIllustration({
  presetId,
  className,
}: {
  presetId: ParcelPresetId;
  className?: string;
}) {
  if (presetId === 'BRIEVENBUS') {
    return (
      <svg viewBox="0 0 160 100" className={className} aria-hidden role="img">
        <rect x="0" y="0" width="160" height="100" fill="#F3F0EA" rx="10" />
        {/* flat mailbox envelope */}
        <rect
          x="18"
          y="38"
          width="124"
          height="28"
          rx="3"
          fill="#E8DFD0"
          stroke="#8B7355"
          strokeWidth="2"
        />
        <polyline
          points="18,38 80,58 142,38"
          fill="none"
          stroke="#8B7355"
          strokeWidth="2"
        />
        <line x1="28" y1="72" x2="132" y2="72" stroke="#C4B5A0" strokeWidth="1.5" />
      </svg>
    );
  }

  if (presetId === 'KLEIN') {
    return (
      <svg viewBox="0 0 160 100" className={className} aria-hidden role="img">
        <rect x="0" y="0" width="160" height="100" fill="#F3F0EA" rx="10" />
        {/* compact shoebox */}
        <path d="M55 58 L80 46 L105 58 L105 78 L80 90 L55 78 Z" fill="#DCC9A8" stroke="#7A5C2E" strokeWidth="2" />
        <path d="M55 58 L80 70 L105 58" fill="none" stroke="#7A5C2E" strokeWidth="1.5" />
        <path d="M80 70 L80 90" stroke="#C45C26" strokeWidth="3" />
      </svg>
    );
  }

  if (presetId === 'MIDDEL') {
    return (
      <svg viewBox="0 0 160 100" className={className} aria-hidden role="img">
        <rect x="0" y="0" width="160" height="100" fill="#F3F0EA" rx="10" />
        {/* standard shipping box */}
        <path d="M40 52 L80 32 L120 52 L120 78 L80 98 L40 78 Z" fill="#E0C9A0" stroke="#6B4F2A" strokeWidth="2" />
        <path d="M40 52 L80 72 L120 52" fill="none" stroke="#6B4F2A" strokeWidth="1.5" />
        <path d="M80 72 L80 98" stroke="#C45C26" strokeWidth="4" />
        <path d="M55 42 L105 42" stroke="#C45C26" strokeWidth="3" opacity="0.7" />
      </svg>
    );
  }

  if (presetId === 'GROOT') {
    return (
      <svg viewBox="0 0 160 100" className={className} aria-hidden role="img">
        <rect x="0" y="0" width="160" height="100" fill="#F3F0EA" rx="10" />
        {/* large carton */}
        <path d="M28 48 L80 22 L132 48 L132 82 L80 108 L28 82 Z" fill="#D4B88A" stroke="#5C4020" strokeWidth="2" />
        <path d="M28 48 L80 74 L132 48" fill="none" stroke="#5C4020" strokeWidth="1.5" />
        <path d="M80 74 L80 108" stroke="#C45C26" strokeWidth="5" />
        <rect x="68" y="40" width="24" height="14" rx="2" fill="#F7F1E8" stroke="#5C4020" strokeWidth="1" opacity="0.9" />
      </svg>
    );
  }

  // CUSTOM — dashed outline
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden role="img">
      <rect x="0" y="0" width="160" height="100" fill="#F3F0EA" rx="10" />
      <rect
        x="45"
        y="28"
        width="70"
        height="50"
        rx="4"
        fill="none"
        stroke="#8B7355"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <text
        x="80"
        y="58"
        textAnchor="middle"
        fontSize="18"
        fill="#8B7355"
        fontFamily="system-ui,sans-serif"
      >
        +
      </text>
    </svg>
  );
}

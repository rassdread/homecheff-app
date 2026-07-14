'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const ORBIT_RADIUS_PX = 110;
const ORBIT_SATELLITES = [
  { labelKey: 'heroOrbitHomeCheff', emoji: '🍲', angle: -90 },
  { labelKey: 'heroOrbitHomeGarden', emoji: '🌱', angle: -30 },
  { labelKey: 'heroOrbitHomeDesigner', emoji: '🎨', angle: 30 },
  { labelKey: 'heroOrbitChores', emoji: '🔧', angle: 90 },
  { labelKey: 'heroOrbitBarter', emoji: '⇄', angle: 150 },
  { labelKey: 'heroOrbitInspiration', emoji: '✨', angle: 210 },
] as const;

const GLOBEMAN_SRC = '/homecheff-globeman.png';

function orbitSatelliteStyle(angleDeg: number): CSSProperties {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.cos(rad) * ORBIT_RADIUS_PX;
  const y = Math.sin(rad) * ORBIT_RADIUS_PX;
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: 'translate(-50%, -50%)',
  };
}

/** Desktop hero orbit visual — deferred from critical homepage path (Phase 3F Wave 2). */
export default function HomeHeroVisualCluster() {
  const { t } = useTranslation();

  return (
    <div
      className="hidden lg:flex items-center justify-center self-center shrink-0 py-0 pr-2 xl:pr-6 pointer-events-none select-none overflow-visible"
      aria-hidden
    >
      <div className="hc-hero-orbit-stage">
        <svg className="hc-hero-orbit-ring" viewBox="0 0 280 280" aria-hidden>
          <circle
            cx="140"
            cy="140"
            r={ORBIT_RADIUS_PX}
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.22"
          />
        </svg>
        <div className="hc-hero-orbit-center">
          <Image
            src={GLOBEMAN_SRC}
            alt=""
            width={128}
            height={128}
            className="h-32 w-32 object-contain drop-shadow-lg"
            priority
            unoptimized
          />
        </div>
        {ORBIT_SATELLITES.map(({ labelKey, emoji, angle }) => (
          <div
            key={labelKey}
            className="hc-hero-orbit-satellite-wrap"
            style={orbitSatelliteStyle(angle)}
          >
            <span className="hc-hero-orbit-satellite-icon hc-float-slow" aria-hidden>
              {emoji}
            </span>
            <span className="hc-hero-orbit-satellite-label">
              {t(`homePhase1.${labelKey}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

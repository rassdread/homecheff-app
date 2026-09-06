/**
 * Simple original HomeCheff package illustrations (SVG) — not carrier-branded.
 */

import type { ParcelPresetId } from '@/lib/shipping/package-presets';

export function PackageIllustration({
  presetId,
  className,
}: {
  presetId: ParcelPresetId;
  className?: string;
}) {
  const dims =
    presetId === 'BRIEVENBUS'
      ? { w: 120, h: 40 }
      : presetId === 'KLEIN'
        ? { w: 70, h: 55 }
        : presetId === 'MIDDEL'
          ? { w: 90, h: 70 }
          : presetId === 'GROOT'
            ? { w: 110, h: 85 }
            : { w: 80, h: 60 };

  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      aria-hidden
      role="img"
    >
      <rect x="0" y="0" width="160" height="120" fill="#F7F1E8" rx="8" />
      {/* package */}
      <rect
        x={(160 - dims.w) / 2}
        y={(120 - dims.h) / 2 - 4}
        width={dims.w}
        height={dims.h}
        fill="#E8D5B5"
        stroke="#8B6914"
        strokeWidth="2"
        rx="3"
      />
      {/* tape */}
      <rect
        x={(160 - dims.w) / 2 + dims.w / 2 - 4}
        y={(120 - dims.h) / 2 - 4}
        width="8"
        height={dims.h}
        fill="#C45C26"
        opacity="0.85"
      />
      {/* dimension arrows */}
      <line
        x1={(160 - dims.w) / 2}
        y1={(120 + dims.h) / 2 + 10}
        x2={(160 + dims.w) / 2}
        y2={(120 + dims.h) / 2 + 10}
        stroke="#333"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        markerStart="url(#arrow)"
      />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="1.5" fill="#333" />
        </marker>
      </defs>
      <text
        x="80"
        y="112"
        textAnchor="middle"
        fontSize="9"
        fill="#444"
        fontFamily="system-ui,sans-serif"
      >
        HomeCheff pakket
      </text>
    </svg>
  );
}

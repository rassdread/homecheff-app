import { ImageResponse } from 'next/og';
import { ecosystemOgTheme } from '@/lib/share/og-opportunity';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Zo verdien je met HomeCheff';

/** /werken-bij/hoe-werkt-het social preview */
export default function HoeWerktHetOpenGraphImage() {
  const theme = ecosystemOgTheme('ecosystem');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: theme.gradient,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, opacity: 0.9, fontWeight: 600 }}>HomeCheff</div>
          <div style={{ fontSize: 56, fontWeight: 700, marginTop: 16, lineHeight: 1.15 }}>
            Zo verdien je met HomeCheff
          </div>
          <div style={{ fontSize: 26, opacity: 0.92, marginTop: 20, maxWidth: 900 }}>
            Platformfees, affiliatevergoedingen en uitbetaling — duidelijk uitgelegd
          </div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.9 }}>homecheff.eu/werken-bij/hoe-werkt-het</div>
      </div>
    ),
    { ...size },
  );
}

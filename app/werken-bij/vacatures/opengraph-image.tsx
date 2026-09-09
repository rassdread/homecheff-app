import { ImageResponse } from 'next/og';
import { getOpportunityShareCopy } from '@/lib/share/opportunity-share-copy';
import { ecosystemOgTheme } from '@/lib/share/og-opportunity';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Werken bij HomeCheff';

export default function VacaturesOpenGraphImage() {
  const copy = getOpportunityShareCopy('jobs', 'nl');
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
          <div style={{ fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.92, fontWeight: 600 }}>
            {theme.brandLabel}
          </div>
          <div style={{ fontSize: 58, fontWeight: 750, lineHeight: 1.1, marginTop: 16 }}>
            {copy.ogHeadline}
          </div>
          <div style={{ fontSize: 28, opacity: 0.95, marginTop: 20 }}>{copy.ogSubline}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.9 }}>homecheff.eu/werken-bij/vacatures</div>
      </div>
    ),
    { ...size },
  );
}

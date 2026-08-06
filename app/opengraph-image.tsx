import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default Open Graph / social preview — neighbourhood marketplace identity. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(135deg, #065f46 0%, #047857 45%, #0f766e 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.9 }}>
          HomeCheff
        </div>
        <div style={{ fontSize: 64, fontWeight: 750, marginTop: 18, lineHeight: 1.1, maxWidth: 980 }}>
          Digital neighbourhood marketplace
        </div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.92, maxWidth: 980, lineHeight: 1.35 }}>
          Nearby cook · grow · make · repair · design · teach · help · trade
        </div>
      </div>
    ),
    { ...size },
  );
}

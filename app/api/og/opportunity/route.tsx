import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import type { OpportunityId } from '@/lib/share/ecosystem-opportunities';
import { getOpportunityShareCopy } from '@/lib/share/opportunity-share-copy';
import { ecosystemOgTheme, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/share/og-opportunity';

export const runtime = 'edge';

const VALID: OpportunityId[] = [
  'hub',
  'seller',
  'delivery_individual',
  'delivery_company',
  'affiliate',
  'affiliate_company',
  'studio',
  'growth',
  'jobs',
];

export async function GET(req: NextRequest) {
  const idRaw = req.nextUrl.searchParams.get('id') || 'hub';
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'nl';
  const id = (VALID.includes(idRaw as OpportunityId) ? idRaw : 'hub') as OpportunityId;
  const copy = getOpportunityShareCopy(id, lang);
  const theme = ecosystemOgTheme(copy.ecosystem);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: 0.92,
              fontWeight: 600,
            }}
          >
            {theme.brandLabel}
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 750,
              lineHeight: 1.1,
              maxWidth: 980,
              marginTop: 8,
            }}
          >
            {copy.ogHeadline}
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.95,
              maxWidth: 920,
              lineHeight: 1.35,
              marginTop: 16,
            }}
          >
            {copy.ogSubline}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            opacity: 0.9,
          }}
        >
          <span>homecheff.eu</span>
          <span style={{ fontSize: 20, opacity: 0.85 }}>
            {copy.ecosystem === 'studio'
              ? 'Studio'
              : copy.ecosystem === 'growth'
                ? 'Growth'
                : copy.ecosystem === 'ecosystem'
                  ? 'Ecosysteem'
                  : 'Marketplace'}
          </span>
        </div>
      </div>
    ),
    { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT },
  );
}

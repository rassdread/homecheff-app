import React from 'react';
import Link from 'next/link';

export type SponsoredCardModel = {
  listingId: string;
  href: string;
  title: string;
  businessName: string;
  place: string | null;
  distanceLabel: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
  disclosure: string;
  whyLabel: string;
  whyText: string;
  cta: string;
};

const cardStyle = {
  boxSizing: 'border-box' as const,
  width: '100%',
  maxWidth: '36rem',
  minWidth: 0,
  marginInline: 'auto',
  border: '1px solid #e7e5e4',
  borderRadius: '1rem',
  background: '#FFFBF5',
  color: '#243044',
  padding: '0.75rem',
  overflow: 'hidden',
};

const labelStyle = {
  margin: 0,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  color: '#57534e',
};

const titleStyle = {
  margin: 0,
  fontSize: '0.875rem',
  fontWeight: 650,
  lineHeight: 1.35,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  maxWidth: '100%',
  overflow: 'hidden',
  overflowWrap: 'anywhere' as const,
};

const metaStyle = {
  margin: '0.15rem 0 0',
  fontSize: '0.75rem',
  lineHeight: 1.4,
  color: '#57534e',
  overflowWrap: 'anywhere' as const,
};

const whyStyle = {
  marginTop: '0.5rem',
  fontSize: '0.75rem',
  lineHeight: 1.45,
  color: '#57534e',
  overflowWrap: 'anywhere' as const,
};

const ctaStyle = {
  marginTop: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '2.75rem',
  padding: '0 0.75rem',
  borderRadius: '0.75rem',
  background: '#3C5A78',
  color: '#fff',
  fontSize: '0.875rem',
  fontWeight: 650,
  textDecoration: 'none',
};

/** Presentational sponsored card. No fetch, no analytics, no private fields. */
export default function SponsoredRecommendationCard({
  item,
  onCtaClick,
}: {
  item: SponsoredCardModel;
  onCtaClick?: () => void;
}) {
  const meta = [item.place, item.distanceLabel, item.priceLabel].filter(Boolean).join(' · ');
  return (
    <article
      data-hc-sponsored-recommendation=""
      data-listing-sponsored={item.listingId}
      className="col-span-full"
      style={cardStyle}
    >
      <p data-hc-sponsored-disclosure="" style={labelStyle}>
        {item.disclosure}
      </p>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', minWidth: 0 }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            style={{
              height: '4rem',
              width: '4rem',
              flexShrink: 0,
              borderRadius: '0.75rem',
              objectFit: 'cover',
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <h3 style={titleStyle}>{item.title}</h3>
          <p style={metaStyle}>{item.businessName}</p>
          {meta ? <p style={metaStyle}>{meta}</p> : null}
        </div>
      </div>
      <details style={whyStyle}>
        <summary style={{ cursor: 'pointer', fontWeight: 650 }}>{item.whyLabel}</summary>
        <p style={{ margin: '0.35rem 0 0' }}>{item.whyText}</p>
      </details>
      <Link href={item.href} onClick={onCtaClick} style={ctaStyle}>
        {item.cta}
      </Link>
    </article>
  );
}

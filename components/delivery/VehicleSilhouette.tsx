import type { VehicleFamily } from '@/lib/delivery/courier-vehicles';

type Kind =
  | 'bike'
  | 'ebike'
  | 'cargo-bike'
  | 'bike-trailer'
  | 'moped'
  | 'scooter'
  | 'delivery-scooter'
  | 'hatchback'
  | 'sedan'
  | 'wagon'
  | 'van-small'
  | 'van-medium'
  | 'van-large'
  | 'moving';

function kindFor(family: VehicleFamily, variant?: string | null): Kind {
  if (family === 'BIKE' || family === 'EBIKE') {
    if (variant === 'CARGO') return 'cargo-bike';
    if (variant === 'WITH_TRAILER') return 'bike-trailer';
    return family === 'EBIKE' ? 'ebike' : 'bike';
  }
  if (family === 'SCOOTER') {
    if (variant === 'MOPED') return 'moped';
    if (variant === 'DELIVERY') return 'delivery-scooter';
    return 'scooter';
  }
  if (family === 'CAR') {
    if (variant === 'SEDAN') return 'sedan';
    if (variant === 'STATION') return 'wagon';
    return 'hatchback';
  }
  if (variant === 'SMALL') return 'van-small';
  if (variant === 'LARGE') return 'van-large';
  if (variant === 'MOVING') return 'moving';
  return 'van-medium';
}

function Wheel({ cx, r = 4.2 }: { cx: number; r?: number }) {
  return <circle cx={cx} cy={27} r={r} fill="none" stroke="currentColor" strokeWidth="1.7" />;
}

export function VehicleSilhouette({
  family,
  variant,
  className,
}: {
  family: VehicleFamily;
  variant?: string | null;
  className?: string;
}) {
  const kind = kindFor(family, variant);
  return (
    <svg viewBox="0 0 72 36" className={className} aria-hidden>
      {kind === 'bike' || kind === 'ebike' ? (
        <>
          <Wheel cx={16} />
          <Wheel cx={54} />
          <path d="M22 27 L32 14 H46 L50 27 M32 14 L26 9 M46 14 L52 10 H58" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
          {kind === 'ebike' ? <rect x="33" y="16" width="8" height="4.5" rx="1" fill="currentColor" /> : null}
        </>
      ) : null}
      {kind === 'cargo-bike' ? (
        <>
          <Wheel cx={14} r={3.4} />
          <Wheel cx={56} />
          <path d="M8 18 H22 V26 H10 Z M18 26 L30 14 H48 L52 27" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === 'bike-trailer' ? (
        <>
          <Wheel cx={14} />
          <Wheel cx={40} />
          <Wheel cx={64} r={3.2} />
          <path d="M20 27 L28 15 H36 L38 27 M44 24 H66 V18 H48 Z M40 24 H48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === 'moped' ? (
        <>
          <Wheel cx={16} />
          <Wheel cx={54} />
          <path d="M20 26 L28 16 H40 L48 26 M28 16 L24 10 M40 16 L46 12 H54" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === 'scooter' || kind === 'delivery-scooter' ? (
        <>
          <Wheel cx={15} r={4.4} />
          <Wheel cx={52} r={4.4} />
          <path d="M18 22 H36 L42 16 H34 L28 16 L22 10 H16 L14 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M38 16 H50 L54 20 H40 Z" fill="currentColor" />
          {kind === 'delivery-scooter' ? <path d="M54 22 H68 V12 H56 Z" fill="currentColor" /> : null}
        </>
      ) : null}
      {kind === 'hatchback' ? (
        <>
          <Wheel cx={20} />
          <Wheel cx={52} />
          <path d="M8 24 H14 L18 16 H36 L44 12 H54 L62 18 V24 H56" fill="currentColor" />
        </>
      ) : null}
      {kind === 'sedan' ? (
        <>
          <Wheel cx={18} />
          <Wheel cx={52} />
          <path d="M6 24 H12 L16 18 H30 L36 12 H48 L54 18 H66 V24 H56" fill="currentColor" />
        </>
      ) : null}
      {kind === 'wagon' ? (
        <>
          <Wheel cx={18} />
          <Wheel cx={54} />
          <path d="M6 24 H12 L16 16 H32 L38 12 H64 V24 H58" fill="currentColor" />
        </>
      ) : null}
      {kind === 'van-small' ? (
        <>
          <Wheel cx={18} r={3.6} />
          <Wheel cx={40} r={3.6} />
          <path d="M8 26 H14 L17 18 H26 L29 15 H46 V26 Z" fill="currentColor" />
        </>
      ) : null}
      {kind === 'van-medium' ? (
        <>
          <Wheel cx={16} />
          <Wheel cx={56} />
          <path d="M4 26 H12 L16 17 H28 L32 14 H68 V26 Z" fill="currentColor" />
        </>
      ) : null}
      {kind === 'van-large' ? (
        <>
          <Wheel cx={18} />
          <Wheel cx={56} />
          <path d="M6 26 H12 L16 16 H26 L30 5 H68 V26 Z" fill="currentColor" />
        </>
      ) : null}
      {kind === 'moving' ? (
        <>
          <Wheel cx={14} r={3.6} />
          <Wheel cx={40} />
          <Wheel cx={58} />
          <path d="M3 26 H8 L12 17 H22 V26 Z M28 26 V8 H68 V26 Z" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

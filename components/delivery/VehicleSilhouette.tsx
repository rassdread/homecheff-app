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
    if (variant === 'SCOOTER') return 'scooter';
    if (variant === 'DELIVERY') return 'delivery-scooter';
    return 'moped';
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

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function BikeArt({ battery = false }: { battery?: boolean }) {
  return (
    <>
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
      {battery ? (
        <>
          <rect x="3.1" y="8.3" width="4.2" height="3.2" rx="0.4" fill="white" strokeWidth="1.4" />
          <path d="M3.9 8.3v-1h1.5" strokeWidth="1.4" />
        </>
      ) : null}
    </>
  );
}

function CarArt() {
  return (
    <>
      <path d="M4.2 16.6V7.8H12.2L15.8 12.4l3.2 1.2V16.6" />
      <path d="M5.2 12.4H15.4" />
      <path d="M9 7.8V12.4" />
      <circle cx="7.4" cy="18.2" r="1.7" />
      <path d="M9.1 18.2h5.2" />
      <circle cx="16" cy="18.2" r="1.7" />
    </>
  );
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
    <svg {...svgProps} className={className}>
      {kind === 'bike' || kind === 'ebike' ? <BikeArt battery={kind === 'ebike'} /> : null}
      {kind === 'cargo-bike' ? (
        <>
          <BikeArt />
          <path d="M15.2 8.2h5.2v3.4h-4.2z" />
        </>
      ) : null}
      {kind === 'bike-trailer' ? (
        <>
          <circle cx="15.2" cy="17.5" r="2.6" />
          <circle cx="5.2" cy="17.5" r="2.6" />
          <circle cx="12.2" cy="6.2" r="0.8" />
          <path d="M10 17.5V14.6l-2.2-2.2 3-2.2 1.5 2.2h1.4" />
          <path d="M17.6 17.5H20" />
          <circle cx="21.2" cy="17.5" r="1.5" />
          <path d="M18.4 14.2h3.2v2.6h-2.4z" />
        </>
      ) : null}
      {kind === 'moped' ? (
        <>
          <circle cx="5.2" cy="18.2" r="1.7" />
          <circle cx="18.6" cy="18.2" r="1.7" />
          <path d="M6.9 18.2V13.6H15.6L18.6 18.2" />
          <path d="M4.4 9.4H9.2" />
          <path d="M7.2 13.6V9.4" />
          <path d="M14.4 13.6V11L16.8 6.6" />
          <path d="M15.2 6.6H18.6" />
        </>
      ) : null}
      {kind === 'scooter' ? (
        <>
          <circle cx="5.5" cy="17.5" r="2.3" />
          <circle cx="18.5" cy="17.5" r="2.3" />
          <path d="M7.6 17.5 11 14.6h5.2L18.5 9.2V6.6M16.2 14.6 14.4 8.4h3.2" />
        </>
      ) : null}
      {kind === 'delivery-scooter' ? (
        <>
          <circle cx="5.5" cy="17.5" r="2.3" />
          <circle cx="18.5" cy="17.5" r="2.3" />
          <path d="M7.6 17.5 11 14.6h5.2L18.5 9.2V6.6M16.2 14.6 14.6 9.6" />
          <path d="M8.2 8.4h5.2v4.2H9.2z" />
        </>
      ) : null}
      {kind === 'hatchback' ? <CarArt /> : null}
      {kind === 'sedan' ? (
        <>
          <path d="M20.2 17h1c.4 0 .8-.4.8-.9v-1.8c0-.3-.1-.6-.4-.8l-1.5-1.1c-.3-.2-.6-.3-1-.3H15l-1.3-2.5c-.3-.5-.8-.8-1.4-.8H8.2c-.5 0-1 .3-1.3.8L5.4 11.2c-.2.4-.4.7-.4 1.1V16c0 .6.4 1 1 1h1.2" />
          <circle cx="7.2" cy="17" r="2" />
          <path d="M9.2 17h5.6" />
          <circle cx="16.8" cy="17" r="2" />
        </>
      ) : null}
      {kind === 'wagon' ? (
        <>
          <path d="M19.2 17H21c.6 0 1-.4 1-1V11c0-.6-.4-1-1-1h-4.6l-1.1-2.6c-.3-.6-.8-.9-1.4-.9H6.2c-.6 0-1.1.4-1.4.9L3.4 11c-.2.4-.4.8-.4 1.2V16c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </>
      ) : null}
      {kind === 'van-small' ? (
        <>
          <path d="M14.2 17h1c.5 0 .8-.4.8-.9V13c0-.4-.2-.7-.5-.9L14.4 10.8 13.2 8.8c-.3-.5-.8-.8-1.3-.8H6.2c-.5 0-1 .3-1.2.8L3.6 11.2c-.2.4-.3.7-.3 1.1V16c0 .6.4 1 1 1h1.4" />
          <circle cx="6.4" cy="17" r="2" />
          <path d="M8.4 17h3.6" />
          <circle cx="14" cy="17" r="2" />
          <path d="M5 11.2V9.2H7.2" />
        </>
      ) : null}
      {kind === 'van-medium' ? (
        <>
          <path d="M3.2 16.6V5H11.8V8.6H14.4L17.2 11.2H20.2V16.6" />
          <circle cx="7.4" cy="18.2" r="1.7" />
          <path d="M9.1 18.2h6" />
          <circle cx="16.8" cy="18.2" r="1.7" />
        </>
      ) : null}
      {kind === 'van-large' ? (
        <>
          <path d="M18.4 17H21c.6 0 1-.4 1-1V6.2c0-.5-.4-.9-1-.9H6.2c-.6 0-1.1.4-1.4.9L3.4 10.4c-.2.4-.4.8-.4 1.2V16c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6.2" />
          <circle cx="17.2" cy="17" r="2" />
          <path d="M5.2 10.6V8.2H8.4" />
        </>
      ) : null}
      {kind === 'moving' ? (
        <>
          <path d="M7.6 17H6.2c-.5 0-.8-.4-.8-.9V13c0-.3.1-.6.4-.8L7 10.6h2.2V17" />
          <path d="M11.4 17V7.2h8.2c.6 0 1 .4 1 1V16c0 .6-.4 1-1 1h-1.2" />
          <circle cx="5" cy="17" r="1.7" />
          <circle cx="13.6" cy="17" r="2" />
          <circle cx="18.6" cy="17" r="2" />
        </>
      ) : null}
    </svg>
  );
}

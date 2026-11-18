import type { ReactNode } from 'react';
import type { VehicleFamily } from '@/lib/delivery/courier-vehicles';

type Kind =
  | 'bike'
  | 'ebike'
  | 'cargo-bike'
  | 'cargo-ebike'
  | 'bike-trailer'
  | 'ebike-trailer'
  | 'moped'
  | 'scooter'
  | 'delivery-scooter'
  | 'hatchback'
  | 'sedan'
  | 'wagon'
  | 'van-small'
  | 'van-medium'
  | 'van-large'
  | 'moving'
  | 'trailer';

const WHEEL_Y = 31;

function kindFor(family: VehicleFamily, variant?: string | null): Kind {
  if (family === 'BIKE' || family === 'EBIKE') {
    if (variant === 'CARGO') return family === 'EBIKE' ? 'cargo-ebike' : 'cargo-bike';
    if (variant === 'WITH_TRAILER') return family === 'EBIKE' ? 'ebike-trailer' : 'bike-trailer';
    return family === 'EBIKE' ? 'ebike' : 'bike';
  }
  if (family === 'SCOOTER') {
    if (variant === 'SCOOTER') return 'scooter';
    if (variant === 'DELIVERY') return 'delivery-scooter';
    return 'moped';
  }
  if (family === 'CAR') {
    if (variant === 'SEDAN') return 'sedan';
    if (variant === 'STATION') return 'wagon';
    return 'hatchback';
  }
  if (family === 'TRAILER') return 'trailer';
  if (variant === 'SMALL') return 'van-small';
  if (variant === 'LARGE') return 'van-large';
  if (variant === 'MOVING') return 'moving';
  return 'van-medium';
}

export function silhouetteForMode(mode: string): { family: VehicleFamily; variant: string | null } {
  switch (mode) {
    case 'EBIKE':
      return { family: 'EBIKE', variant: 'ORDINARY' };
    case 'SCOOTER':
      return { family: 'SCOOTER', variant: 'SCOOTER' };
    case 'CAR':
      return { family: 'CAR', variant: 'HATCHBACK' };
    case 'ESTATE':
      return { family: 'CAR', variant: 'STATION' };
    case 'VAN':
      return { family: 'BUS', variant: 'MEDIUM' };
    case 'BOX_TRUCK':
      return { family: 'BUS', variant: 'MOVING' };
    case 'TRAILER':
      return { family: 'TRAILER', variant: null };
    default:
      return { family: 'BIKE', variant: 'ORDINARY' };
  }
}

function num(value: number) {
  return (Math.round(value * 100) / 100).toString();
}

function circle(cx: number, cy: number, r: number) {
  return `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(r * 2)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-r * 2)} 0z`;
}

function tube(x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  return `M${num(x1 + nx)} ${num(y1 + ny)}L${num(x2 + nx)} ${num(y2 + ny)}L${num(x2 - nx)} ${num(y2 - ny)}L${num(x1 - nx)} ${num(y1 - ny)}z`;
}

function rounded(x: number, y: number, w: number, h: number, r = 1.5) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${num(x + rr)} ${num(y)}H${num(x + w - rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(x + w)} ${num(y + rr)}V${num(y + h - rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(x + w - rr)} ${num(y + h)}H${num(x + rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(x)} ${num(y + h - rr)}V${num(y + rr)}A${num(rr)} ${num(rr)} 0 0 1 ${num(x + rr)} ${num(y)}z`;
}

function fender(cx: number, cy: number, outer: number, inner: number) {
  return `M${num(cx - outer)} ${num(cy)}A${num(outer)} ${num(outer)} 0 0 1 ${num(cx + outer)} ${num(cy)}L${num(cx + inner)} ${num(cy)}A${num(inner)} ${num(inner)} 0 0 0 ${num(cx - inner)} ${num(cy)}Z`;
}

function Ring({ cx, cy, r, hole }: { cx: number; cy: number; r: number; hole: number }) {
  return <path fill="currentColor" fillRule="evenodd" d={circle(cx, cy, r) + circle(cx, cy, hole)} />;
}

function Solid({ d }: { d: string }) {
  return <path fill="currentColor" d={d} />;
}

function Cutout({ outer, holes }: { outer: string; holes: string }) {
  return <path fill="currentColor" fillRule="evenodd" d={outer + holes} />;
}

function CityBike({ step = false, battery = false }: { step?: boolean; battery?: boolean }) {
  const rear = 18;
  const front = 78;
  const bb = 46;
  const y = 31.2;
  return (
    <>
      <Ring cx={rear} cy={y} r={8.2} hole={3.3} />
      <Ring cx={front} cy={y} r={8.2} hole={3.3} />
      <Ring cx={bb} cy={30.2} r={5.3} hole={2.2} />
      <Solid
        d={[
          fender(rear, y, 11.2, 8.5),
          fender(front, y, 11.2, 8.5),
          tube(rear + 2, y, bb - 5, 30, 5.2),
          tube(rear + 7, 23, rear + 16, 14.2, 4.6),
          tube(rear + 16, 13.6, bb, 27.6, 5),
          tube(bb - 9, 18, bb - 1, 27.2, 4.6),
          tube(bb + 15, 16.2, front - 2, 27.4, 4.8),
          tube(bb + 13, 16.4, bb + 21, 7.6, 4),
          tube(bb + 17, 7.6, bb + 28, 6.6, 3.8),
          tube(rear + 6, 12.2, rear + 20, 11.8, 4.4),
          circle(rear + 8, 12, 2.6),
          step ? '' : tube(rear + 16, 15, bb + 15, 16.2, 4.8),
          battery ? rounded(bb - 12, 18.4, 16, 8.2, 1.8) : '',
        ].join('')}
      />
    </>
  );
}

function CargoBike({ battery = false }: { battery?: boolean }) {
  return (
    <>
      <Ring cx={15} cy={WHEEL_Y} r={7.2} hole={3} />
      <Ring cx={83} cy={WHEEL_Y} r={7.2} hole={3} />
      <Cutout outer={rounded(34, 10.5, 34, 16.5, 2)} holes={rounded(40, 13.5, 16, 6.2, 1)} />
      <Solid
        d={[
          tube(17, 30, 36, 22, 3.8),
          tube(22, 18, 34, 14, 3.4),
          tube(18, 14.2, 30, 13.6, 3.4),
          tube(66, 18, 83, 29, 3.6),
          tube(30, 14, 40, 8.2, 3),
          tube(36, 8.2, 46, 7.2, 2.8),
          battery ? rounded(48, 20, 12, 6.4, 1.4) : '',
        ].join('')}
      />
    </>
  );
}

function BikeTrailer({ battery = false }: { battery?: boolean }) {
  return (
    <>
      <Ring cx={13} cy={32.4} r={5.2} hole={2.15} />
      <Ring cx={52} cy={WHEEL_Y} r={6.6} hole={2.7} />
      <Ring cx={84} cy={WHEEL_Y} r={6.6} hole={2.7} />
      <Solid d={rounded(2, 15, 26, 13, 1.6)} />
      <Solid
        d={[
          tube(28, 22, 44, 28, 2.6),
          tube(54, 30, 68, 30, 3.2),
          tube(56, 16, 68, 28.5, 3.2),
          tube(68, 16.2, 83, 29, 3.2),
          tube(66, 16, 74, 9, 2.8),
          tube(70, 9, 80, 8, 2.6),
          tube(48, 15, 60, 14.4, 3),
          battery ? rounded(58, 18, 10, 5.5, 1.2) : '',
        ].join('')}
      />
    </>
  );
}

function Moped() {
  return (
    <>
      <Ring cx={20} cy={WHEEL_Y} r={5.6} hole={2.25} />
      <Ring cx={78} cy={WHEEL_Y} r={5.6} hole={2.25} />
      <Solid
        d={[
          'M23 29.5 L30 18.5 Q38 14.5 50 14.5 L60 15 L68 19 L58 26.5 L72 24 L80 14 L87 16.5 L85 30.2 L22 30.2 Z',
          rounded(33, 20, 16, 6.4, 1.3),
          tube(58, 16, 72, 8.6, 3.2),
          tube(66, 8.6, 78, 7.4, 3),
          tube(32, 16, 52, 15, 3.4),
        ].join('')}
      />
    </>
  );
}

function Scooter({ box = false }: { box?: boolean }) {
  return (
    <>
      <Ring cx={box ? 34 : 24} cy={WHEEL_Y} r={box ? 5.2 : 5.3} hole={box ? 2.1 : 2.15} />
      <Ring cx={box ? 80 : 76} cy={WHEEL_Y} r={box ? 5.2 : 5.3} hole={box ? 2.1 : 2.15} />
      <Solid
        d={
          box
            ? [
                rounded(2, 12, 22, 15, 1.8),
                'M34 29 L40 18 L54 16 L62 13.2 L70 17.5 L78 13 L86 15.5 L84 30 L70 30 L64 22.5 L38 24.5 Z',
                tube(62, 14.5, 74, 8, 2.8),
                tube(70, 8, 80, 7, 2.6),
                tube(42, 16.2, 58, 14.6, 3.2),
              ].join('')
            : [
                'M22 29 C24 21 32 17 42 16.5 L52 15.2 L60 12 L68 12.5 L72 18 L64 22.5 L76 15 L84 13 L88 17 L86 30 L72 30 L66 23.5 L32 25.5 L26 30 Z',
                tube(64, 14, 76, 7.2, 3),
                tube(72, 7.2, 82, 6.4, 2.8),
                tube(38, 15.6, 56, 13.6, 3.6),
              ].join('')
        }
      />
    </>
  );
}

function Car({ outer, windows, wheels }: { outer: string; windows: string; wheels: Array<[number, number]> }) {
  const arches = wheels.map(([cx]) => circle(cx, WHEEL_Y, 7)).join('');
  return (
    <>
      <Cutout outer={outer} holes={arches + windows} />
      {wheels.map(([cx, r]) => (
        <Ring key={cx} cx={cx} cy={WHEEL_Y} r={r} hole={2.55} />
      ))}
    </>
  );
}

const ART: Record<Kind, ReactNode> = {
  bike: <CityBike />,
  ebike: <CityBike step battery />,
  'cargo-bike': <CargoBike />,
  'cargo-ebike': <CargoBike battery />,
  'bike-trailer': <BikeTrailer />,
  'ebike-trailer': <BikeTrailer battery />,
  moped: <Moped />,
  scooter: <Scooter />,
  'delivery-scooter': <Scooter box />,
  hatchback: (
    <Car
      outer="M14 30.6 L16 20.5 Q22 12 34 11.2 L50 11 Q60 11.4 68 16.8 L78 21 Q88 24 88.5 30.6 Z"
      windows="M34 14 L48 13.6 L56 18.4 L32 18.8 Z M60 15.4 L70 18.6 L58 19.4 Z"
      wheels={[[30, 6.4], [72, 6.4]]}
    />
  ),
  sedan: (
    <Car
      outer="M7 30.6 L9 22.5 Q16 16.2 28 16 L36 16 L44 10.8 L58 10.8 L66 16 L76 16.2 Q88 17 90 24.5 L90 30.6 Z"
      windows="M42 13 L56 13 L62 16.8 L40 16.8 Z"
      wheels={[[28, 6.4], [74, 6.4]]}
    />
  ),
  wagon: (
    <Car
      outer="M7 30.6 L9 15.5 Q14 9.5 22 9.5 L62 9.5 L70 15.8 L80 16.6 Q90 18 90 26.5 L90 30.6 Z"
      windows="M24 12.4 L58 12.4 L64 16.6 L20 16.6 Z"
      wheels={[[28, 6.4], [74, 6.4]]}
    />
  ),
  'van-small': (
    <Car
      outer="M20 30.6 L20 14.5 Q23 8.6 32 8.6 L50 8.6 L60 15 L72 17.2 Q82 19 82 26.2 L82 30.6 Z"
      windows="M52 11.4 L66 16.2 L50 16.4 Z"
      wheels={[[34, 6.2], [66, 6.2]]}
    />
  ),
  'van-medium': (
    <Car
      outer="M8 30.6 L8 9.5 L56 9.5 L66 16.2 L90 17.4 L90 30.6 Z"
      windows="M58 12.4 L74 16.6 L56 16.8 Z"
      wheels={[[26, 6.4], [72, 6.4]]}
    />
  ),
  'van-large': (
    <Car
      outer="M4 30.6 L4 7.4 L62 7.4 L72 15.2 L92 16.2 L92 30.6 Z"
      windows="M64 10.2 L80 15.2 L62 15.4 Z"
      wheels={[[22, 6.2], [74, 6.2]]}
    />
  ),
  moving: (
    <Car
      outer="M3 30.6 L3 6.8 L48 6.8 L48 18 L62 16.2 L76 16.2 Q88 17.2 88 24.5 L88 30.6 Z"
      windows="M64 18.6 L78 18.6 L78 22.8 L64 22.8 Z"
      wheels={[[16, 5.6], [36, 5.6], [74, 5.6]]}
    />
  ),
  trailer: (
    <>
      <Cutout
        outer="M6 11 L6 26.5 L64 26.5 L64 11 Z M64 19 L90 19 L90 23 L64 23 Z"
        holes={circle(24, 32, 6) + circle(50, 32, 6) + 'M16 14.2 L32 14.2 L32 20.2 L16 20.2 Z'}
      />
      <Ring cx={24} cy={32} r={5.4} hole={2.15} />
      <Ring cx={50} cy={32} r={5.4} hole={2.15} />
    </>
  ),
};

export function VehicleSilhouette({
  family,
  variant,
  className,
}: {
  family: VehicleFamily;
  variant?: string | null;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 96 40" className={className} aria-hidden>
      {ART[kindFor(family, variant)]}
    </svg>
  );
}

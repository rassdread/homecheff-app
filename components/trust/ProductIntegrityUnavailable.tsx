'use client';

/**
 * TRUST-1 — listing temporarily hidden / removed (public viewers).
 */

type Props = {
  status: string;
  isOwner?: boolean;
};

export default function ProductIntegrityUnavailable({ status, isOwner }: Props) {
  if (isOwner) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Je aanbod is tijdelijk niet zichtbaar</p>
        <p className="mt-1">
          We controleren meldingen. Kopers zien dit aanbod niet in de feed tot
          HomeCheff het weer zichtbaar maakt. Je aanbod is niet verwijderd.
        </p>
      </div>
    );
  }

  const removed = status === 'REMOVED';
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
      <p className="font-medium">
        {removed ? 'Dit aanbod is niet beschikbaar' : 'Dit aanbod is tijdelijk niet beschikbaar'}
      </p>
      <p className="mt-1 text-gray-600">
        Het staat momenteel niet in de marketplace terwijl HomeCheff het bekijkt.
      </p>
    </div>
  );
}

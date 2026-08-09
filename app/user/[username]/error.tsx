'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PublicProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public-profile]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900">
        This profile could not be loaded
      </h1>
      <p className="text-sm text-gray-600">
        Something went wrong while opening this public profile. You can retry or
        return to Discover.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          To homepage
        </Link>
      </div>
    </div>
  );
}

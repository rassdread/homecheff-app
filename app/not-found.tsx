import Link from 'next/link';
import { NOT_FOUND_METADATA } from '@/lib/seo/not-found-metadata';

export const metadata = NOT_FOUND_METADATA;

/**
 * Server not-found UI (entity routes that call `notFound()`).
 * Must not inherit homepage canonical / index from the root layout.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Streamed App Router 200s may omit head metadata; keep robots in the document. */}
      <meta name="robots" content="noindex, nofollow, noarchive" />
      <div className="text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            To homepage
          </Link>
          <Link
            href="/?chip=inspiration#homecheff-feed"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            To inspiration
          </Link>
        </div>
      </div>
    </div>
  );
}

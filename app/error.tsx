"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Er is een fout opgetreden</h2>
        <p className="text-gray-600 mb-4">
          Er is iets misgegaan. Probeer het opnieuw of ga terug naar de homepage.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="bg-gray-100 p-4 rounded text-left text-sm text-red-800 overflow-x-auto mb-4">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Probeer opnieuw
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Naar homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

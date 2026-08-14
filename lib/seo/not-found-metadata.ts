import type { Metadata } from 'next';

/**
 * Metadata for genuine not-found responses.
 * Must not inherit the root layout homepage canonical / index,follow.
 */
export const NOT_FOUND_METADATA: Metadata = {
  title: 'Page not found',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: null,
  },
  openGraph: {
    title: 'Page not found',
    url: undefined,
  },
};

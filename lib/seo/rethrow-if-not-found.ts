/**
 * `notFound()` throws with digest `NEXT_NOT_FOUND`.
 * generateMetadata try/catch blocks that swallow this keep HTTP 200.
 */
export function rethrowIfNotFound(error: unknown): void {
  if (!error || typeof error !== 'object') return;
  const digest = (error as { digest?: unknown }).digest;
  if (digest === 'NEXT_NOT_FOUND') {
    throw error;
  }
  if (
    typeof digest === 'string' &&
    digest.includes('NEXT_HTTP_ERROR_FALLBACK;404')
  ) {
    throw error;
  }
}

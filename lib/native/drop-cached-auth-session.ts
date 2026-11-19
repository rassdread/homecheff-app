/** Remove a cached logged-out /api/auth/session so the next read uses the new cookie. */
export async function dropCachedAuthSession(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        await Promise.all(
          keys.map((request) => {
            try {
              const url = new URL(request.url);
              if (url.pathname.startsWith('/api/auth/')) return cache.delete(request);
            } catch {
              /* ignore */
            }
            return Promise.resolve(false);
          }),
        );
      }),
    );
  } catch {
    /* private mode or an unavailable cache */
  }
}

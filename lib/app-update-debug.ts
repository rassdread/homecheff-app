/** Dev or explicit client flag — logs must never run in production by default. */
export function shouldLogAppUpdateDebug(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_DEBUG_APP_UPDATE === 'true';
}

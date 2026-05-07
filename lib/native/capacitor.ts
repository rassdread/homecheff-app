/**
 * Capacitor / native shell detection for client-side code only.
 * Geen imports van @capacitor/* — veilig voor Next.js SSR en bundling.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (
      window as Window & {
        Capacitor?: { isNativePlatform?: () => boolean };
      }
    ).Capacitor;
    return cap?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

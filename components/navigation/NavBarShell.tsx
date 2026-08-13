/** Lightweight NavBar placeholder — prevents layout shift while NavBar chunk loads.
 * Neutral (not guest-CTA shaped) so OAuth transition does not flash Inloggen/Aanmelden. */
export default function NavBarShell() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md overflow-x-clip pointer-events-none"
      aria-busy="true"
      aria-label="Navigatie laden"
    >
      <div className="mx-auto flex h-14 max-w-[100vw] items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
        <div className="h-8 w-28 shrink-0 animate-pulse rounded-lg bg-gray-200" />
        <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden h-8 w-8 animate-pulse rounded-full bg-gray-100 lg:block" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </header>
  );
}

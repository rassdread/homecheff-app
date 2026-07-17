/** Lightweight NavBar placeholder — prevents layout shift while NavBar chunk loads. */
export default function NavBarShell() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md overflow-x-clip pointer-events-none"
      aria-busy="true"
      aria-label="Navigatie laden"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1.5 px-3 sm:h-16 sm:px-4 lg:px-5 xl:px-6 2xl:px-8">
        <div className="h-8 w-10 shrink-0 animate-pulse rounded-lg bg-gray-200 2xl:w-28" />
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="hidden h-8 w-20 animate-pulse rounded-full bg-gray-100 2xl:block" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden h-9 w-28 animate-pulse rounded-2xl bg-primary-100 lg:block" />
          <div className="h-9 w-16 animate-pulse rounded-xl bg-gray-100 sm:w-20" />
          <div className="h-9 w-20 animate-pulse rounded-xl bg-gray-200 sm:w-24" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100 xl:hidden" />
        </div>
      </div>
    </header>
  );
}

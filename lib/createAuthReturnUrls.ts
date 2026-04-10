/** Login/register URLs met terugkeer naar huidige pagina (zelfde patroon als PromoModal). */
export function getCreateAuthReturnUrls(): { login: string; register: string } {
  if (typeof window === "undefined") {
    return { login: "/login", register: "/register" };
  }
  const cu = `${window.location.pathname}${window.location.search}`;
  return {
    login: `/login?callbackUrl=${encodeURIComponent(cu)}`,
    register: `/register?returnUrl=${encodeURIComponent(cu)}`,
  };
}

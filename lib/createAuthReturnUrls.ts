/** Login/register URLs met terugkeer naar huidige pagina (zelfde patroon als PromoModal). */
export function getCreateAuthReturnUrls(
  callbackPath?: string,
): { login: string; register: string } {
  if (typeof window === "undefined") {
    return { login: "/login", register: "/register" };
  }
  const cu =
    callbackPath ?? `${window.location.pathname}${window.location.search}`;
  const encoded = encodeURIComponent(cu);
  return {
    login: `/login?callbackUrl=${encoded}`,
    register: `/register?callbackUrl=${encoded}&returnUrl=${encoded}`,
  };
}

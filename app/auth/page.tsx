import { redirect } from "next/navigation";

/**
 * Bare /auth is not a real page (SSO lives under /auth/sso/*).
 * Redirect to login so cold visitors never see a soft 404.
 */
export default function AuthIndexRedirectPage() {
  redirect("/login");
}

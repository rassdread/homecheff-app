"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type Props = {
  children: React.ReactNode;
  /** Optioneel: gebruik je <AuthProvider session={...}> als je server-side de session meelevert */
  session?: Session | null;
};

/**
 * Maakt NextAuth sessions beschikbaar in je hele app.
 * Gebruik in app/layout.tsx:
 *
 *   import AuthProvider from "@/components/AuthProvider";
 *   ...
 *   <AuthProvider>{children}</AuthProvider>
 *
 * Of, als je server-side de session ophaalt:
 *   const session = await auth(); // uit jouw NextAuth helper
 *   <AuthProvider session={session}>{children}</AuthProvider>
 */
export default function AuthProvider({ children, session }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

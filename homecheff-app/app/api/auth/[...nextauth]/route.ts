/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import NextAuth from "next-auth";

export const dynamic = 'force-dynamic';

import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

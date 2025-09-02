"use client";
import { useSession, signOut } from "next-auth/react";

export default function LogoutButton() {
  const { data: session } = useSession();
  if (!session) return null;
  return (
    <button
      className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition"
      onClick={() => signOut({ callbackUrl: "/" })}
      title="Uitloggen"
    >
      Uitloggen
    </button>
  );
}

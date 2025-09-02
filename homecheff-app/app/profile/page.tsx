// app/profile/page.tsx — SERVER component (fix prerender)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import Link from "next/link";

import PhotoUploader from "@/components/profile/PhotoUploader";
import ProfileSummary from "@/components/profile/ProfileSummary";
import UsernameForm from "@/components/profile/UsernameForm";
import MyDishesManager from "@/components/profile/MyDishesManager";
import OrderList from "@/components/profile/OrderList";
import FavoritesGrid from "@/components/profile/FavoritesGrid";
import FollowsList from "@/components/profile/FollowsList";

export default function ProfilePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const openNewProducts = (searchParams?.added ?? "") === "1";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* HEADER: Avatar + acties */}
      <section className="grid md:grid-cols-[220px,1fr,auto] gap-6 items-start">
        {/* Avatar + upload */}
        <div className="rounded-2xl border bg-white p-4 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full overflow-hidden border">
            <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
              <ProfileSummary stacked />
            </Suspense>
          </div>
          <div className="mt-4 w-full">
            <Suspense fallback={<div className="h-12 rounded bg-gray-100 animate-pulse" />}>
              <PhotoUploader buttonLabel="Opslaan" />
            </Suspense>
          </div>
        </div>

        {/* Profiel-instellingen (gebruikersnaam e.d.) */}
        <div className="rounded-2xl border bg-white p-4">
          <h1 className="text-xl font-semibold mb-2">Profielinstellingen</h1>
          <p className="text-sm text-muted-foreground">
            Stel je gebruikersnaam in. Je e-mailadres is niet zichtbaar op je profiel.
          </p>
          <div className="mt-4">
            <Suspense fallback={<div className="h-20 rounded-xl bg-gray-100 animate-pulse" />}>
              <UsernameForm />
            </Suspense>
          </div>
        </div>

        {/* Actie-knoppen */}
        <div className="flex flex-col gap-3">
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-900/20"
          >
            Profiel bewerken
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-white hover:bg-gray-50 border"
          >
            Instellingen
          </Link>
        </div>
      </section>

      {/* MIJN GERECHTEN (boven bestelhistorie) + uitklap alleen bij ?added=1 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Mijn gerechten</h2>
        <p className="text-sm text-muted-foreground">
          Upload maximaal 5 foto’s per gerecht. Publiceer = te koop (prijs + afhalen/bezorgen vereist).
        </p>
        <details className="rounded-2xl border bg-white" open={openNewProducts}>
          <summary className="cursor-pointer list-none px-4 py-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-medium">Nieuwe producten</span>
              <span className="text-sm text-gray-600">klik om {openNewProducts ? "te sluiten" : "te openen"}</span>
            </div>
          </summary>
          <div className="px-4 pb-4">
            <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
              <MyDishesManager />
            </Suspense>
          </div>
        </details>
      </section>

      {/* BESTELHISTORIE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bestelhistorie</h2>
        <Suspense fallback={<div className="h-24 rounded-xl bg-gray-100 animate-pulse" />}>
          <OrderList />
        </Suspense>
      </section>

      {/* FAVORIETEN */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Favorieten</h2>
        <Suspense fallback={<div className="h-32 rounded-xl bg-gray-100 animate-pulse" />}>
          <FavoritesGrid />
        </Suspense>
      </section>

      {/* GEVOLGDE VERKOPERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Gevolgde verkopers</h2>
        <Suspense fallback={<div className="h-24 rounded-xl bg-gray-100 animate-pulse" />}>
          <FollowsList />
        </Suspense>
      </section>
    </div>
  );
}

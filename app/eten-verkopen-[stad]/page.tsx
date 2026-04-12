import { notFound } from "next/navigation";
import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";
import {
  ETEN_VERKOPEN_CITY_SLUGS,
  getEtenVerkopenCityLabel,
} from "@/lib/seo/etenVerkopenCities";
import { getCurrentLanguage } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return ETEN_VERKOPEN_CITY_SLUGS.map((stad) => ({ stad }));
}

export async function generateMetadata({
  params,
}: {
  params: { stad: string };
}) {
  if (!ETEN_VERKOPEN_CITY_SLUGS.includes(params.stad as (typeof ETEN_VERKOPEN_CITY_SLUGS)[number])) {
    return { title: "HomeCheff" };
  }
  const lang = await getCurrentLanguage();
  const city = getEtenVerkopenCityLabel(params.stad, lang);
  const path = `/eten-verkopen-${params.stad}`;
  return buildProgrammaticLandingMetadata(path, "etenVerkopenCityPage", { city });
}

export default async function EtenVerkopenStadPage({
  params,
}: {
  params: { stad: string };
}) {
  if (!ETEN_VERKOPEN_CITY_SLUGS.includes(params.stad as (typeof ETEN_VERKOPEN_CITY_SLUGS)[number])) {
    notFound();
  }
  const lang = await getCurrentLanguage();
  const city = getEtenVerkopenCityLabel(params.stad, lang);
  return (
    <ProgrammaticSeoLandingPage
      namespace="etenVerkopenCityPage"
      interpolation={{ city }}
    />
  );
}

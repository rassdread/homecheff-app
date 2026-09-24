import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";
import {
  type EtenVerkopenCitySlug,
  getEtenVerkopenCityLabel,
} from "@/lib/seo/etenVerkopenCities";
import { getCurrentLanguage } from "@/lib/seo/metadata";

/** Canonical public path. Next cannot express this as a partial dynamic segment. */
export function etenVerkopenCityPath(stad: EtenVerkopenCitySlug): string {
  return `/eten-verkopen-${stad}`;
}

export async function etenVerkopenCityMetadata(stad: EtenVerkopenCitySlug) {
  const lang = await getCurrentLanguage();
  const city = getEtenVerkopenCityLabel(stad, lang);
  return buildProgrammaticLandingMetadata(etenVerkopenCityPath(stad), "etenVerkopenCityPage", {
    city,
  });
}

export async function EtenVerkopenCityView({ stad }: { stad: EtenVerkopenCitySlug }) {
  const lang = await getCurrentLanguage();
  const city = getEtenVerkopenCityLabel(stad, lang);
  return (
    <ProgrammaticSeoLandingPage
      namespace="etenVerkopenCityPage"
      interpolation={{ city }}
      pagePath={etenVerkopenCityPath(stad)}
    />
  );
}

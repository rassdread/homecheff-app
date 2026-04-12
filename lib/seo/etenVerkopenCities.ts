/** Statische city-slugs voor `/eten-verkopen-[stad]`. */
export const ETEN_VERKOPEN_CITY_SLUGS = [
  "rotterdam",
  "amsterdam",
  "den-haag",
  "utrecht",
] as const;

export type EtenVerkopenCitySlug = (typeof ETEN_VERKOPEN_CITY_SLUGS)[number];

const CITY_DISPLAY: Record<
  EtenVerkopenCitySlug,
  { nl: string; en: string }
> = {
  rotterdam: { nl: "Rotterdam", en: "Rotterdam" },
  amsterdam: { nl: "Amsterdam", en: "Amsterdam" },
  "den-haag": { nl: "Den Haag", en: "The Hague" },
  utrecht: { nl: "Utrecht", en: "Utrecht" },
};

export function getEtenVerkopenCityLabel(
  slug: string,
  lang: "nl" | "en"
): string {
  const row = CITY_DISPLAY[slug as EtenVerkopenCitySlug];
  if (!row) return slug;
  return lang === "en" ? row.en : row.nl;
}

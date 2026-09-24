import {
  EtenVerkopenCityView,
  etenVerkopenCityMetadata,
} from "@/lib/seo/etenVerkopenCityRoute";

export function generateMetadata() {
  return etenVerkopenCityMetadata("amsterdam");
}

export default function Page() {
  return <EtenVerkopenCityView stad="amsterdam" />;
}

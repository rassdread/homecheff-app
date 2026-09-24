import {
  EtenVerkopenCityView,
  etenVerkopenCityMetadata,
} from "@/lib/seo/etenVerkopenCityRoute";

export function generateMetadata() {
  return etenVerkopenCityMetadata("utrecht");
}

export default function Page() {
  return <EtenVerkopenCityView stad="utrecht" />;
}

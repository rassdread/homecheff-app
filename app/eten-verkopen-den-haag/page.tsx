import {
  EtenVerkopenCityView,
  etenVerkopenCityMetadata,
} from "@/lib/seo/etenVerkopenCityRoute";

export function generateMetadata() {
  return etenVerkopenCityMetadata("den-haag");
}

export default function Page() {
  return <EtenVerkopenCityView stad="den-haag" />;
}

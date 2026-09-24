import {
  EtenVerkopenCityView,
  etenVerkopenCityMetadata,
} from "@/lib/seo/etenVerkopenCityRoute";

export function generateMetadata() {
  return etenVerkopenCityMetadata("rotterdam");
}

export default function Page() {
  return <EtenVerkopenCityView stad="rotterdam" />;
}

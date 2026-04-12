import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";

const PATH = "/eten-verkopen-vanuit-huis";

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, "etenVerkopenVanuitHuisPage");
}

export default function EtenVerkopenVanuitHuisPage() {
  return <ProgrammaticSeoLandingPage namespace="etenVerkopenVanuitHuisPage" />;
}

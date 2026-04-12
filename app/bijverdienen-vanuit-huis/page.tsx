import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";

const PATH = "/bijverdienen-vanuit-huis";

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, "bijverdienenVanuitHuisPage");
}

export default function BijverdienenVanuitHuisPage() {
  return <ProgrammaticSeoLandingPage namespace="bijverdienenVanuitHuisPage" />;
}

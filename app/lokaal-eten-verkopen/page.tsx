import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";

const PATH = "/lokaal-eten-verkopen";

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, "lokaalEtenVerkopenPage");
}

export default function LokaalEtenVerkopenPage() {
  return <ProgrammaticSeoLandingPage namespace="lokaalEtenVerkopenPage" />;
}

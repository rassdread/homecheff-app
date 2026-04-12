import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";

const PATH = "/zelfgemaakt-eten-verkopen";

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, "zelfgemaaktEtenVerkopenPage");
}

export default function ZelfgemaaktEtenVerkopenPage() {
  return <ProgrammaticSeoLandingPage namespace="zelfgemaaktEtenVerkopenPage" />;
}

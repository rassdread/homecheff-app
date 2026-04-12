import ProgrammaticSeoLandingPage from "@/components/seo/ProgrammaticSeoLandingPage";
import { buildProgrammaticLandingMetadata } from "@/lib/seo/buildProgrammaticLandingMetadata";

const PATH = "/thuisgekookt-eten-verkopen";

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, "thuisgekooktEtenVerkopenPage");
}

export default function ThuisgekooktEtenVerkopenPage() {
  return <ProgrammaticSeoLandingPage namespace="thuisgekooktEtenVerkopenPage" />;
}

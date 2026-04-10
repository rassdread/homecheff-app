"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ChangeEvent,
} from "react";
import { useSession } from "next-auth/react";
import CategoryFormSelector from "@/components/products/CategoryFormSelector";
import InspiratieFormHandler from "@/components/products/InspiratieFormHandler";
import { compressDataUrl } from "@/lib/imageOptimization";
import { useTranslation } from "@/hooks/useTranslation";

type Phase =
  | "wizard-1"
  | "wizard-photo"
  | "wizard-2-sell"
  | "wizard-2-inspiratie"
  | "form-sell"
  | "form-inspiratie";

type PlatformChoice = "dorpsplein" | "inspiratie";

function HomeCheffProductNieuwPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category");
  const { data: session } = useSession();
  const { t } = useTranslation();

  const skipWizard = useMemo(() => {
    if (!searchParams) return false;
    const cat = searchParams.get("category");
    if (cat === "CHEFF" || cat === "GARDEN" || cat === "DESIGNER") return true;
    const deep = [
      "fromRecipe",
      "fromGarden",
      "fromDesign",
      "fromInspiratie",
      "fromProduct",
    ];
    return deep.some((k) => searchParams.get(k) === "true");
  }, [searchParams]);

  const [category, setCategory] = useState<"CHEFF" | "GARDEN" | "DESIGNER">(
    "CHEFF"
  );
  const [phase, setPhase] = useState<Phase>(
    skipWizard ? "form-sell" : "wizard-1"
  );
  const [platformChoice, setPlatformChoice] =
    useState<PlatformChoice | null>(null);
  const [inspiratieLocation, setInspiratieLocation] = useState<
    "keuken" | "tuin" | "atelier" | null
  >(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (skipWizard) {
      setPhase("form-sell");
    }
  }, [skipWizard]);

  useEffect(() => {
    if (!session?.user) {
      setUserRoles([]);
      setRolesLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/me");
        if (!res.ok) throw new Error("profile");
        const data = await res.json();
        if (!cancelled) {
          setUserRoles(data.user?.sellerRoles || []);
          setRolesLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setUserRoles((session?.user as { sellerRoles?: string[] })?.sellerRoles || []);
          setRolesLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Category from URL / template (behoud bestaande deep links)
  useEffect(() => {
    if (!skipWizard) return;

    if (
      categoryParam === "CHEFF" ||
      categoryParam === "GARDEN" ||
      categoryParam === "DESIGNER"
    ) {
      setCategory(categoryParam);
      return;
    }

    if (typeof window === "undefined" || !searchParams) return;

    const fromGarden = searchParams.get("fromGarden") === "true";
    const fromDesign = searchParams.get("fromDesign") === "true";
    const fromRecipe = searchParams.get("fromRecipe") === "true";

    if (fromGarden) {
      setCategory("GARDEN");
      return;
    }
    if (fromDesign) {
      setCategory("DESIGNER");
      return;
    }
    if (fromRecipe) {
      try {
        const recipeDataStr =
          sessionStorage.getItem("recipeToProductData") ||
          localStorage.getItem("recipeToProductData");
        if (recipeDataStr) {
          const recipeData = JSON.parse(recipeDataStr);
          if (recipeData.category) {
            setCategory("CHEFF");
            return;
          }
        }
      } catch (error) {
        console.error("Error reading recipe data:", error);
      }
      setCategory("CHEFF");
      return;
    }

    setCategory("CHEFF");
  }, [categoryParam, searchParams, skipWizard]);

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated") {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-600">Laden...</div>
      </main>
    );
  }

  const handleSave = (product: { id?: string } | null) => {
    if (product?.id) {
      window.location.href = `/product/${product.id}`;
    } else {
      window.location.href = "/profile?tab=producten";
    }
  };

  const handleCancel = () => {
    window.location.href = "/profile?tab=producten";
  };

  const initialPhoto =
    typeof window !== "undefined"
      ? sessionStorage.getItem("productPhoto") ||
        sessionStorage.getItem("quickAddPhoto") ||
        sessionStorage.getItem("inspiratiePhoto") ||
        localStorage.getItem("pendingProductPhoto") ||
        undefined
      : undefined;

  const goAfterPhotoPick = (next: "wizard-2-sell" | "wizard-2-inspiratie") => {
    setPhase(next);
  };

  const processDataUrl = async (dataUrl: string) => {
    const isVideo = dataUrl.startsWith("data:video/");
    let final = dataUrl;
    if (!isVideo) {
      try {
        final = await compressDataUrl(dataUrl, 1920, 1080, 0.7, 500);
      } catch {
        /* keep original */
      }
    }
    try {
      sessionStorage.setItem("productPhoto", final);
      sessionStorage.setItem("quickAddPhoto", final);
      localStorage.setItem("pendingProductPhoto", final);
      sessionStorage.setItem("productIsVideo", isVideo ? "true" : "false");
    } catch (e) {
      if (e instanceof Error && e.message.includes("quota")) {
        alert(
          isVideo
            ? "Video is te groot voor opslag. Probeer een kortere video."
            : "Foto is te groot. Kies een kleinere afbeelding."
        );
      } else {
        alert("Kon media niet opslaan. Probeer opnieuw.");
      }
      return;
    }
    const next =
      platformChoice === "inspiratie" ? "wizard-2-inspiratie" : "wizard-2-sell";
    goAfterPhotoPick(next);
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") void processDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const openGallery = () => {
    const el = fileInputRef.current;
    if (!el) return;
    el.removeAttribute("capture");
    el.click();
  };

  const openCamera = () => {
    const el = fileInputRef.current;
    if (!el) return;
    el.setAttribute("capture", "environment");
    el.click();
    setTimeout(() => el.removeAttribute("capture"), 150);
  };

  const skipPhotoStep = () => {
    sessionStorage.removeItem("productPhoto");
    sessionStorage.removeItem("quickAddPhoto");
    localStorage.removeItem("pendingProductPhoto");
    sessionStorage.removeItem("productIsVideo");
    const next =
      platformChoice === "inspiratie" ? "wizard-2-inspiratie" : "wizard-2-sell";
    setPhase(next);
  };

  const showChef =
    !session?.user || !rolesLoaded || userRoles.includes("chef");
  const showGarden =
    !session?.user || !rolesLoaded || userRoles.includes("garden");
  const showDesigner =
    !session?.user || !rolesLoaded || userRoles.includes("designer");
  const noSellerRoles =
    Boolean(session?.user) && rolesLoaded && userRoles.length === 0;

  return (
    <main className="min-h-screen bg-neutral-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {phase === "wizard-1" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Wat wil je toevoegen?
              </h1>
              <p className="mt-2 text-gray-600">
                Zelfde stappen als via het plus-knopmenu onderaan.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="w-full p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-[0.99] text-left"
                onClick={() => {
                  setPlatformChoice("dorpsplein");
                  setPhase("wizard-photo");
                }}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="text-lg font-bold">{t("bottomNav.dorpsplein")}</div>
                <div className="text-sm opacity-90">{t("bottomNav.sellProducts")}</div>
              </button>
              <button
                type="button"
                className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-[0.99] text-left"
                onClick={() => {
                  setPlatformChoice("inspiratie");
                  setPhase("wizard-photo");
                }}
              >
                <div className="text-2xl mb-1">✨</div>
                <div className="text-lg font-bold">{t("bottomNav.inspiratie")}</div>
                <div className="text-sm opacity-90">{t("bottomNav.shareIdeas")}</div>
              </button>
            </div>
          </>
        )}

        {phase === "wizard-photo" && (
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setPlatformChoice(null);
                  setPhase("wizard-1");
                }}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                ← Terug
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Foto toevoegen
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Kies een foto of video uit je galerij of maak een nieuwe — of ga
                door zonder.
              </p>
            </div>
            <div className="space-y-3 max-w-md">
              <button
                type="button"
                onClick={openGallery}
                className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-lg font-bold">Galerij</div>
                <div className="text-sm opacity-90">
                  Kies een foto of video uit je galerij
                </div>
              </button>
              <button
                type="button"
                onClick={openCamera}
                className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
              >
                <div className="text-2xl mb-1">📸</div>
                <div className="text-lg font-bold">Camera</div>
                <div className="text-sm opacity-90">
                  Maak een nieuwe foto of video
                </div>
              </button>
              <button
                type="button"
                onClick={skipPhotoStep}
                className="w-full p-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Doorgaan zonder foto
              </button>
            </div>
          </>
        )}

        {phase === "wizard-2-sell" && (
          <>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setPhase("wizard-photo")}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  ← Terug
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                  Kies je rol
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welk type product is dit?
                </p>
              </div>
            </div>
            {noSellerRoles ? (
              <div className="text-center py-6 rounded-xl border bg-white p-6">
                <p className="text-gray-600 mb-4">
                  Je hebt nog geen verkoper rollen.
                </p>
                <Link
                  href="/profile?tab=overview"
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Mijn HomeCheff instellen
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                {showChef && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setCategory("CHEFF");
                      setPhase("form-sell");
                    }}
                  >
                    <div className="text-2xl mb-1">🍳</div>
                    <div className="text-lg font-bold">Chef</div>
                    <div className="text-sm opacity-90">
                      Gerechten & ingrediënten
                    </div>
                  </button>
                )}
                {showGarden && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setCategory("GARDEN");
                      setPhase("form-sell");
                    }}
                  >
                    <div className="text-2xl mb-1">🌱</div>
                    <div className="text-lg font-bold">Garden</div>
                    <div className="text-sm opacity-90">Groenten & planten</div>
                  </button>
                )}
                {showDesigner && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setCategory("DESIGNER");
                      setPhase("form-sell");
                    }}
                  >
                    <div className="text-2xl mb-1">🎨</div>
                    <div className="text-lg font-bold">Designer</div>
                    <div className="text-sm opacity-90">Handgemaakte items</div>
                  </button>
                )}
                {!rolesLoaded && session?.user && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Laden…
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {phase === "wizard-2-inspiratie" && (
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setPhase("wizard-photo")}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                ← Terug
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Kies inspiratie type
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welke inspiratie wil je delen?
              </p>
            </div>
            {noSellerRoles ? (
              <div className="text-center py-6 rounded-xl border bg-white p-6">
                <p className="text-gray-600 mb-4">
                  Je hebt nog geen verkoper rollen.
                </p>
                <Link
                  href="/profile?tab=overview"
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Mijn HomeCheff instellen
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                {showChef && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setInspiratieLocation("keuken");
                      setPhase("form-inspiratie");
                    }}
                  >
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-lg font-bold">Recepten</div>
                    <div className="text-sm opacity-90">
                      Deel je recepten en kooktips
                    </div>
                  </button>
                )}
                {showGarden && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setInspiratieLocation("tuin");
                      setPhase("form-inspiratie");
                    }}
                  >
                    <div className="text-2xl mb-1">🌱</div>
                    <div className="text-lg font-bold">Kweken</div>
                    <div className="text-sm opacity-90">
                      Deel je kweekprojecten
                    </div>
                  </button>
                )}
                {showDesigner && (
                  <button
                    type="button"
                    className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
                    onClick={() => {
                      setInspiratieLocation("atelier");
                      setPhase("form-inspiratie");
                    }}
                  >
                    <div className="text-2xl mb-1">🎨</div>
                    <div className="text-lg font-bold">Designs</div>
                    <div className="text-sm opacity-90">
                      Deel je creatieve werken
                    </div>
                  </button>
                )}
                {!rolesLoaded && session?.user && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Laden…
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {phase === "form-sell" && (
          <>
            {!skipWizard && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setPhase("wizard-2-sell")}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  ← Andere categorie
                </button>
              </div>
            )}
            {skipWizard && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Start met verkopen
                </h1>
                <p className="mt-2 text-gray-600">
                  Verdien geld met wat je al kunt — gewoon in jouw buurt.
                </p>
              </div>
            )}
            {!skipWizard && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Start met verkopen
                </h1>
                <p className="mt-2 text-gray-600">
                  Vul het formulier in om je aanbod op het Dorpsplein te zetten.
                </p>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <CategoryFormSelector
                category={category}
                editMode={false}
                onSave={handleSave}
                onCancel={handleCancel}
                platform="dorpsplein"
                initialPhoto={initialPhoto}
              />
            </div>
          </>
        )}

        {phase === "form-inspiratie" && inspiratieLocation && (
          <>
            <div className="mb-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setInspiratieLocation(null);
                  setPhase("wizard-2-inspiratie");
                }}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                ← Andere inspiratie-categorie
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Deel inspiratie
                </h1>
                <p className="mt-2 text-gray-600">
                  Deel een recept, idee of voorbeeld en inspireer anderen.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-8">
              <InspiratieFormHandler
                location={inspiratieLocation}
                initialPhoto={initialPhoto}
                onSave={() => {
                  window.location.href = "/inspiratie";
                }}
                onCancel={() => setPhase("wizard-2-inspiratie")}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function HomeCheffProductNieuwPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">Laden...</div>
          </div>
        </main>
      }
    >
      <HomeCheffProductNieuwPageContent />
    </Suspense>
  );
}

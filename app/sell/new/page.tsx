"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
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
import StripeConnectPaymentsBanner from "@/components/seller/StripeConnectPaymentsBanner";
import SellerActivationGate from "@/components/seller/SellerActivationGate";
import { getProfileHrefAfterProductSave } from "@/lib/profileProductTab";
import { parseCreateIntentSearchParams } from "@/lib/createFlowIntent";
import {
  parseMarketplaceEntryFromSearchParams,
} from "@/lib/marketplace/entry-prefill";
import { legacyVerticalToMarketplaceCategory } from "@/lib/marketplace/listing-taxonomy";
import { savePendingIntent } from "@/lib/onboarding/pending-intent";
import { saveDraft, clearDraft, restoreDraft } from "@/lib/onboarding/draft-ecosphere";

type Phase =
  | "wizard-1"
  | "wizard-photo"
  | "wizard-2-sell"
  | "wizard-2-inspiratie"
  | "form-sell"
  | "form-inspiratie";

type PlatformChoice = "dorpsplein" | "inspiratie";

const INSPIRATIE_IMPORT_KEY = "inspiratieToProductData";

function sellsNewSkipWizard(sp: URLSearchParams | null): boolean {
  if (!sp) return true;
  if (sp.get("wizard") === "1") return false;
  if (sp.get("fromInspiratie") === "true") return true;
  const cat = sp.get("category");
  if (cat === "CHEFF" || cat === "GARDEN" || cat === "DESIGNER") return true;
  const deep = [
    "fromRecipe",
    "fromGarden",
    "fromDesign",
    "fromInspiratie",
    "fromProduct",
  ] as const;
  if (deep.some((k) => sp.get(k) === "true")) return true;
  // V3 marketplace entry is the default dorpsplein flow
  const mode = (sp.get("mode") || "").toLowerCase();
  if (mode === "inspiration" || mode === "inspiratie") return false;
  return true;
}

/** Import-flow vanaf foto-selectie / storage (fromInspiratie=true). */
function parseInspiratieImportPayload(): {
  category: "CHEFF" | "GARDEN" | "DESIGNER";
  location: "keuken" | "tuin" | "atelier";
} {
  if (typeof window === "undefined") {
    return { category: "CHEFF", location: "keuken" };
  }
  try {
    const raw =
      sessionStorage.getItem(INSPIRATIE_IMPORT_KEY) ||
      localStorage.getItem(INSPIRATIE_IMPORT_KEY);
    if (!raw) return { category: "CHEFF", location: "keuken" };
    const d = JSON.parse(raw) as Record<string, unknown>;
    const c = d.category;
    const category: "CHEFF" | "GARDEN" | "DESIGNER" =
      c === "GARDEN" ? "GARDEN" : c === "DESIGNER" ? "DESIGNER" : "CHEFF";
    const locRaw = String(
      d.location ?? d.inspiratieLocation ?? ""
    ).toLowerCase();
    let location: "keuken" | "tuin" | "atelier" = "keuken";
    if (locRaw === "tuin" || locRaw === "garden") location = "tuin";
    else if (locRaw === "atelier" || locRaw === "design") location = "atelier";
    return { category, location };
  } catch {
    return { category: "CHEFF", location: "keuken" };
  }
}

function HomeCheffProductNieuwPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams?.get("category");
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  const marketplaceEntryPrefill = useMemo(() => {
    if (!searchParams) return {};
    const fromUrl = parseMarketplaceEntryFromSearchParams(searchParams);
    const parsed = parseCreateIntentSearchParams(searchParams);
    if (parsed?.platform === "dorpsplein" && parsed.category && !fromUrl.marketplaceCategory) {
      return {
        ...fromUrl,
        marketplaceCategory: legacyVerticalToMarketplaceCategory(parsed.category),
      };
    }
    return fromUrl;
  }, [searchParams]);

  const skipWizard = useMemo(
    () => sellsNewSkipWizard(searchParams),
    [searchParams]
  );

  const [category, setCategory] = useState<"CHEFF" | "GARDEN" | "DESIGNER">(
    "CHEFF"
  );
  const [phase, setPhase] = useState<Phase>(() => {
    if (!searchParams || !sellsNewSkipWizard(searchParams)) return "wizard-1";
    return searchParams.get("fromInspiratie") === "true"
      ? "form-inspiratie"
      : "form-sell";
  });
  const [platformChoice, setPlatformChoice] =
    useState<PlatformChoice | null>(null);
  const [inspiratieLocation, setInspiratieLocation] = useState<
    "keuken" | "tuin" | "atelier" | null
  >(null);
  /** Na keuze uit de 6-tegel-hub: na foto direct naar formulier, zonder tussentijdse rol-stap. */
  const [hubSelectionComplete, setHubSelectionComplete] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const urlCreateIntentAppliedRef = useRef(false);

  /** `?mode=sale|inspiration&vertical=chef|garden|designer` — zelfde preselectie als FAB-intent. */
  useLayoutEffect(() => {
    if (!searchParams || urlCreateIntentAppliedRef.current) return;
    if (sellsNewSkipWizard(searchParams)) return;
    const parsed = parseCreateIntentSearchParams(searchParams);
    if (!parsed) return;
    urlCreateIntentAppliedRef.current = true;
    setCategory(parsed.category);
    setPlatformChoice(parsed.platform);
    setHubSelectionComplete(parsed.hubComplete);
    setInspiratieLocation(parsed.inspiratieLocation);
    setPhase("wizard-photo");
  }, [searchParams]);

  /** fromInspiratie: vóór paint category/location/phase zetten (geen form-sell flash). */
  useLayoutEffect(() => {
    if (!skipWizard || !searchParams) return;
    if (searchParams.get("fromInspiratie") !== "true") return;
    const { category: cat, location } = parseInspiratieImportPayload();
    setCategory(cat);
    setInspiratieLocation(location);
    setPlatformChoice("inspiratie");
    setHubSelectionComplete(false);
    setPhase("form-inspiratie");
  }, [skipWizard, searchParams]);

  useEffect(() => {
    if (!skipWizard || !searchParams) return;
    if (searchParams.get("fromInspiratie") === "true") return;
    setPhase("form-sell");
  }, [skipWizard, searchParams]);

  /** Zelfde context als quick-add na categoriekeuze: dorpsplein + media in storage. */
  useEffect(() => {
    if (!skipWizard || !searchParams) return;
    if (searchParams.get("fromInspiratie") === "true") {
      setPlatformChoice("inspiratie");
      return;
    }
    const cat = searchParams.get("category");
    if (cat === "CHEFF" || cat === "GARDEN" || cat === "DESIGNER") {
      setPlatformChoice("dorpsplein");
      return;
    }
    if (
      searchParams.get("fromGarden") === "true" ||
      searchParams.get("fromDesign") === "true" ||
      searchParams.get("fromRecipe") === "true" ||
      searchParams.get("fromProduct") === "true"
    ) {
      setPlatformChoice("dorpsplein");
    }
  }, [skipWizard, searchParams]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const q = typeof window !== "undefined" ? window.location.search : "";
    const parsed = searchParams ? parseCreateIntentSearchParams(searchParams) : null;
    const isInsp = parsed?.platform === "inspiratie";
    savePendingIntent({
      type: isInsp ? "create_inspiration" : "create_item",
      mode: isInsp ? "inspiratie" : "dorpsplein",
      vertical: parsed?.category,
      returnPath: `/sell/new${q}`,
    });
    router.replace(`/login?callbackUrl=${encodeURIComponent(`/sell/new${q}`)}`);
  }, [status, router, searchParams]);

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

    if (searchParams?.get("fromInspiratie") === "true") {
      return;
    }

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

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-600">{t("sellNew.loading")}</div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-600">{t("sellNew.redirectingToLogin")}</div>
      </main>
    );
  }

  const handleSave = (product: { id?: string } | null) => {
    window.location.href = getProfileHrefAfterProductSave(category, { added: Boolean(product?.id) });
  };

  const handleCancel = () => {
    window.location.href = getProfileHrefAfterProductSave(category);
  };

  const initialPhoto =
    typeof window !== "undefined"
      ? sessionStorage.getItem("productPhoto") ||
        sessionStorage.getItem("quickAddPhoto") ||
        sessionStorage.getItem("inspiratiePhoto") ||
        restoreDraft("pendingProductPhoto", "local") ||
        undefined
      : undefined;

  const resolvePhaseAfterPhoto = (): Phase => {
    if (hubSelectionComplete) {
      if (platformChoice === "inspiratie" && inspiratieLocation) {
        return "form-inspiratie";
      }
      if (platformChoice === "dorpsplein") {
        return "form-sell";
      }
    }
    return platformChoice === "inspiratie"
      ? "wizard-2-inspiratie"
      : "wizard-2-sell";
  };

  const goAfterPhotoPick = () => {
    setPhase(resolvePhaseAfterPhoto());
  };

  const pickHubTile = (
    cat: "CHEFF" | "GARDEN" | "DESIGNER",
    platform: PlatformChoice
  ) => {
    setCategory(cat);
    setPlatformChoice(platform);
    setHubSelectionComplete(true);
    if (platform === "inspiratie") {
      setInspiratieLocation(
        cat === "CHEFF" ? "keuken" : cat === "GARDEN" ? "tuin" : "atelier"
      );
    } else {
      setInspiratieLocation(null);
    }
    setPhase("wizard-photo");
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
      saveDraft("pendingProductPhoto", final, "local");
      sessionStorage.setItem("productIsVideo", isVideo ? "true" : "false");
    } catch (e) {
      if (e instanceof Error && e.message.includes("quota")) {
        alert(
          isVideo
            ? t("sellNew.videoTooLargeStorage")
            : t("sellNew.photoTooLargeStorage")
        );
      } else {
        alert(t("sellNew.mediaSaveFailed"));
      }
      return;
    }
    goAfterPhotoPick();
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert(t("sellNew.mediaTypeNotAllowed"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") void processDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const openGallery = () => {
    galleryFileInputRef.current?.click();
  };

  const openCameraPhoto = () => {
    cameraPhotoInputRef.current?.click();
  };

  const openCameraVideo = () => {
    cameraVideoInputRef.current?.click();
  };

  const skipPhotoStep = () => {
    sessionStorage.removeItem("productPhoto");
    sessionStorage.removeItem("quickAddPhoto");
    clearDraft("pendingProductPhoto", "local");
    sessionStorage.removeItem("productIsVideo");
    setPhase(resolvePhaseAfterPhoto());
  };

  /** Zelfde als +-menu: opties pas na rollen, niet alle drie tonen vóór laden. */
  const showChef = rolesLoaded && userRoles.includes("chef");
  const showGarden = rolesLoaded && userRoles.includes("garden");
  const showDesigner = rolesLoaded && userRoles.includes("designer");
  const noSellerRoles =
    Boolean(session?.user) && rolesLoaded && userRoles.length === 0;

  return (
    <main className="min-h-screen bg-neutral-50">
      <input
        ref={galleryFileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={cameraPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={cameraVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] md:pb-8">
        <StripeConnectPaymentsBanner />
        <SellerActivationGate />
        {phase === "wizard-1" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {t("sellNew.hubTitle")}
              </h1>
              <p className="mt-2 text-gray-600">{t("sellNew.hubSubtitle")}</p>
            </div>
            {noSellerRoles ? (
              <div className="text-center py-6 rounded-xl border bg-white p-6">
                <p className="text-gray-600 mb-4">
                  {t("sellNew.noSellerRoles")}
                </p>
                <Link
                  href="/profile?tab=overview"
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {t("sellNew.setupHomeCheff")}
                </Link>
              </div>
            ) : (
              <>
                {!rolesLoaded && session?.user && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {t("sellNew.loading")}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  {rolesLoaded && showChef && (
                    <>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-white/20"
                        onClick={() => pickHubTile("CHEFF", "dorpsplein")}
                      >
                        <div className="text-xl mb-0.5">🍳</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.chefDorps")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          🏪 {t("sellNew.tileDorpsHint")}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-orange-600 via-amber-600 to-fuchsia-600 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-purple-200/50"
                        onClick={() => pickHubTile("CHEFF", "inspiratie")}
                      >
                        <div className="text-xl mb-0.5">🍳</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.chefInspi")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          ✨ {t("sellNew.tileInspiHint")}
                        </div>
                      </button>
                    </>
                  )}
                  {rolesLoaded && showGarden && (
                    <>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-white/20"
                        onClick={() => pickHubTile("GARDEN", "dorpsplein")}
                      >
                        <div className="text-xl mb-0.5">🌱</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.gardenDorps")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          🏪 {t("sellNew.tileDorpsHint")}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-purple-200/50"
                        onClick={() => pickHubTile("GARDEN", "inspiratie")}
                      >
                        <div className="text-xl mb-0.5">🌱</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.gardenInspi")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          ✨ {t("sellNew.tileInspiHint")}
                        </div>
                      </button>
                    </>
                  )}
                  {rolesLoaded && showDesigner && (
                    <>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-white/20"
                        onClick={() => pickHubTile("DESIGNER", "dorpsplein")}
                      >
                        <div className="text-xl mb-0.5">🎨</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.designerDorps")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          🏪 {t("sellNew.tileDorpsHint")}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full p-4 sm:p-5 rounded-xl font-semibold text-left text-white bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:shadow-lg transition-all active:scale-[0.99] ring-2 ring-purple-200/50"
                        onClick={() => pickHubTile("DESIGNER", "inspiratie")}
                      >
                        <div className="text-xl mb-0.5">🎨</div>
                        <div className="text-base sm:text-lg font-bold leading-tight">
                          {t("sellNew.designerInspi")}
                        </div>
                        <div className="text-xs sm:text-sm opacity-90 mt-1">
                          ✨ {t("sellNew.tileInspiHint")}
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {phase === "wizard-photo" && (
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setPlatformChoice(null);
                  setHubSelectionComplete(false);
                  setInspiratieLocation(null);
                  setPhase("wizard-1");
                }}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                {t("buttons.back")}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {t("sellNew.mediaStepTitle")}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t("sellNew.mediaStepSubtitle")}
              </p>
            </div>
            <div className="space-y-3 max-w-md">
              <button
                type="button"
                onClick={openGallery}
                className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
              >
                <div className="text-2xl mb-1">📷</div>
                <div className="text-lg font-bold">{t("sellNew.galleryTitle")}</div>
                <div className="text-sm opacity-90">
                  {t("sellNew.gallerySubtitle")}
                </div>
              </button>
              <button
                type="button"
                onClick={openCameraPhoto}
                className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
              >
                <div className="text-2xl mb-1">📸</div>
                <div className="text-lg font-bold">{t("sellNew.takePhotoTitle")}</div>
                <div className="text-sm opacity-90">
                  {t("sellNew.takePhotoSubtitle")}
                </div>
              </button>
              <button
                type="button"
                onClick={openCameraVideo}
                className="w-full p-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-left"
              >
                <div className="text-2xl mb-1">🎬</div>
                <div className="text-lg font-bold">{t("sellNew.takeVideoTitle")}</div>
                <div className="text-sm opacity-90">
                  {t("sellNew.takeVideoSubtitle")}
                </div>
              </button>
              <button
                type="button"
                onClick={skipPhotoStep}
                className="w-full p-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                {t("sellNew.continueWithoutMedia")}
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
                  ← {t("buttons.back")}
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                  {t("sellNew.sellRoleTitle")}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t("sellNew.sellRoleSubtitle")}
                </p>
              </div>
            </div>
            {noSellerRoles ? (
              <div className="text-center py-6 rounded-xl border bg-white p-6">
                <p className="text-gray-600 mb-4">
                  {t("sellNew.noSellerRoles")}
                </p>
                <Link
                  href="/profile?tab=overview"
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {t("sellNew.setupHomeCheff")}
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
                    <div className="text-lg font-bold">{t("sellNew.chefRoleTitle")}</div>
                    <div className="text-sm opacity-90">
                      {t("sellNew.chefRoleHint")}
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
                    <div className="text-lg font-bold">{t("sellNew.gardenRoleTitle")}</div>
                    <div className="text-sm opacity-90">{t("sellNew.gardenRoleHint")}</div>
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
                    <div className="text-lg font-bold">{t("sellNew.designerRoleTitle")}</div>
                    <div className="text-sm opacity-90">{t("sellNew.designerRoleHint")}</div>
                  </button>
                )}
                {!rolesLoaded && session?.user && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {t("sellNew.loading")}
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
                ← {t("buttons.back")}
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {t("sellNew.inspiratieTypeTitle")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t("sellNew.inspiratieTypeSubtitle")}
              </p>
            </div>
            {noSellerRoles ? (
              <div className="text-center py-6 rounded-xl border bg-white p-6">
                <p className="text-gray-600 mb-4">
                  {t("sellNew.noSellerRoles")}
                </p>
                <Link
                  href="/profile?tab=overview"
                  className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {t("sellNew.setupHomeCheff")}
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
                    <div className="text-lg font-bold">{t("sellNew.recipesTitle")}</div>
                    <div className="text-sm opacity-90">
                      {t("sellNew.recipesHint")}
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
                    <div className="text-lg font-bold">{t("sellNew.growingTitle")}</div>
                    <div className="text-sm opacity-90">
                      {t("sellNew.growingHint")}
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
                    <div className="text-lg font-bold">{t("sellNew.designsTitle")}</div>
                    <div className="text-sm opacity-90">
                      {t("sellNew.designsHint")}
                    </div>
                  </button>
                )}
                {!rolesLoaded && session?.user && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {t("sellNew.loading")}
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
                  onClick={() => {
                    if (hubSelectionComplete) {
                      setHubSelectionComplete(false);
                      setInspiratieLocation(null);
                      setPlatformChoice(null);
                      setPhase("wizard-1");
                    } else {
                      setPhase("wizard-2-sell");
                    }
                  }}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  ←{" "}
                  {hubSelectionComplete
                    ? t("sellNew.otherStart")
                    : t("sellNew.otherCategory")}
                </button>
              </div>
            )}
            {skipWizard && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  {t("sellNew.sellFormTitle")}
                </h1>
                <p className="mt-2 text-gray-600">
                  {t("sellNew.sellFormSubtitleSkip")}
                </p>
              </div>
            )}
            {!skipWizard && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("sellNew.sellFormTitle")}
                </h1>
                <p className="mt-2 text-gray-600">
                  {t("sellNew.sellFormSubtitle")}
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
                marketplaceEntryPrefill={marketplaceEntryPrefill}
              />
            </div>
          </>
        )}

        {phase === "form-inspiratie" && (
          <>
            <div className="mb-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (skipWizard) {
                    router.back();
                    return;
                  }
                  if (hubSelectionComplete) {
                    setHubSelectionComplete(false);
                    setInspiratieLocation(null);
                    setPlatformChoice(null);
                    setPhase("wizard-1");
                  } else {
                    setInspiratieLocation(null);
                    setPhase("wizard-2-inspiratie");
                  }
                }}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                ←{" "}
                {skipWizard
                  ? t("buttons.back")
                  : hubSelectionComplete
                    ? t("sellNew.otherStart")
                    : t("sellNew.otherInspiratieCategory")}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("sellNew.inspiratieFormTitle")}
                </h1>
                <p className="mt-2 text-gray-600">
                  {t("sellNew.inspiratieFormSubtitle")}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-8">
              {inspiratieLocation ? (
                <InspiratieFormHandler
                  location={inspiratieLocation}
                  initialPhoto={initialPhoto}
                  onSave={() => {
                    window.location.href =
                      "/?chip=inspiration#homecheff-feed";
                  }}
                  onCancel={() => {
                    if (skipWizard) {
                      router.back();
                      return;
                    }
                    if (hubSelectionComplete) {
                      setHubSelectionComplete(false);
                      setInspiratieLocation(null);
                      setPlatformChoice(null);
                      setPhase("wizard-1");
                    } else {
                      setPhase("wizard-2-inspiratie");
                    }
                  }}
                />
              ) : (
                <div className="text-center py-10 text-gray-600">{t("sellNew.loading")}</div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SellNewSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t("sellNew.loading")}</div>
      </div>
    </main>
  );
}

export default function HomeCheffProductNieuwPage() {
  return (
    <Suspense fallback={<SellNewSuspenseFallback />}>
      <HomeCheffProductNieuwPageContent />
    </Suspense>
  );
}

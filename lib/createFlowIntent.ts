/**
 * Eén bron voor “start create zoals FAB” met optionele preselectie (Dorpsplein vs Inspiratie + verticaal).
 * BottomNavigation leest dit bij openen van de quick-add flow; /sell/new kan dezelfde logica via query gebruiken.
 */
export const HC_CREATE_FLOW_INTENT_KEY = "hc_create_flow_intent";

export type CreateFlowVertical = "CHEFF" | "GARDEN" | "DESIGNER";
export type CreateFlowMode = "dorpsplein" | "inspiratie";

export type CreateFlowIntent = {
  mode: CreateFlowMode;
  /** Optioneel: na foto automatisch deze categorie/locatie kiezen (als rol dat toelaat). */
  vertical?: CreateFlowVertical;
  /** Beperk categorie-/locatiekeuze tot deze verticalen (profieltabs / feed); FAB laat dit leeg = alle rollen van de gebruiker. */
  allowedVerticals?: CreateFlowVertical[];
};

const VERTICAL_SET = new Set<CreateFlowVertical>(["CHEFF", "GARDEN", "DESIGNER"]);

/** sellerRoles zoals in sessie/profiel: chef | garden | designer */
export function sellerRolesToAllowedVerticals(sellerRoles: string[]): CreateFlowVertical[] {
  const out: CreateFlowVertical[] = [];
  const r = sellerRoles.map((x) => String(x).toLowerCase());
  if (r.includes("chef") || r.includes("cheff")) out.push("CHEFF");
  if (r.includes("garden") || r.includes("grower") || r.includes("grown")) out.push("GARDEN");
  if (r.includes("designer") || r.includes("design")) out.push("DESIGNER");
  return [...new Set(out)];
}

/** Schoon intent: vertical moet in allowedVerticals vallen; lege allowedVerticals wordt weggelaten. */
export function normalizeCreateFlowIntent(intent: CreateFlowIntent): CreateFlowIntent {
  const out: CreateFlowIntent = { mode: intent.mode };
  let allowed = intent.allowedVerticals?.filter((v): v is CreateFlowVertical => VERTICAL_SET.has(v));
  allowed = allowed?.length ? [...new Set(allowed)] : undefined;
  let vertical = intent.vertical && VERTICAL_SET.has(intent.vertical) ? intent.vertical : undefined;
  if (vertical && allowed && !allowed.includes(vertical)) {
    vertical = undefined;
  }
  if (vertical) out.vertical = vertical;
  if (allowed?.length) out.allowedVerticals = allowed;
  return out;
}

export function setCreateFlowIntent(intent: CreateFlowIntent): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      HC_CREATE_FLOW_INTENT_KEY,
      JSON.stringify(normalizeCreateFlowIntent(intent))
    );
  } catch {
    /* quota / private mode */
  }
}

export function peekCreateFlowIntent(): CreateFlowIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HC_CREATE_FLOW_INTENT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (o.mode !== "dorpsplein" && o.mode !== "inspiratie") return null;
    const intent: CreateFlowIntent = { mode: o.mode as CreateFlowMode };
    if (o.vertical === "CHEFF" || o.vertical === "GARDEN" || o.vertical === "DESIGNER") {
      intent.vertical = o.vertical;
    }
    const av = o.allowedVerticals;
    if (Array.isArray(av) && av.length > 0) {
      const filtered = av.filter((v): v is CreateFlowVertical => VERTICAL_SET.has(v as CreateFlowVertical));
      if (filtered.length > 0) {
        intent.allowedVerticals = [...new Set(filtered)];
      }
    }
    return normalizeCreateFlowIntent(intent);
  } catch {
    return null;
  }
}

export function consumeCreateFlowIntent(): CreateFlowIntent | null {
  const v = peekCreateFlowIntent();
  if (!v) return null;
  try {
    sessionStorage.removeItem(HC_CREATE_FLOW_INTENT_KEY);
  } catch {
    /* ignore */
  }
  return v;
}

export function clearCreateFlowIntent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HC_CREATE_FLOW_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Query voor /sell/new (verborgen bottom-nav shell). */
export function buildSellNewSearchFromIntent(intent: CreateFlowIntent | null): string {
  if (!intent) return "";
  const sp = new URLSearchParams();
  sp.set("mode", intent.mode === "dorpsplein" ? "sale" : "inspiration");
  if (intent.vertical) {
    sp.set(
      "vertical",
      intent.vertical === "CHEFF" ? "chef" : intent.vertical === "GARDEN" ? "garden" : "designer"
    );
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type ParsedSellNewCreateIntent = {
  platform: "dorpsplein" | "inspiratie";
  category: CreateFlowVertical;
  hubComplete: boolean;
  inspiratieLocation: "keuken" | "tuin" | "atelier" | null;
};

/**
 * `?mode=sale|inspiration&vertical=chef|garden|designer`
 * Onbekende combinaties → null (volledige hub blijft).
 */
export function parseCreateIntentSearchParams(sp: URLSearchParams): ParsedSellNewCreateIntent | null {
  const modeRaw = (sp.get("mode") || "").toLowerCase();
  const vRaw = (sp.get("vertical") || "").toLowerCase();
  const isSale = modeRaw === "sale" || modeRaw === "dorpsplein";
  const isInsp = modeRaw === "inspiration" || modeRaw === "inspiratie";
  if (!isSale && !isInsp) return null;

  let vertical: CreateFlowVertical | null = null;
  if (vRaw === "chef" || vRaw === "cheff") vertical = "CHEFF";
  else if (vRaw === "garden") vertical = "GARDEN";
  else if (vRaw === "designer" || vRaw === "design") vertical = "DESIGNER";
  if (vRaw && !vertical) return null;

  const category: CreateFlowVertical = vertical ?? "CHEFF";
  const platform: "dorpsplein" | "inspiratie" = isInsp ? "inspiratie" : "dorpsplein";
  const hubComplete = Boolean(vertical);
  const inspiratieLocation: "keuken" | "tuin" | "atelier" | null =
    isInsp && vertical
      ? vertical === "GARDEN"
        ? "tuin"
        : vertical === "DESIGNER"
          ? "atelier"
          : "keuken"
      : null;

  return { platform, category, hubComplete, inspiratieLocation };
}

export function mapVerticalToInspiratieLocation(
  vertical: CreateFlowVertical
): "recepten" | "kweken" | "designs" {
  if (vertical === "GARDEN") return "kweken";
  if (vertical === "DESIGNER") return "designs";
  return "recepten";
}

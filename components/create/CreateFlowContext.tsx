"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { dispatchOpenQuickAdd } from "@/lib/quickAddOpen";
import {
  clearCreateFlowIntent,
  peekCreateFlowIntent,
  setCreateFlowIntent,
  type CreateFlowIntent,
} from "@/lib/createFlowIntent";
import {
  marketplaceEntryHref,
  MARKETPLACE_ENTRY_PATH,
} from "@/lib/create/marketplace-entry-nav";
import { clickDebug } from "@/lib/click-debug";
import { getCreateAuthReturnUrls } from "@/lib/createAuthReturnUrls";
import { savePendingIntent, personaFromVertical } from "@/lib/onboarding/pending-intent";
import {
  AFTER_LOGIN_CREATE_ACTION_KEY,
  clearPendingOpenQuickAddAfterLogin,
  hasPendingOpenQuickAddAfterLogin,
  setPendingOpenQuickAddAfterLogin,
} from "@/lib/afterLoginCreateIntent";
import {
  normalizeCreatePlacementRoles,
} from "@/lib/create/create-placement-roles";
import { registerCreateRolesGate } from "@/lib/create/create-roles-gate-bus";
import { useUserBootstrap } from "@/components/user/UserBootstrapProvider";
import CreateGuestAuthModal from "./CreateGuestAuthModal";
import CreateRolesGateModal from "./CreateRolesGateModal";

type CreateFlowContextValue = {
  /** Marketplace Entry Flow V3 — /sell/new */
  openCreateFlow: () => void;
  /** Dorpsplein → /sell/new; Inspiratie → quick-add inspiratie flow */
  openCreateFlowWithIntent: (intent: CreateFlowIntent) => void;
};

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

export function useCreateFlow(): CreateFlowContextValue {
  const ctx = useContext(CreateFlowContext);
  if (!ctx) {
    throw new Error("useCreateFlow must be used within CreateFlowProvider");
  }
  return ctx;
}

function persistCreatePendingIntent(returnPath: string, intent?: CreateFlowIntent | null) {
  if (typeof window === "undefined") return;
  const ci = intent ?? peekCreateFlowIntent();
  const mode = ci?.mode ?? "dorpsplein";
  savePendingIntent({
    type: mode === "inspiratie" ? "create_inspiration" : "create_item",
    mode,
    vertical: ci?.vertical,
    persona:
      mode === "inspiratie"
        ? "inspiration"
        : personaFromVertical(ci?.vertical),
    returnPath,
  });
}

export function CreateFlowProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { profile: bootstrapProfile, ensureProfile } = useUserBootstrap();
  const [guestOpen, setGuestOpen] = useState(false);
  const [rolesGateOpen, setRolesGateOpen] = useState(false);
  const [authUrls, setAuthUrls] = useState({
    login: "/login",
    register: "/register",
  });
  const lastOpenAt = useRef(0);
  const pendingQuickAddAfterSessionRef = useRef(false);
  const pendingOpenReasonRef = useRef<string>("session-ready");
  /** Dorpsplein vs inspiratie when session resolves after loading */
  const pendingMarketplaceIntentRef = useRef<CreateFlowIntent | null>(null);

  const resolvePlacementRoles = useCallback(async (): Promise<string[]> => {
    const sessionRoles = normalizeCreatePlacementRoles(
      (session?.user as { sellerRoles?: unknown } | undefined)?.sellerRoles
    );
    if (sessionRoles.length > 0) return sessionRoles;

    const bootstrapRoles = normalizeCreatePlacementRoles(
      bootstrapProfile?.sellerRoles
    );
    if (bootstrapRoles.length > 0) return bootstrapRoles;

    try {
      const p = await ensureProfile();
      return normalizeCreatePlacementRoles(p?.sellerRoles);
    } catch {
      return [];
    }
  }, [session?.user, bootstrapProfile?.sellerRoles, ensureProfile]);

  const navigateToMarketplaceEntry = useCallback(
    (intent?: CreateFlowIntent | null) => {
      const now = Date.now();
      if (now - lastOpenAt.current < 400) {
        clickDebug("CreateFlowProvider", "marketplace-entry", "debounced-skip");
        return;
      }
      lastOpenAt.current = now;
      const href = marketplaceEntryHref(intent ?? null);
      clickDebug("CreateFlowProvider", "marketplace-entry", "navigate", href);
      clearCreateFlowIntent();
      router.push(href);
    },
    [router],
  );

  const dispatchQuickAddNow = useCallback((reason: string) => {
    const now = Date.now();
    if (now - lastOpenAt.current < 400) {
      clickDebug("CreateFlowProvider", "quick-add", "debounced-skip", reason);
      return;
    }
    lastOpenAt.current = now;
    clickDebug("CreateFlowProvider", "quick-add", "dispatch", reason);
    dispatchOpenQuickAdd();
  }, []);

  const openInspirationQuickAdd = useCallback(
    async (reason: string) => {
      const roles = await resolvePlacementRoles();
      if (roles.length === 0) {
        clickDebug("CreateFlowProvider", "roles-gate", "block", reason);
        setRolesGateOpen(true);
        return;
      }
      dispatchQuickAddNow(reason);
    },
    [resolvePlacementRoles, dispatchQuickAddNow],
  );

  const openCreateFlow = useCallback(() => {
    if (status === "loading") {
      pendingQuickAddAfterSessionRef.current = true;
      pendingMarketplaceIntentRef.current = null;
      pendingOpenReasonRef.current = "openCreateFlow-marketplace";
      clickDebug("CreateFlowProvider", "openCreateFlow", "defer-until-session", "loading");
      return;
    }
    if (status !== "authenticated" || !session?.user) {
      const now = Date.now();
      if (now - lastOpenAt.current < 400) return;
      lastOpenAt.current = now;
      setPendingOpenQuickAddAfterLogin();
      persistCreatePendingIntent(MARKETPLACE_ENTRY_PATH);
      setAuthUrls(getCreateAuthReturnUrls(MARKETPLACE_ENTRY_PATH));
      setGuestOpen(true);
      return;
    }
    navigateToMarketplaceEntry();
  }, [session?.user, status, navigateToMarketplaceEntry]);

  const openCreateFlowWithIntent = useCallback(
    (intent: CreateFlowIntent) => {
      setCreateFlowIntent(intent);

      if (intent.mode === "dorpsplein") {
        if (status === "loading") {
          pendingQuickAddAfterSessionRef.current = true;
          pendingMarketplaceIntentRef.current = intent;
          pendingOpenReasonRef.current = "openCreateFlowWithIntent-marketplace";
          return;
        }
        if (status !== "authenticated" || !session?.user) {
          const now = Date.now();
          if (now - lastOpenAt.current < 400) return;
          lastOpenAt.current = now;
          setPendingOpenQuickAddAfterLogin();
          persistCreatePendingIntent(marketplaceEntryHref(intent), intent);
          setAuthUrls(getCreateAuthReturnUrls(marketplaceEntryHref(intent)));
          setGuestOpen(true);
          return;
        }
        navigateToMarketplaceEntry(intent);
        return;
      }

      if (status === "loading") {
        pendingQuickAddAfterSessionRef.current = true;
        pendingMarketplaceIntentRef.current = null;
        pendingOpenReasonRef.current = "openCreateFlowWithIntent-inspiration";
        return;
      }

      if (status !== "authenticated" || !session?.user) {
        const now = Date.now();
        if (now - lastOpenAt.current < 400) return;
        lastOpenAt.current = now;
        setPendingOpenQuickAddAfterLogin();
        persistCreatePendingIntent(`${window.location.pathname}${window.location.search}`, intent);
        setAuthUrls(getCreateAuthReturnUrls());
        setGuestOpen(true);
        return;
      }
      void openInspirationQuickAdd("openCreateFlowWithIntent-inspiration");
    },
    [session?.user, status, navigateToMarketplaceEntry, openInspirationQuickAdd],
  );

  const handleAbandonGuestModal = useCallback(() => {
    clearPendingOpenQuickAddAfterLogin();
    clearCreateFlowIntent();
    setGuestOpen(false);
  }, []);

  const handleAuthNavigateFromModal = useCallback(() => {
    setGuestOpen(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      pendingQuickAddAfterSessionRef.current = false;
      pendingMarketplaceIntentRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!pendingQuickAddAfterSessionRef.current) return;
    pendingQuickAddAfterSessionRef.current = false;
    const reason = pendingOpenReasonRef.current;
    const pendingIntent = pendingMarketplaceIntentRef.current;
    pendingMarketplaceIntentRef.current = null;

    if (
      reason.includes("marketplace") ||
      reason === "openCreateFlow-marketplace"
    ) {
      navigateToMarketplaceEntry(pendingIntent);
      return;
    }
    void openInspirationQuickAdd(reason);
  }, [status, session?.user, navigateToMarketplaceEntry, openInspirationQuickAdd]);

  const quickAddIntentScheduledRef = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      quickAddIntentScheduledRef.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    if (!hasPendingOpenQuickAddAfterLogin()) return;
    if (quickAddIntentScheduledRef.current) return;
    quickAddIntentScheduledRef.current = true;

    const t = window.setTimeout(async () => {
      quickAddIntentScheduledRef.current = false;
      if (!hasPendingOpenQuickAddAfterLogin()) return;
      try {
        sessionStorage.removeItem(AFTER_LOGIN_CREATE_ACTION_KEY);
      } catch {
        /* ignore */
      }

      const ci = peekCreateFlowIntent();
      if (!ci || ci.mode === "dorpsplein") {
        navigateToMarketplaceEntry(ci);
        return;
      }

      const roles = await resolvePlacementRoles();
      if (roles.length === 0) {
        setRolesGateOpen(true);
        return;
      }
      dispatchOpenQuickAdd();
    }, 200);

    return () => {
      window.clearTimeout(t);
      quickAddIntentScheduledRef.current = false;
    };
  }, [status, session?.user, resolvePlacementRoles, navigateToMarketplaceEntry]);

  useEffect(() => {
    return registerCreateRolesGate(() => setRolesGateOpen(true));
  }, []);

  return (
    <CreateFlowContext.Provider value={{ openCreateFlow, openCreateFlowWithIntent }}>
      {children}
      <CreateGuestAuthModal
        open={guestOpen}
        onAbandon={handleAbandonGuestModal}
        onAuthNavigate={handleAuthNavigateFromModal}
        loginHref={authUrls.login}
        registerHref={authUrls.register}
      />
      <CreateRolesGateModal
        open={rolesGateOpen}
        onClose={() => setRolesGateOpen(false)}
      />
    </CreateFlowContext.Provider>
  );
}

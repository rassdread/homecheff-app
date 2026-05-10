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
import { useSession } from "next-auth/react";
import { dispatchOpenQuickAdd } from "@/lib/quickAddOpen";
import {
  clearCreateFlowIntent,
  setCreateFlowIntent,
  type CreateFlowIntent,
} from "@/lib/createFlowIntent";
import { clickDebug } from "@/lib/click-debug";
import { getCreateAuthReturnUrls } from "@/lib/createAuthReturnUrls";
import {
  AFTER_LOGIN_CREATE_ACTION_KEY,
  clearPendingOpenQuickAddAfterLogin,
  hasPendingOpenQuickAddAfterLogin,
  setPendingOpenQuickAddAfterLogin,
} from "@/lib/afterLoginCreateIntent";
import CreateGuestAuthModal from "./CreateGuestAuthModal";

type CreateFlowContextValue = {
  /** Zelfde ingang als +-knop / Verdienen: quick-add of auth-modal. */
  openCreateFlow: () => void;
  /** Zelfde flow met Dorpsplein/Inspiratie (+ optioneel Chef/Garden/Designer) als preselectie. */
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

export function CreateFlowProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [guestOpen, setGuestOpen] = useState(false);
  const [authUrls, setAuthUrls] = useState({
    login: "/login",
    register: "/register",
  });
  const lastOpenAt = useRef(0);
  /** Eerste tap tijdens NextAuth `loading`: intent staat al in sessionStorage; dispatch zodra sessie bekend is. */
  const pendingQuickAddAfterSessionRef = useRef(false);

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

  const openCreateFlow = useCallback(() => {
    if (status === "loading") {
      pendingQuickAddAfterSessionRef.current = true;
      clickDebug("CreateFlowProvider", "openCreateFlow", "defer-until-session", "loading");
      return;
    }
    if (status !== "authenticated" || !session?.user) {
      const now = Date.now();
      if (now - lastOpenAt.current < 400) return;
      lastOpenAt.current = now;
      setPendingOpenQuickAddAfterLogin();
      setAuthUrls(getCreateAuthReturnUrls());
      setGuestOpen(true);
      return;
    }
    dispatchQuickAddNow("openCreateFlow-authenticated");
  }, [session?.user, status, dispatchQuickAddNow]);

  const openCreateFlowWithIntent = useCallback(
    (intent: CreateFlowIntent) => {
      setCreateFlowIntent(intent);
      if (status === "loading") {
        pendingQuickAddAfterSessionRef.current = true;
        clickDebug(
          "CreateFlowProvider",
          "openCreateFlowWithIntent",
          "defer-until-session",
          JSON.stringify({ mode: intent.mode, hasVertical: !!intent.vertical })
        );
        return;
      }

      if (status !== "authenticated" || !session?.user) {
        const now = Date.now();
        if (now - lastOpenAt.current < 400) return;
        lastOpenAt.current = now;
        setPendingOpenQuickAddAfterLogin();
        setAuthUrls(getCreateAuthReturnUrls());
        setGuestOpen(true);
        return;
      }
      dispatchQuickAddNow("openCreateFlowWithIntent-authenticated");
    },
    [session?.user, status, dispatchQuickAddNow]
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
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!pendingQuickAddAfterSessionRef.current) return;
    pendingQuickAddAfterSessionRef.current = false;
    dispatchQuickAddNow("session-ready-after-loading-tap");
  }, [status, session?.user, dispatchQuickAddNow]);

  /** Na succesvolle login: één keer quick-add openen als er create-intent was. */
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

    const t = window.setTimeout(() => {
      quickAddIntentScheduledRef.current = false;
      if (!hasPendingOpenQuickAddAfterLogin()) return;
      try {
        sessionStorage.removeItem(AFTER_LOGIN_CREATE_ACTION_KEY);
      } catch {
        /* ignore */
      }
      dispatchOpenQuickAdd();
    }, 200);

    return () => {
      window.clearTimeout(t);
      quickAddIntentScheduledRef.current = false;
    };
  }, [status, session?.user]);

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
    </CreateFlowContext.Provider>
  );
}

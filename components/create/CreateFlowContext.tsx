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

  const openCreateFlow = useCallback(() => {
    if (status === "loading") return;
    const now = Date.now();
    if (now - lastOpenAt.current < 400) return;
    lastOpenAt.current = now;

    // Alleen quick-add na bevestigde auth — geen dispatch voor gast of twijfelachtige sessie
    if (status !== "authenticated" || !session?.user) {
      setPendingOpenQuickAddAfterLogin();
      setAuthUrls(getCreateAuthReturnUrls());
      setGuestOpen(true);
      return;
    }
    dispatchOpenQuickAdd();
  }, [session?.user, status]);

  const handleAbandonGuestModal = useCallback(() => {
    clearPendingOpenQuickAddAfterLogin();
    setGuestOpen(false);
  }, []);

  const handleAuthNavigateFromModal = useCallback(() => {
    setGuestOpen(false);
  }, []);

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
    <CreateFlowContext.Provider value={{ openCreateFlow }}>
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

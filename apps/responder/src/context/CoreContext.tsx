import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Responder } from "../types/responder";
import { responderAPI } from "../lib/api/responder";
import { router } from "expo-router";
import { isAxiosError } from "axios";
import {
  clearResponderSession,
  getResponderId,
  removeStoredValue,
} from "../lib/storage";

interface CoreContextValue {
  responderId: string;
  responder: Responder | null;
  isLoading: boolean;
  hydrated: boolean;
  logOut: () => void;
  setResponder: (responder: Responder) => void;
}

const CoreContext = createContext<CoreContextValue | undefined>(undefined);

export function CoreProvider({ children }: { children: ReactNode }) {
  const [responderId, setResponderId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const [responder, setResponder] = useState<Responder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SecureStore is async — hydrate the responder id once on mount
  useEffect(() => {
    let cancelled = false;
    getResponderId()
      .then((id) => {
        if (cancelled) return;
        setResponderId(id ?? "");
        setHydrated(true);
      })
      .catch(() => {
        // SecureStore read failure — treat as no session rather than
        // leaving the app on the loading splash forever
        if (cancelled) return;
        setResponderId("");
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logOut = useCallback(() => {
    void (async () => {
      await clearResponderSession();
      await removeStoredValue("offline-ack-queue");
      router.replace("/verify");
    })();
  }, []);

  useEffect(() => {
    const fetchResponderDetails = async () => {
      try {
        const res = await responderAPI.getResponderDetails(responderId);
        setResponder(res);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) {
          logOut();
          return;
        }
        console.error("Failed to fetch responder details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for SecureStore hydration so isLoading stays true until the id is known
    if (!hydrated) return;

    if (responderId) {
      fetchResponderDetails();
    } else {
      queueMicrotask(() => setIsLoading(false));
    }
  }, [hydrated, responderId, logOut]);

  const contextValue = useMemo(
    () => ({
      responderId,
      responder,
      isLoading,
      hydrated,
      logOut,
      setResponder,
    }),
    [responderId, responder, isLoading, hydrated, logOut]
  );

  return (
    <CoreContext.Provider value={contextValue}>{children}</CoreContext.Provider>
  );
}

export const useCoreHook = () => {
  const context = useContext(CoreContext);
  if (!context) {
    throw new Error("useCoreHook must be used within a CoreProvider");
  }
  return context;
};

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
import {
  getEffectiveSiteId,
  getEffectiveSiteName,
  getEligibleSites,
} from "../lib/utils/sites";
import { router } from "expo-router";
import { isAxiosError } from "axios";
import {
  clearResponderSession,
  getResponderId,
  getResponderToken,
  removeStoredValue,
} from "../lib/storage";

interface CoreContextValue {
  responderId: string;
  responder: Responder | null;
  // Effective site = presence override ?? home site. Everything site-scoped
  // (WS channel, sensor/camera calls, alert cache) keys on this.
  effectiveLocationId: number | null;
  effectiveLocationName: string | null;
  isLoading: boolean;
  hydrated: boolean;
  logOut: () => void;
  setResponder: (responder: Responder) => void;
  setActiveSite: (locationId: number) => Promise<void>;
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
    // getResponderToken also warms the axios cachedToken mirror — without it,
    // a cold start that skips app/index.tsx sends every request unauthenticated
    Promise.all([getResponderId(), getResponderToken()])
      .then(([id, token]) => {
        if (cancelled) return;
        // An id without a token is a broken session, not a partial one —
        // treat it as no session so CoreGate routes to verify instead of
        // rendering tabs whose every request 401s with no way out.
        setResponderId(id && token ? id : "");
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

  // Write presence, then refetch details — the server is the source of truth
  // for the resolved site name and any concurrent membership changes. If the
  // refetch fails after the POST landed, still apply the confirmed presence
  // locally — otherwise the UI sits on the old site while the server (alerts,
  // unread count, next WS connect) already serves the new one.
  const setActiveSite = useCallback(
    async (locationId: number) => {
      if (!responderId) throw new Error("No responder session");
      const res = await responderAPI.setActiveSite(locationId);
      try {
        setResponder(await responderAPI.getResponderDetails(responderId));
      } catch {
        setResponder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activeLocationId: res.activeLocationId,
            activeLocationName:
              res.activeLocationId == null
                ? null
                : (getEligibleSites(prev).find(
                    (s) => s.locationId === res.activeLocationId
                  )?.locationName ?? null),
          };
        });
      }
    },
    [responderId]
  );

  const effectiveLocationId = getEffectiveSiteId(responder);
  const effectiveLocationName = getEffectiveSiteName(responder);

  const contextValue = useMemo(
    () => ({
      responderId,
      responder,
      effectiveLocationId,
      effectiveLocationName,
      isLoading,
      hydrated,
      logOut,
      setResponder,
      setActiveSite,
    }),
    [
      responderId,
      responder,
      effectiveLocationId,
      effectiveLocationName,
      isLoading,
      hydrated,
      logOut,
      setActiveSite,
    ]
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

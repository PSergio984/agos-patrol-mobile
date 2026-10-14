import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import type { NotificationType, Alert } from "../../../types/alert";
import { alertsAPI } from "../../../lib/api/alert";
import { flushQueue } from "../utils/offlineQueue";
import { useCoreHook } from "../../../context/CoreContext";

interface AlertsPageContextValue {
  shownAlerts: Alert[] | undefined;
  chosenAlert: Alert | null;
  isFetching: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string;
  chosenFilter: AlertTypeFilter;
  handleFilterChange: (filter: AlertTypeFilter) => void;
  handleSetChosenAlert: (alertId: string) => void;
  handleCloseAlertDetail: () => void;
  loadMore: () => void;
  refresh: () => void;
  acknowledgeAlert: (
    alertId: string,
    message: string | null,
    acknowledgedAt: string
  ) => void;
}

const AlertsPageContext = createContext<AlertsPageContextValue | undefined>(
  undefined
);

export type AlertTypeFilter = "all" | NotificationType;

export const FILTERS = [
  "all",
  "critical",
  "warning",
  "announcement",
] as AlertTypeFilter[];

export function AlertsPageProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[] | undefined>(undefined);
  const [chosenAlert, setChosenAlert] = useState<Alert | null>(null);
  const [chosenFilter, setChosenFilter] = useState<AlertTypeFilter>("all");
  const [hasMore, setHasMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string>("");

  const { responderId } = useCoreHook();

  // Pagination and request-staleness tracked in refs — FlatList's
  // onEndReached can fire twice inside one render cycle, and a filter
  // switch must invalidate any response still in flight.
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const replacingRef = useRef(false);
  const requestIdRef = useRef(0);
  const listGenRef = useRef(0);

  const fetchAlerts = useCallback(
    async (
      targetPage: number,
      filter: AlertTypeFilter,
      mode: "replace" | "append" | "refresh" = "replace"
    ) => {
      if (!responderId) return;

      // Replacing/refetching page 1 starts a new list generation — any
      // in-flight request from the previous generation must not write.
      if (mode !== "append") {
        listGenRef.current += 1;
        replacingRef.current = true;
        // The outgoing list's append slot is dead — release it so a late
        // finally can't clear the guard of a future append.
        loadingMoreRef.current = false;
      }
      const gen = listGenRef.current;
      const requestId = ++requestIdRef.current;

      if (mode === "append") {
        setIsLoadingMore(true);
      } else if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsFetching(true);
      }

      try {
        const filterType = filter === "all" ? undefined : filter;
        const res = await alertsAPI.getAlerts(
          responderId,
          targetPage,
          filterType
        );

        // Stale response — a newer request (filter change, refresh, or a
        // second append) owns the list now.
        if (gen !== listGenRef.current || requestId !== requestIdRef.current)
          return;

        if (mode === "append") {
          setAlerts((prev) => [...(prev || []), ...res.items]);
        } else {
          setAlerts(res.items);
        }
        // Page only advances on a successfully applied response — a failed
        // or superseded fetch must not leave gaps in pagination.
        pageRef.current = targetPage;
        setHasMore(res.hasMore);
        setError("");

        // A successful fetch proves connectivity — retry any
        // acknowledgements queued while offline.
        flushQueue();
      } catch {
        if (gen !== listGenRef.current) return;
        if (mode !== "append") {
          setError("Failed to fetch alerts. Please try again.");
        }
      } finally {
        // Release the append slot only if this request still holds it —
        // a stale append's finally must not unguard a newer append.
        if (mode === "append" && requestId === requestIdRef.current)
          loadingMoreRef.current = false;
        // Only the latest request clears the spinners — a superseded one
        // finishing must not hide the spinner of its replacement.
        if (gen === listGenRef.current) {
          if (mode !== "append") replacingRef.current = false;
          setIsFetching(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [responderId]
  );

  const handleFilterChange = useCallback(
    (filter: AlertTypeFilter) => {
      setChosenFilter(filter);
      // Reset pagination surface so a stray onEndReached can't fire an
      // append for the outgoing filter while the new one loads.
      setIsLoadingMore(false);
      setHasMore(false);
      setAlerts(undefined);
      fetchAlerts(1, filter);
    },
    [fetchAlerts]
  );

  const loadMore = useCallback(() => {
    // Synchronous guards — state wouldn't flip until the next render, and
    // an append must never supersede an in-flight replace/refresh (it
    // would drop the refresh response and duplicate rows on the old list).
    if (loadingMoreRef.current || replacingRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    fetchAlerts(pageRef.current + 1, chosenFilter, "append");
  }, [hasMore, chosenFilter, fetchAlerts]);

  const refresh = useCallback(() => {
    fetchAlerts(1, chosenFilter, "refresh");
  }, [chosenFilter, fetchAlerts]);

  const handleSetChosenAlert = useCallback(
    (alertId: string) => {
      const alert = alerts?.find((a) => a.id === alertId) || null;
      setChosenAlert(alert);
    },
    [alerts]
  );

  const handleCloseAlertDetail = useCallback(() => {
    setChosenAlert(null);
  }, []);

  const acknowledgeAlert = useCallback(
    (alertId: string, message: string | null, acknowledgedAt: string) => {
      setAlerts((prev) => {
        if (!prev) return prev;
        return prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                isAcknowledged: true,
                acknowledgeMessage: message,
                acknowledgedAt,
              }
            : a
        );
      });
      setChosenAlert((prev) =>
        prev && prev.id === alertId
          ? {
              ...prev,
              isAcknowledged: true,
              acknowledgeMessage: message,
              acknowledgedAt,
            }
          : prev
      );
    },
    []
  );

  // Initial fetch once the responder identity is available.
  // Deferred a tick so fetchAlerts' synchronous setIsFetching doesn't run
  // inside the effect body (cascading-render lint).
  useEffect(() => {
    if (!responderId) return;
    const id = setTimeout(() => fetchAlerts(1, "all"), 0);
    return () => clearTimeout(id);
  }, [responderId, fetchAlerts]);

  // Flush queued offline acknowledgements when the app returns to the
  // foreground (RN analogue of the PWA's window "online" listener).
  useEffect(() => {
    flushQueue().then((synced) => {
      if (synced > 0 && __DEV__) {
        console.log(`Synced ${synced} queued acknowledgement(s)`);
      }
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        flushQueue().then((synced) => {
          if (synced > 0 && __DEV__) {
            console.log(`Synced ${synced} queued acknowledgement(s)`);
          }
        });
      }
    });

    return () => sub.remove();
  }, []);

  const contextValue = useMemo(
    () => ({
      shownAlerts: alerts,
      isFetching,
      isRefreshing,
      isLoadingMore,
      hasMore,
      error,
      chosenFilter,
      chosenAlert,
      handleFilterChange,
      handleSetChosenAlert,
      handleCloseAlertDetail,
      loadMore,
      refresh,
      acknowledgeAlert,
    }),
    [
      alerts,
      isFetching,
      isRefreshing,
      isLoadingMore,
      hasMore,
      error,
      chosenFilter,
      chosenAlert,
      handleFilterChange,
      handleSetChosenAlert,
      handleCloseAlertDetail,
      loadMore,
      refresh,
      acknowledgeAlert,
    ]
  );

  return (
    <AlertsPageContext.Provider value={contextValue}>
      {children}
    </AlertsPageContext.Provider>
  );
}

export const useAlertsPageHook = () => {
  const context = useContext(AlertsPageContext);
  if (!context) {
    throw new Error(
      "useAlertsPageHook must be used within a AlertsPageProvider"
    );
  }
  return context;
};

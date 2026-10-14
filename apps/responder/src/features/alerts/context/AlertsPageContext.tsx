import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string>("");

  const { responderId } = useCoreHook();

  const fetchAlerts = useCallback(
    async (
      targetPage: number,
      filter: AlertTypeFilter,
      mode: "replace" | "append" | "refresh" = "replace"
    ) => {
      if (!responderId) return;

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

        if (mode === "append") {
          setAlerts((prev) => [...(prev || []), ...res.items]);
        } else {
          setAlerts(res.items);
        }
        setHasMore(res.hasMore);
        setError("");

        // A successful fetch proves connectivity — retry any
        // acknowledgements queued while offline.
        flushQueue();
      } catch {
        if (mode !== "append") {
          setError("Failed to fetch alerts. Please try again.");
        }
      } finally {
        setIsFetching(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [responderId]
  );

  const handleFilterChange = useCallback(
    (filter: AlertTypeFilter) => {
      setChosenFilter(filter);
      setPage(1);
      setAlerts(undefined);
      fetchAlerts(1, filter);
    },
    [fetchAlerts]
  );

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAlerts(nextPage, chosenFilter, "append");
  }, [isLoadingMore, hasMore, page, chosenFilter, fetchAlerts]);

  const refresh = useCallback(() => {
    setPage(1);
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

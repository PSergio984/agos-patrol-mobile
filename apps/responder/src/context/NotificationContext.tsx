import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { router } from "expo-router";
import type * as NotificationsTypes from "expo-notifications";
import { getNotifications } from "../lib/notifications";
import { routeForNotificationResponse } from "../lib/notificationResponse";
import { useCoreHook } from "./CoreContext";
import { alertsAPI } from "../lib/api/alert";
import {
  triggerAlertFeedback,
  type AlertSeverity,
} from "../lib/utils/alertFeedback";

interface NotificationContextValue {
  unreadCount: number;
  reduceUnreadCount: (amount: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  // Deduped by request id: some platforms also replay the launch response to
  // the listener, and getLastNotificationResponse would navigate twice for
  // the same tap.
  const handledResponseIds = useRef(new Set<string>());

  const { responderId, effectiveLocationId } = useCoreHook();

  // Unread count is scoped server-side to the responder's effective site —
  // refetch when presence changes, and drop results that resolve after a
  // switch so site A's count can't overwrite site B's.
  useEffect(() => {
    let cancelled = false;
    const fetchUnreadCount = async () => {
      try {
        const res = await alertsAPI.getUnreadAlertsCount(responderId);
        if (!cancelled) setUnreadCount(res);
      } catch (error) {
        console.error("Failed to fetch unread alerts count:", error);
      }
    };

    if (responderId) {
      fetchUnreadCount();
    }
    return () => {
      cancelled = true;
    };
  }, [responderId, effectiveLocationId]);

  // Listen for push notifications received while the app is foregrounded
  // and play in-app feedback (native equivalent of the service-worker
  // PUSH_RECEIVED message in the PWA).
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as
          Record<string, unknown> | undefined;
        triggerAlertFeedback(
          ((data?.alertType ?? data?.type) as AlertSeverity | undefined) ??
            "announcement"
        );
        setUnreadCount((prev) => prev + 1);
      }
    );
    return () => subscription.remove();
  }, []);

  // Notification taps deep-link into the alerts tab. Dispatch-bearing
  // pushes (type "alarm") carry the dispatchId — alerts.tsx resolves it to
  // a delivery and opens the detail sheet; other taps just open the list.
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const handleResponse = (
      response: NotificationsTypes.NotificationResponse
    ) => {
      const requestId = response.notification.request.identifier;
      if (handledResponseIds.current.has(requestId)) return;
      handledResponseIds.current.add(requestId);
      router.push(routeForNotificationResponse(response));
    };
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    // Cold start: a tap that launched the app is held as the "last response"
    // until consumed — the listener above only sees taps while running.
    // getLastNotificationResponse throws UnavailabilityError where the native
    // emitter lacks it (web, stale dev-client) — that's survivable, skip it.
    try {
      const launch = Notifications.getLastNotificationResponse();
      if (launch) {
        Notifications.clearLastNotificationResponse();
        handleResponse(launch);
      }
    } catch {
      // no launch response support on this runtime
    }
    return () => subscription.remove();
  }, []);

  const reduceUnreadCount = (amount: number = 1) => {
    setUnreadCount((prev) => Math.max(prev - amount, 0));
  };

  const contextValue = useMemo(
    () => ({
      unreadCount,
      reduceUnreadCount,
    }),
    [unreadCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationHook = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationHook must be used within a NotificationProvider"
    );
  }
  return context;
};

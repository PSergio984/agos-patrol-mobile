import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { router, type Href } from "expo-router";
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
  // Written by NotificationBridge's site-scoped fetch — the fetch needs
  // CoreContext, which only exists under (tabs), while the state itself must
  // live at the root so /alarm can reach it.
  setUnreadCount: Dispatch<SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

// State-only provider mounted by the ROOT layout (app/_layout.tsx): the
// /alarm takeover sits on the root Stack outside (tabs), so the badge state
// must live above the navigator for its ack to reach it (#36). Side effects
// stay in NotificationBridge below.
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const reduceUnreadCount = (amount: number = 1) => {
    setUnreadCount((prev) => Math.max(prev - amount, 0));
  };

  const contextValue = useMemo(
    () => ({
      unreadCount,
      reduceUnreadCount,
      setUnreadCount,
    }),
    [unreadCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// A launch response consumed just before a dead-session redirect clobbered
// its navigate (stored token the server rejects → /verify) is already
// cleared natively — stash its route module-wide so a post-verify remount
// can replay the takeover. Cleared once getResponderDetails proves the
// session, or at most once per app process.
let pendingLaunchRoute: Href | null = null;

// Test seam: the stash outlives mounts, so specs reset it between cases.
export const __resetPendingLaunchRoute = () => {
  pendingLaunchRoute = null;
};

// The notification side effects, mounted inside (tabs) above CoreGate: the
// response listener registers immediately, while the launch-response
// consume waits on SecureStore hydration + a stored session — NOT the ~10s
// details fetch — so a cold-start /alarm takeover is bounded by hydration,
// and a sessionless bootstrap leaves the response queued for the
// post-login remount. Requires NotificationProvider (root) and
// CoreProvider above it.
export function NotificationBridge() {
  const { responderId, responder, effectiveLocationId, hydrated } =
    useCoreHook();
  const { setUnreadCount } = useNotificationHook();
  // Deduped by request id: some platforms also replay the launch response to
  // the listener, and getLastNotificationResponse would navigate twice for
  // the same tap. Entries expire — a re-tap of the same tray notification
  // minutes later is a new user action, not a replay.
  const handledResponseIds = useRef(new Set<string>());

  // Notification taps deep-link in: alarm pushes (data.type "alarm") go to
  // the /alarm takeover screen; other dispatch-bearing pushes land on the
  // alerts tab where alerts.tsx resolves the dispatchId to a delivery and
  // opens the detail sheet; remaining taps just open the list.
  const handleResponse = useCallback(
    (response: NotificationsTypes.NotificationResponse) => {
      const requestId = response.notification.request.identifier;
      if (handledResponseIds.current.has(requestId)) return;
      handledResponseIds.current.add(requestId);
      // Replay dedup is only needed at mount — release the id after a few
      // seconds so a deliberate re-tap of the same notification still routes.
      setTimeout(() => handledResponseIds.current.delete(requestId), 5_000);
      // navigate (not push): a second alarm reuses the existing /alarm screen
      // with fresh params instead of stacking a modal over a modal, and an
      // alerts tap focuses the existing (tabs) entry rather than duplicating
      // the provider tree.
      router.navigate(routeForNotificationResponse(response));
    },
    []
  );

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
    } else {
      // The provider lives at root and outlives a logout — reset the badge
      // rather than carrying the previous session's count into the next.
      setUnreadCount(0);
    }
    return () => {
      cancelled = true;
    };
  }, [responderId, effectiveLocationId, setUnreadCount]);

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
  }, [setUnreadCount]);

  // Taps while the app runs route immediately — a live tap already has a
  // resolved auth context.
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [handleResponse]);

  // Launch-response consumption, gated on SecureStore hydration + a stored
  // session — the ~10s getResponderDetails is deliberately not awaited.
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications || !hydrated) return;

    // Replay a takeover consumed just before a dead-session redirect
    // clobbered it (see pendingLaunchRoute above).
    if (responderId && pendingLaunchRoute) {
      const route = pendingLaunchRoute;
      pendingLaunchRoute = null;
      router.navigate(route);
    }

    // No session in the store — the gate redirects to /verify and this
    // mount unmounts; leave the response queued for the post-login remount.
    if (!responderId) return;

    // Cold start: a tap that launched the app is held as the "last response"
    // until consumed — the listener above only sees taps while running.
    // getLastNotificationResponse throws UnavailabilityError where the native
    // emitter lacks it (web, stale dev-client) — that's survivable, skip it.
    try {
      const launch = Notifications.getLastNotificationResponse();
      if (!launch) return;
      Notifications.clearLastNotificationResponse();
      // Bound staleness: a response whose app was killed pre-login would
      // otherwise replay an old takeover on the next session, hours later.
      const receivedAt = launch.notification.date;
      const stale =
        typeof receivedAt === "number" &&
        Number.isFinite(receivedAt) &&
        Date.now() - receivedAt > 30 * 60_000;
      if (!stale) {
        pendingLaunchRoute = routeForNotificationResponse(launch);
        handleResponse(launch);
      }
    } catch {
      // no launch response support on this runtime
    }
  }, [hydrated, responderId, handleResponse]);

  // The stash only needs to survive until getResponderDetails confirms the
  // session — after that the takeover either landed or was already replaced.
  useEffect(() => {
    if (responder) pendingLaunchRoute = null;
  }, [responder]);

  return null;
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

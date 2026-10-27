import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import type * as NotificationsTypes from "expo-notifications";
import Constants from "expo-constants";
import { getNotifications } from "../lib/notifications";
import { ensureAlarmChannel } from "../lib/alarmChannel";
import apiClient from "../lib/api/client";
import { useCoreHook } from "../context/CoreContext";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface PushNotificationsState {
  permission: PushPermission;
  isSubscribed: boolean;
  isSubscribing: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  recheck: () => void;
}

function mapStatus(
  status: NotificationsTypes.PermissionStatus
): PushPermission {
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "default";
  }
}

async function readPermission(): Promise<PushPermission> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return "unsupported";
    const { status } = await Notifications.getPermissionsAsync();
    return mapStatus(status);
  } catch {
    return "unsupported";
  }
}

export function usePushNotifications(): PushNotificationsState {
  const { responderId } = useCoreHook();
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    if (!responderId || isSubscribing) return;

    setIsSubscribing(true);
    setError(null);
    try {
      const Notifications = getNotifications();
      if (!Notifications) {
        setPermission("unsupported");
        return;
      }
      let current = await readPermission();
      if (current === "default") {
        const { status } = await Notifications.requestPermissionsAsync();
        current = mapStatus(status);
      }
      setPermission(current);
      if (current !== "granted") return;

      // Android heads-up notifications need a channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
        // Fails loudly on purpose: Android O+ drops pushes for a missing
        // channelId, so a failed alarm channel = silent alarms.
        await ensureAlarmChannel();
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      await apiClient.post("/push/subscribe", {
        token: token.data,
        platform: Platform.OS,
        responderId,
      });

      setIsSubscribed(true);
    } catch (err) {
      if (__DEV__) console.error("Push subscription failed:", err);
      setError("subscribe_failed");
    } finally {
      setIsSubscribing(false);
    }
  }, [responderId, isSubscribing]);

  const recheck = useCallback(() => {
    void readPermission().then(setPermission);
    setError(null);
  }, []);

  // Hydrate permission on mount
  useEffect(() => {
    void readPermission().then(setPermission);
  }, []);

  // Auto-subscribe when permission is granted and we haven't tried yet.
  // The `!error` guard prevents an infinite retry loop after a failure —
  // user must tap Retry in the gate to attempt again.
  useEffect(() => {
    if (!responderId) return;
    if (permission === "granted" && !isSubscribed && !isSubscribing && !error) {
      queueMicrotask(() => void subscribe());
    }
  }, [responderId, permission, isSubscribed, isSubscribing, error, subscribe]);

  // Re-check permission when the app returns to the foreground (e.g. user
  // enabled notifications in system settings while the gate is open).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void readPermission().then(setPermission);
      }
    });
    return () => subscription.remove();
  }, []);

  return {
    permission,
    isSubscribed,
    isSubscribing,
    error,
    subscribe,
    recheck,
  };
}

import Constants from "expo-constants";
import type * as NotificationsTypes from "expo-notifications";

// expo-notifications throws at import time inside Expo Go (remote push was
// removed in SDK 53), which kills the whole JS bundle. Import it lazily so
// the app still runs there — everything else (auth, WS, screens) works.
let cached: typeof NotificationsTypes | null | undefined;

// True inside Expo Go, where remote push cannot work regardless of
// permission state — the permission gate must not block smoke tests.
export const isExpoGo = Constants.executionEnvironment === "storeClient";

export function getNotifications(): typeof NotificationsTypes | null {
  if (cached !== undefined) return cached;
  // Expo Go never carries the module — skip the require entirely. The
  // import throws and LogBox surfaces it even when caught.
  if (isExpoGo) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("expo-notifications") as typeof NotificationsTypes;
  } catch {
    cached = null;
  }
  return cached;
}

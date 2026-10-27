import { Platform } from "react-native";
import { getNotifications } from "./notifications";

export const ALARM_CHANNEL_ID = "alarm";

// Channel properties are immutable after creation on Android 8+ — this is the
// final config, and any future change to sound/vibration/importance needs a
// new channel id (e.g. "alarm_v2"). USAGE_ALARM routes the siren through the
// alarm stream so it stays loud regardless of media/notification volume.
export async function ensureAlarmChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: "Emergency alerts",
    description: "Siren for flood and blockage dispatches",
    importance: Notifications.AndroidImportance.MAX,
    sound: "siren.wav",
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    enableVibrate: true,
    enableLights: true,
    lightColor: "#dc2626",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
    },
  });
}

// Effective DND-bypass state: false when the app lacks notification-policy
// access or the user disabled bypass on the channel itself.
export async function alarmChannelBypassesDnd(): Promise<boolean> {
  // Pre-O has no channels — DND-bypass semantics don't apply, treat as fine.
  if (Platform.OS !== "android" || Platform.Version < 26) return true;
  const Notifications = getNotifications();
  if (!Notifications) return true;
  const channel =
    await Notifications.getNotificationChannelAsync(ALARM_CHANNEL_ID);
  return channel?.bypassDnd ?? false;
}

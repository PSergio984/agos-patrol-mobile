import { Vibration } from "react-native";

export type AlertSeverity =
  "alarm" | "critical" | "warning" | "blockage" | "announcement";

// Vibration patterns (in ms): [vibrate, pause, vibrate, ...]
const vibrationPatterns: Record<AlertSeverity, number[]> = {
  // Siren pulse — mirrors the alarm notification channel's pattern
  // (src/lib/alarmChannel.ts) so in-app feedback matches the heads-up.
  alarm: [0, 500, 250, 500, 250, 500],
  critical: [200, 100, 200, 100, 400],
  warning: [200, 100, 200],
  blockage: [150, 80, 150],
  announcement: [100],
};

function vibrate(pattern: number[]) {
  try {
    Vibration.vibrate(pattern);
  } catch {
    // Vibration not supported
  }
}

export function triggerAlertFeedback(severity: AlertSeverity) {
  const pattern = vibrationPatterns[severity] || vibrationPatterns.announcement;
  vibrate(pattern);
}

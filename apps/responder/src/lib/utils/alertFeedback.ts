import { Vibration } from "react-native";

export type AlertSeverity =
  "critical" | "warning" | "blockage" | "announcement";

// Vibration patterns (in ms): [vibrate, pause, vibrate, ...]
const vibrationPatterns: Record<AlertSeverity, number[]> = {
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

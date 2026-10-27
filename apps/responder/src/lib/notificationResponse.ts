import type { Href } from "expo-router";

// Structural minimum of expo-notifications' NotificationResponse — accepting
// the real type as well, but keeping tests free of the full request shape.
type NotificationResponseLike = {
  notification: { request: { content: { data?: unknown } } };
};

// Push data contract (agos-backend #36): ALARM pushes carry
// `data.type: "alarm"` and `data.alarm: { id: <dispatchId>, ... }`.
// Older/other payloads may put the dispatch id flat on data — check the
// obvious spellings before giving up. Returns null when nothing resolves.
export function dispatchIdFromNotificationData(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const alarm = d.alarm;
  const candidates = [
    alarm && typeof alarm === "object"
      ? (alarm as Record<string, unknown>).id
      : undefined,
    d.dispatchId,
    d.dispatch_id,
  ];
  for (const c of candidates) {
    const n = typeof c === "string" ? Number(c) : c;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return null;
}

// Every notification tap lands on the alerts list; a dispatch-bearing push
// also carries the dispatchId so the alert detail sheet can open on top of
// it (consumed by app/(tabs)/alerts.tsx → AlertsPageContext).
export function routeForNotificationResponse(
  response: NotificationResponseLike
): Href {
  const dispatchId = dispatchIdFromNotificationData(
    response.notification.request.content.data
  );
  return {
    pathname: "/(tabs)/alerts",
    params: dispatchId === null ? {} : { dispatchId: String(dispatchId) },
  };
}

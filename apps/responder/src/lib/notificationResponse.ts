import type { Href } from "expo-router";

// Structural minimum of expo-notifications' NotificationResponse — accepting
// the real type as well, but keeping tests free of the full request shape.
type NotificationResponseLike = {
  notification: {
    request: {
      content: {
        data?: unknown;
        title?: string | null;
        body?: string | null;
      };
    };
  };
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

// Alarm pushes take over the screen (#32): /alarm resolves the dispatchId to
// the responder's delivery and offers one-tap ack. Title/body and the alarm's
// issuedAt ride along as route params so first paint shows the push content
// even before — or without — delivery resolution. Non-alarm taps keep landing
// on the alerts list; a dispatch id there opens the detail sheet instead
// (consumed by app/(tabs)/alerts.tsx → AlertsPageContext).
export function routeForNotificationResponse(
  response: NotificationResponseLike
): Href {
  const content = response.notification.request.content;
  const data = content.data;
  const dispatchId = dispatchIdFromNotificationData(data);

  const isAlarm =
    !!data &&
    typeof data === "object" &&
    (data as Record<string, unknown>).type === "alarm";
  if (isAlarm) {
    const params: Record<string, string> = {};
    if (dispatchId !== null) params.dispatchId = String(dispatchId);
    if (content.title) params.title = content.title;
    if (content.body) params.message = content.body;
    const alarm = (data as Record<string, unknown>).alarm;
    const issuedAt =
      alarm && typeof alarm === "object"
        ? (alarm as Record<string, unknown>).issuedAt
        : undefined;
    if (typeof issuedAt === "string" && issuedAt) params.issuedAt = issuedAt;
    const locationId =
      alarm && typeof alarm === "object"
        ? (alarm as Record<string, unknown>).location_id
        : undefined;
    const locN =
      typeof locationId === "string" ? Number(locationId) : locationId;
    if (typeof locN === "number" && Number.isFinite(locN)) {
      params.locationId = String(locN);
    }
    return { pathname: "/alarm", params };
  }

  return {
    pathname: "/(tabs)/alerts",
    params: dispatchId === null ? {} : { dispatchId: String(dispatchId) },
  };
}

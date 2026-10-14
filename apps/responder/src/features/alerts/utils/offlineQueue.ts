import type { AcknowledgeNotificationPayload } from "../../../types/alert";
import { alertsAPI } from "../../../lib/api/alerts";
import { getStoredValue, setStoredValue } from "../../../lib/storage";

const QUEUE_KEY = "offline-ack-queue";

// RN port of the PWA's localStorage-backed queue (src/lib/utils/offlineQueue.ts).
// Uses the foundation's SecureStore-backed KV helpers. Note: SecureStore caps
// values at ~2048 bytes, so a very long pending queue can fail to persist —
// the try/catch mirrors the PWA's "fail silently" saveQueue behaviour.
export async function getQueue(): Promise<AcknowledgeNotificationPayload[]> {
  try {
    const raw = await getStoredValue(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: AcknowledgeNotificationPayload[]) {
  try {
    await setStoredValue(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage may be full or unavailable — fail silently
  }
}

export async function enqueueAcknowledgement(
  payload: AcknowledgeNotificationPayload
) {
  const queue = await getQueue();
  // Avoid duplicates for the same deliveryId
  if (!queue.some((item) => item.deliveryId === payload.deliveryId)) {
    queue.push(payload);
    await saveQueue(queue);
  }
}

let flushPromise: Promise<number> | null = null;

export function flushQueue(): Promise<number> {
  // Guard against concurrent runs: two rapid flush triggers would otherwise
  // each read the same queue snapshot and double-submit every queued
  // acknowledgement.
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    try {
      const queue = await getQueue();
      if (queue.length === 0) return 0;

      let synced = 0;
      const remaining: AcknowledgeNotificationPayload[] = [];

      for (const payload of queue) {
        try {
          await alertsAPI.acknowledgeNotification(payload);
          synced++;
        } catch {
          remaining.push(payload);
        }
      }

      await saveQueue(remaining);
      return synced;
    } finally {
      flushPromise = null;
    }
  })();

  return flushPromise;
}

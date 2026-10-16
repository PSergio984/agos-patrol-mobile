import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Alert } from "../../../types/alert";

// Exported for tests — a rename here must not silently desync assertions.
export const CACHE_KEY = "alerts-cache-v1";

interface CachedAlerts {
  cachedAt: string;
  // Site the snapshot belongs to — a foreign site's list must never render
  // under the current one. Absent on payloads written before multi-site.
  locationId?: number | null;
  items: Alert[];
}

// Last-fetched first page of alerts, for offline opens (issue #17). Deliberately
// read-only: cache write happens only on a successful replace-mode fetch, so a
// stale page never outlives the last real refresh. AsyncStorage, not
// SecureStore — the KV cap (~2KB) can't hold a page of alerts and the data
// isn't sensitive.
export async function cacheAlerts(
  locationId: number | null,
  items: Alert[]
): Promise<void> {
  try {
    const payload: CachedAlerts = {
      cachedAt: new Date().toISOString(),
      locationId,
      items,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Cache is best-effort — a failed write must never break the live path.
  }
}

export async function readCachedAlerts(
  locationId: number | null
): Promise<CachedAlerts | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAlerts;
    if (!Array.isArray(parsed.items)) return null;
    // Reject only a known mismatch — when either side is unknown (responder
    // not loaded yet, or a pre-multi-site snapshot) the cache is still the
    // best available guess.
    if (
      locationId != null &&
      parsed.locationId != null &&
      parsed.locationId !== locationId
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

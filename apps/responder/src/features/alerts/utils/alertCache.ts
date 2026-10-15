import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Alert } from "../../../types/alert";

// Exported for tests — a rename here must not silently desync assertions.
export const CACHE_KEY = "alerts-cache-v1";

interface CachedAlerts {
  cachedAt: string;
  items: Alert[];
}

// Last-fetched first page of alerts, for offline opens (issue #17). Deliberately
// read-only: cache write happens only on a successful replace-mode fetch, so a
// stale page never outlives the last real refresh. AsyncStorage, not
// SecureStore — the KV cap (~2KB) can't hold a page of alerts and the data
// isn't sensitive.
export async function cacheAlerts(items: Alert[]): Promise<void> {
  try {
    const payload: CachedAlerts = {
      cachedAt: new Date().toISOString(),
      items,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Cache is best-effort — a failed write must never break the live path.
  }
}

export async function readCachedAlerts(): Promise<CachedAlerts | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAlerts;
    return Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

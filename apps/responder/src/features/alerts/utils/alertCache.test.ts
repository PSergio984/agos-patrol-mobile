import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_KEY, cacheAlerts, readCachedAlerts } from "./alertCache";
import type { Alert } from "../../../types/alert";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const ALERT: Alert = {
  id: "delivery-1",
  dispatchId: 7,
  type: "blockage",
  title: "Blockage detected",
  message: "A blockage has been detected",
  timestamp: "2026-10-15T00:00:00Z",
  isAcknowledged: false,
  acknowledgedAt: null,
  acknowledgeMessage: null,
  claimedBy: null,
  claimedByName: null,
  claimedAt: null,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("alertCache site scoping", () => {
  it("serves cached alerts when the stored site matches", async () => {
    await cacheAlerts(1, [ALERT]);
    const cached = await readCachedAlerts(1);
    expect(cached?.items).toHaveLength(1);
    expect(cached?.items[0].id).toBe("delivery-1");
  });

  it("returns null when the stored site does not match the current site", async () => {
    await cacheAlerts(1, [ALERT]);
    expect(await readCachedAlerts(2)).toBeNull();
  });

  it("still serves legacy payloads that carry no site id", async () => {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ cachedAt: "2026-10-15T00:30:00Z", items: [ALERT] })
    );
    expect(await readCachedAlerts(2)).not.toBeNull();
  });

  it("serves the last-known cache when the current site is unknown", async () => {
    await cacheAlerts(1, [ALERT]);
    expect(await readCachedAlerts(null)).not.toBeNull();
  });
});

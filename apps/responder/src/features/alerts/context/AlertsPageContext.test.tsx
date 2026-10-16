import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AlertsPageProvider, useAlertsPageHook } from "./AlertsPageContext";
import { CACHE_KEY } from "../utils/alertCache";
import type { Alert, ClaimResponse } from "../../../types/alert";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockWsCallbacks: Record<string, (data: unknown) => void> = {};

// Mutable so a test can simulate a site switch by flipping
// effectiveLocationId and re-rendering.
const mockCore = {
  responderId: "r1",
  responder: { locationId: 1, activeLocationId: null as number | null },
  effectiveLocationId: 1 as number | null,
};

jest.mock("../../../context/CoreContext", () => ({
  useCoreHook: () => mockCore,
}));

jest.mock("../../../context/WebsocketContext", () => ({
  useWebSocketMessage: (type: string, cb: (data: unknown) => void) => {
    mockWsCallbacks[type] = cb;
  },
}));

jest.mock("../utils/offlineQueue", () => ({
  flushQueue: jest.fn<() => Promise<number>>().mockResolvedValue(0),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockGetAlerts =
  jest.fn<() => Promise<{ items: Alert[]; hasMore: boolean }>>();
const mockClaimAlert =
  jest.fn<(dispatchId: number) => Promise<ClaimResponse>>();
jest.mock("../../../lib/api/alert", () => ({
  alertsAPI: {
    getAlerts: () => mockGetAlerts(),
    claimAlert: (dispatchId: number) => mockClaimAlert(dispatchId),
  },
}));

const BLOCKAGE_ALERT: Alert = {
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

function wrapper({ children }: { children: ReactNode }) {
  return <AlertsPageProvider>{children}</AlertsPageProvider>;
}

// The initial fetch fires via a deferred setTimeout and the offline path hops
// through the AsyncStorage mock — drain both inside act so assertions see the
// settled state rather than racing the flush.
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockCore.effectiveLocationId = 1;
  mockGetAlerts.mockResolvedValue({
    items: [BLOCKAGE_ALERT],
    hasMore: false,
  });
});

describe("AlertsPageContext claim", () => {
  it("claimAlert marks the alert claimed in list and detail", async () => {
    mockClaimAlert.mockResolvedValue({
      dispatchId: 7,
      claimedBy: "r1",
      claimedByName: "Danny Cleaner",
      claimedAt: "2026-10-15T01:00:00Z",
    });

    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await waitFor(() => expect(result.current.shownAlerts).toHaveLength(1));

    await act(async () => {
      await result.current.claimAlert(BLOCKAGE_ALERT);
    });

    expect(mockClaimAlert).toHaveBeenCalledWith(7);
    expect(result.current.shownAlerts![0].claimedByName).toBe("Danny Cleaner");
  });

  it("incoming alert_claimed WS event marks the alert", async () => {
    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await waitFor(() => expect(result.current.shownAlerts).toHaveLength(1));

    await act(async () => {
      mockWsCallbacks["alert_claimed"]({
        dispatch_id: 7,
        claimed_by: "other-responder",
        claimed_by_name: "Other Responder",
        claimed_at: "2026-10-15T01:00:00Z",
      });
    });

    expect(result.current.shownAlerts![0].claimedByName).toBe(
      "Other Responder"
    );
  });

  it("WS event for another dispatch leaves the alert untouched", async () => {
    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await waitFor(() => expect(result.current.shownAlerts).toHaveLength(1));

    await act(async () => {
      mockWsCallbacks["alert_claimed"]({
        dispatch_id: 999,
        claimed_by: "other-responder",
        claimed_by_name: "Other Responder",
        claimed_at: "2026-10-15T01:00:00Z",
      });
    });

    expect(result.current.shownAlerts![0].claimedBy).toBeNull();
    expect(result.current.shownAlerts![0].claimedByName).toBeNull();
  });

  it("claim errors propagate to the caller", async () => {
    mockClaimAlert.mockRejectedValue(new Error("already claimed"));

    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await waitFor(() => expect(result.current.shownAlerts).toHaveLength(1));

    await expect(
      act(async () => {
        await result.current.claimAlert(BLOCKAGE_ALERT);
      })
    ).rejects.toThrow("already claimed");
  });
});

describe("offline read-cache", () => {
  it("serves cached alerts + offline flag when fetch fails", async () => {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        cachedAt: "2026-10-15T00:30:00Z",
        items: [BLOCKAGE_ALERT],
      })
    );
    mockGetAlerts.mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await settle();

    expect(result.current.isOfflineCache).toBe(true);
    expect(result.current.shownAlerts).toHaveLength(1);
    expect(result.current.shownAlerts![0].id).toBe("delivery-1");
    expect(result.current.error).toBe("");
  });

  it("writes the cache on successful fetch and clears the flag", async () => {
    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await settle();
    expect(result.current.shownAlerts).toHaveLength(1);

    expect(result.current.isOfflineCache).toBe(false);
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).items[0].id).toBe("delivery-1");
  });

  it("keeps the error path when fetch fails and cache is empty", async () => {
    mockGetAlerts.mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useAlertsPageHook(), { wrapper });
    await settle();

    expect(result.current.error).toBe(
      "Failed to fetch alerts. Please try again."
    );
    expect(result.current.isOfflineCache).toBe(false);
    expect(result.current.shownAlerts ?? []).toHaveLength(0);
  });
});

describe("site switch", () => {
  it("resets the list and refetches when the effective site changes", async () => {
    const { result, rerender } = await renderHook(() => useAlertsPageHook(), {
      wrapper,
    });
    await settle();
    expect(result.current.shownAlerts).toHaveLength(1);
    expect(mockGetAlerts).toHaveBeenCalledTimes(1);

    mockCore.effectiveLocationId = 2;
    await act(async () => {
      rerender({});
    });
    await settle();

    expect(mockGetAlerts).toHaveBeenCalledTimes(2);
    expect(result.current.shownAlerts).toHaveLength(1);
  });

  it("does not refetch on unrelated rerenders", async () => {
    const { rerender } = await renderHook(() => useAlertsPageHook(), {
      wrapper,
    });
    await settle();

    await act(async () => {
      rerender({});
    });
    await settle();

    expect(mockGetAlerts).toHaveBeenCalledTimes(1);
  });

  it("does not serve the previous site's cache after switching", async () => {
    // Seed site 1's snapshot via a successful fetch, then go offline.
    const { result, rerender } = await renderHook(() => useAlertsPageHook(), {
      wrapper,
    });
    await settle();
    expect(result.current.shownAlerts).toHaveLength(1);

    mockGetAlerts.mockRejectedValue(new Error("network down"));
    mockCore.effectiveLocationId = 2;
    await act(async () => {
      rerender({});
    });
    await settle();

    expect(result.current.isOfflineCache).toBe(false);
    expect(result.current.shownAlerts ?? []).toHaveLength(0);
  });
});

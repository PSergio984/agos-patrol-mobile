import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AlertsPageProvider, useAlertsPageHook } from "./AlertsPageContext";
import type { Alert, ClaimResponse } from "../../../types/alert";

const mockWsCallbacks: Record<string, (data: unknown) => void> = {};

jest.mock("../../../context/CoreContext", () => ({
  useCoreHook: () => ({ responderId: "r1", responder: { locationId: 1 } }),
}));

jest.mock("../../../context/WebsocketContext", () => ({
  useWebSocketMessage: (type: string, cb: (data: unknown) => void) => {
    mockWsCallbacks[type] = cb;
  },
}));

jest.mock("../utils/offlineQueue", () => ({
  flushQueue: jest.fn<() => Promise<number>>().mockResolvedValue(0),
}));

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

describe("AlertsPageContext claim", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAlerts.mockResolvedValue({
      items: [BLOCKAGE_ALERT],
      hasMore: false,
    });
  });

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

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AcknowledgeNotification } from "./PageComponents";
import type {
  AcknowledgeNotificationPayload,
  AcknowledgeNotificationResponse,
  Alert,
} from "../../../../../types/alert";

const CHOSEN_ALERT: Alert = {
  id: "delivery-1",
  dispatchId: 7,
  type: "alarm",
  title: "Flood alarm",
  message: "Siren dispatched",
  timestamp: "2026-10-15T00:00:00Z",
  isAcknowledged: false,
  acknowledgedAt: null,
  acknowledgeMessage: null,
  claimedBy: null,
  claimedByName: null,
  claimedAt: null,
};

const mockAcknowledgeAlert = jest.fn();
const mockReduceUnreadCount = jest.fn();
const mockAcknowledgeNotification =
  jest.fn<
    (
      payload: AcknowledgeNotificationPayload
    ) => Promise<AcknowledgeNotificationResponse>
  >();
const mockEnqueue =
  jest.fn<(p: AcknowledgeNotificationPayload) => Promise<void>>();

jest.mock("../../../../../context/CoreContext", () => ({
  useCoreHook: () => ({ responderId: "r1" }),
}));

jest.mock("../../../context/AlertsPageContext", () => ({
  useAlertsPageHook: () => ({
    chosenAlert: CHOSEN_ALERT,
    acknowledgeAlert: mockAcknowledgeAlert,
  }),
}));

jest.mock("../../../../../context/NotificationContext", () => ({
  useNotificationHook: () => ({ reduceUnreadCount: mockReduceUnreadCount }),
}));

jest.mock("../../../../../context/I18nContext", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../../../lib/api/alert", () => ({
  alertsAPI: {
    acknowledgeNotification: (payload: AcknowledgeNotificationPayload) =>
      mockAcknowledgeNotification(payload),
  },
}));

jest.mock("../../../utils/offlineQueue", () => ({
  enqueueAcknowledgement: (payload: AcknowledgeNotificationPayload) =>
    mockEnqueue(payload),
}));

const pressAcknowledge = async () => {
  const screen = await render(<AcknowledgeNotification />);
  await fireEvent.press(screen.getByText("alerts.acknowledge"));
  await waitFor(() => expect(mockAcknowledgeAlert).toHaveBeenCalled());
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AcknowledgeNotification", () => {
  it("marks the alert acknowledged on success", async () => {
    mockAcknowledgeNotification.mockResolvedValue({
      acknowledgedAt: "2026-10-15T01:00:00Z",
      acknowledgeMessage: null,
    });

    await pressAcknowledge();

    expect(mockAcknowledgeAlert).toHaveBeenCalledWith(
      "delivery-1",
      null,
      "2026-10-15T01:00:00Z"
    );
    expect(mockReduceUnreadCount).toHaveBeenCalledWith(1);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("treats 409 as already-acked success — no offline retry queued", async () => {
    mockAcknowledgeNotification.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { acknowledgedAt: "2026-10-15T02:00:00Z" },
      },
    });

    await pressAcknowledge();

    expect(mockAcknowledgeAlert).toHaveBeenCalledWith(
      "delivery-1",
      null,
      "2026-10-15T02:00:00Z"
    );
    expect(mockReduceUnreadCount).toHaveBeenCalledWith(1);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("queues the acknowledgement for retry on connection failure", async () => {
    mockAcknowledgeNotification.mockRejectedValue(new Error("network down"));

    await pressAcknowledge();

    expect(mockEnqueue).toHaveBeenCalledWith({
      message: null,
      responderId: "r1",
      deliveryId: "delivery-1",
    });
    expect(mockAcknowledgeAlert).toHaveBeenCalledWith(
      "delivery-1",
      null,
      expect.any(String)
    );
  });
});

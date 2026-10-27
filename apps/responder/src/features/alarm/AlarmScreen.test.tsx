import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AlarmScreen from "./AlarmScreen";
import type {
  AcknowledgeNotificationPayload,
  AcknowledgeNotificationResponse,
  Alert,
  AlertPaginatedResponse,
} from "../../types/alert";
import type { Responder } from "../../types/responder";

const ALARM_ALERT: Alert = {
  id: "delivery-9",
  dispatchId: 7,
  type: "alarm",
  title: "Flood alarm",
  message: "Water level critical",
  timestamp: "2026-10-15T00:00:00Z",
  isAcknowledged: false,
  acknowledgedAt: null,
  acknowledgeMessage: null,
  claimedBy: null,
  claimedByName: null,
  claimedAt: null,
};

let mockParams: Record<string, string> = {};
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn<() => boolean>();
jest.mock("expo-router", () => ({
  router: {
    push: (href: unknown) => mockPush(href),
    replace: (href: unknown) => mockReplace(href),
    back: () => mockBack(),
    canGoBack: () => mockCanGoBack(),
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual(
    "react-native"
  ) as typeof import("react-native");
  return { SafeAreaView: View };
});

const mockGetResponderId = jest.fn<() => Promise<string | null>>();
const mockGetResponderToken = jest.fn<() => Promise<string | null>>();
jest.mock("../../lib/storage", () => ({
  getResponderId: () => mockGetResponderId(),
  getResponderToken: () => mockGetResponderToken(),
}));

const mockGetAlerts =
  jest.fn<
    (responderId: string, page: number) => Promise<AlertPaginatedResponse>
  >();
const mockAcknowledgeNotification =
  jest.fn<
    (
      payload: AcknowledgeNotificationPayload
    ) => Promise<AcknowledgeNotificationResponse>
  >();
jest.mock("../../lib/api/alert", () => ({
  alertsAPI: {
    getAlerts: (responderId: string, page: number) =>
      mockGetAlerts(responderId, page),
    acknowledgeNotification: (payload: AcknowledgeNotificationPayload) =>
      mockAcknowledgeNotification(payload),
  },
}));

const mockGetResponderDetails =
  jest.fn<(responderId: string) => Promise<Responder>>();
jest.mock("../../lib/api/responder", () => ({
  responderAPI: {
    getResponderDetails: (responderId: string) =>
      mockGetResponderDetails(responderId),
  },
}));

const mockEnqueue =
  jest.fn<(p: AcknowledgeNotificationPayload) => Promise<void>>();
jest.mock("../alerts/utils/offlineQueue", () => ({
  enqueueAcknowledgement: (payload: AcknowledgeNotificationPayload) =>
    mockEnqueue(payload),
}));

jest.mock("../../context/I18nContext", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const RESPONDER: Responder = {
  id: "r1",
  firstName: "Ana",
  lastName: "Santos",
  status: "active",
  phoneNumber: "0917",
  locationId: 1,
  locationName: "Home Site",
  activeLocationId: null,
  activeLocationName: null,
  deployments: [
    {
      id: 9,
      locationId: 7,
      locationName: "Riverside Post",
      startsAt: "2026-01-01T00:00:00Z",
      endsAt: null,
      plannedEndsAt: null,
      createdBy: "admin",
    },
  ],
  createdAt: "2026-01-01T00:00:00Z",
  activatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { dispatchId: "7", title: "Push title", message: "Push body" };
  mockGetResponderId.mockResolvedValue("r1");
  mockGetResponderToken.mockResolvedValue("tok");
  mockGetAlerts.mockResolvedValue({ items: [ALARM_ALERT], hasMore: false });
  mockGetResponderDetails.mockResolvedValue(RESPONDER);
  mockCanGoBack.mockReturnValue(true);
});

describe("AlarmScreen", () => {
  it("shows a spinner while resolving the delivery", async () => {
    mockGetAlerts.mockReturnValue(
      new Promise<AlertPaginatedResponse>(() => {})
    );
    const screen = await render(<AlarmScreen />);
    expect(
      screen.root?.queryAll((i) => i.type === "ActivityIndicator")
    ).toHaveLength(1);
    expect(screen.queryByText("alerts.acknowledge")).toBeNull();
    // Push-carried content still paints immediately.
    expect(screen.getByText("Push title")).toBeTruthy();
  });

  it("resolves the delivery and wires ack to its deliveryId", async () => {
    mockAcknowledgeNotification.mockResolvedValue({
      acknowledgedAt: "2026-10-15T01:00:00Z",
      acknowledgeMessage: null,
    });
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alerts.acknowledge"));
    // Resolved delivery content replaces the push-carried params.
    expect(screen.getByText("Flood alarm")).toBeTruthy();
    expect(mockGetAlerts).toHaveBeenCalledWith("r1", 1);

    await fireEvent.press(screen.getByText("alerts.acknowledge"));
    await waitFor(() => screen.getByText("alerts.acknowledged"));

    expect(mockAcknowledgeNotification).toHaveBeenCalledWith({
      message: null,
      responderId: "r1",
      deliveryId: "delivery-9",
    });
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("shows push content and hides ack when the delivery is unresolvable", async () => {
    mockGetAlerts.mockResolvedValue({ items: [], hasMore: false });
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alarm.viewDetails"));
    expect(screen.getByText("Push title")).toBeTruthy();
    expect(screen.getByText("Push body")).toBeTruthy();
    expect(screen.queryByText("alerts.acknowledge")).toBeNull();
  });

  it("stays unresolved without calling the API when no dispatchId arrives", async () => {
    mockParams = {};
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alarm.viewDetails"));
    expect(mockGetAlerts).not.toHaveBeenCalled();
    expect(screen.getByText("alarm.fallbackTitle")).toBeTruthy();
    expect(screen.queryByText("alerts.acknowledge")).toBeNull();
  });

  it("treats 409 as already-acked success — no offline retry queued", async () => {
    mockAcknowledgeNotification.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: {} },
    });
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alerts.acknowledge"));
    await fireEvent.press(screen.getByText("alerts.acknowledge"));
    await waitFor(() => screen.getByText("alerts.acknowledged"));

    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("queues the acknowledgement for retry on connection failure", async () => {
    mockAcknowledgeNotification.mockRejectedValue(new Error("network down"));
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alerts.acknowledge"));
    await fireEvent.press(screen.getByText("alerts.acknowledge"));
    await waitFor(() => screen.getByText("alerts.acknowledged"));

    expect(mockEnqueue).toHaveBeenCalledWith({
      message: null,
      responderId: "r1",
      deliveryId: "delivery-9",
    });
  });

  it("shows the acked state directly when the delivery is already acked", async () => {
    mockGetAlerts.mockResolvedValue({
      items: [{ ...ALARM_ALERT, isAcknowledged: true }],
      hasMore: false,
    });
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alerts.acknowledged"));
    expect(screen.queryByText("alerts.acknowledge")).toBeNull();
  });

  it("exits the resolving state when SecureStore reads fail", async () => {
    mockGetResponderId.mockRejectedValue(new Error("keystore locked"));
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alarm.viewDetails"));
    expect(screen.getByText("Push title")).toBeTruthy();
    expect(mockGetAlerts).not.toHaveBeenCalled();
  });

  it("shows the alarm's site name when the push carries a matched locationId", async () => {
    mockParams.locationId = "7";
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("Riverside Post"));
    expect(mockGetResponderDetails).toHaveBeenCalledWith("r1");
  });

  it("falls back to the generic site label without a locationId param", async () => {
    const screen = await render(<AlarmScreen />);

    await waitFor(() => screen.getByText("alarm.viewDetails"));
    expect(screen.getByText("alarm.siteLabel")).toBeTruthy();
    expect(mockGetResponderDetails).not.toHaveBeenCalled();
  });

  it("View details replaces onto the alerts sheet path", async () => {
    const screen = await render(<AlarmScreen />);
    await waitFor(() => screen.getByText("alarm.viewDetails"));

    await fireEvent.press(screen.getByText("alarm.viewDetails"));
    // replace — the modal must leave the stack, not push a second (tabs).
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(tabs)/alerts",
      params: { dispatchId: "7" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("dismisses via the close control", async () => {
    const screen = await render(<AlarmScreen />);
    await waitFor(() => screen.getByText("alarm.viewDetails"));

    await fireEvent.press(screen.getByLabelText("alarm.dismiss"));
    expect(mockBack).toHaveBeenCalled();
  });
});

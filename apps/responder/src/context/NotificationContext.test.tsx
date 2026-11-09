import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { Href } from "expo-router";
import {
  __resetPendingLaunchRoute,
  NotificationBridge,
  NotificationProvider,
} from "./NotificationContext";

const mockNavigate = jest.fn<(href: Href) => void>();
jest.mock("expo-router", () => ({
  router: { navigate: (href: Href) => mockNavigate(href) },
}));

// Reassigned per test — the factory reads the current value every render.
let mockCore: {
  responderId: string;
  responder: object | null;
  effectiveLocationId: number | null;
  hydrated: boolean;
};
jest.mock("./CoreContext", () => ({
  useCoreHook: () => mockCore,
}));

jest.mock("../lib/api/alert", () => ({
  alertsAPI: { getUnreadAlertsCount: () => Promise.resolve(0) },
}));

jest.mock("../lib/utils/alertFeedback", () => ({
  triggerAlertFeedback: jest.fn(),
}));

const mockGetLastResponse = jest.fn();
const mockClearLastResponse = jest.fn();
const mockRemove = jest.fn();
jest.mock("../lib/notifications", () => ({
  getNotifications: () => ({
    addNotificationResponseReceivedListener: () => ({ remove: mockRemove }),
    addNotificationReceivedListener: () => ({ remove: mockRemove }),
    getLastNotificationResponse: () => mockGetLastResponse(),
    clearLastNotificationResponse: () => mockClearLastResponse(),
  }),
}));

const LAUNCH_RESPONSE = {
  notification: {
    date: Date.now(),
    request: {
      identifier: "req-1",
      content: {
        title: "Flood alarm",
        body: "Water level critical",
        data: { type: "alarm", alarm: { id: 7, location_id: 3 } },
      },
    },
  },
};

const core = (over: Partial<typeof mockCore> = {}) => ({
  responderId: "",
  responder: null,
  effectiveLocationId: null,
  hydrated: false,
  ...over,
});

// The real provider wraps the bridge so useNotificationHook resolves.
const renderBridge = () =>
  render(
    <NotificationProvider>
      <NotificationBridge />
    </NotificationProvider>
  );

describe("NotificationBridge launch-response gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetPendingLaunchRoute();
    mockGetLastResponse.mockReturnValue(null);
    mockCore = core();
  });

  it("does not consume the launch response before hydration", async () => {
    await renderBridge();
    expect(mockGetLastResponse).not.toHaveBeenCalled();
  });

  it("leaves the response queued when hydrated with no session", async () => {
    mockCore = core({ hydrated: true });
    await renderBridge();
    expect(mockGetLastResponse).not.toHaveBeenCalled();
  });

  it("consumes and navigates once a stored session hydrates", async () => {
    mockCore = core({ hydrated: true, responderId: "r1" });
    mockGetLastResponse.mockReturnValue(LAUNCH_RESPONSE);
    await renderBridge();
    expect(mockClearLastResponse).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/alarm" })
    );
  });

  it("clears but does not navigate a stale launch response", async () => {
    mockCore = core({ hydrated: true, responderId: "r1" });
    mockGetLastResponse.mockReturnValue({
      notification: {
        ...LAUNCH_RESPONSE.notification,
        date: Date.now() - 31 * 60_000,
      },
    });
    await renderBridge();
    expect(mockClearLastResponse).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("replays a stashed takeover on the post-verify remount", async () => {
    // Mount 1: stored-but-dead session — consume fires, the stash survives
    // because getResponderDetails never resolves.
    mockCore = core({ hydrated: true, responderId: "dead" });
    mockGetLastResponse.mockReturnValue(LAUNCH_RESPONSE);
    const first = await renderBridge();
    await first.unmount();

    // Mount 2: post-verify session — the native response is already
    // consumed, so the stash replays the takeover.
    mockNavigate.mockClear();
    mockGetLastResponse.mockReturnValue(null);
    mockCore = core({ hydrated: true, responderId: "new" });
    await renderBridge();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/alarm" })
    );
  });

  it("drops the stash once the details fetch proves the session", async () => {
    mockCore = core({
      hydrated: true,
      responderId: "r1",
      responder: { id: "r1" },
    });
    mockGetLastResponse.mockReturnValue(LAUNCH_RESPONSE);
    const first = await renderBridge();
    await first.unmount();

    mockNavigate.mockClear();
    mockGetLastResponse.mockReturnValue(null);
    mockCore = core({ hydrated: true, responderId: "r1" });
    await renderBridge();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

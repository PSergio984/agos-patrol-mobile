import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Platform } from "react-native";

import { alarmChannelBypassesDnd, ensureAlarmChannel } from "./alarmChannel";

const mockSetChannel = jest.fn<() => Promise<null>>();
const mockGetChannel = jest.fn<() => Promise<{ bypassDnd: boolean } | null>>();
const mockGetNotifications = jest.fn<() => object | null>();

jest.mock("./notifications", () => ({
  getNotifications: () => mockGetNotifications(),
}));

const fakeNotifications = {
  setNotificationChannelAsync: mockSetChannel,
  getNotificationChannelAsync: mockGetChannel,
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidAudioUsage: { ALARM: 4 },
};

const originalVersion = Object.getOwnPropertyDescriptor(Platform, "Version");

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  if (originalVersion) {
    Object.defineProperty(Platform, "Version", originalVersion);
  } else {
    delete (Platform as { Version?: number }).Version;
  }
});

describe("ensureAlarmChannel", () => {
  it("creates the alarm channel with ALARM usage and the siren", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetNotifications.mockReturnValue(fakeNotifications);

    await ensureAlarmChannel();

    expect(mockSetChannel).toHaveBeenCalledWith(
      "alarm",
      expect.objectContaining({
        sound: "siren.wav",
        bypassDnd: true,
        importance: 5,
        audioAttributes: expect.objectContaining({ usage: 4 }),
      })
    );
  });

  it("does nothing on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    mockGetNotifications.mockReturnValue(fakeNotifications);

    await ensureAlarmChannel();

    expect(mockSetChannel).not.toHaveBeenCalled();
  });

  it("does nothing when expo-notifications is unavailable (Expo Go)", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetNotifications.mockReturnValue(null);

    await ensureAlarmChannel();

    expect(mockSetChannel).not.toHaveBeenCalled();
  });
});

describe("alarmChannelBypassesDnd", () => {
  it("reflects the channel's bypassDnd flag on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetNotifications.mockReturnValue(fakeNotifications);
    mockGetChannel.mockResolvedValue({ bypassDnd: true });

    await expect(alarmChannelBypassesDnd()).resolves.toBe(true);
  });

  it("is false when the channel does not exist yet", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetNotifications.mockReturnValue(fakeNotifications);
    mockGetChannel.mockResolvedValue(null);

    await expect(alarmChannelBypassesDnd()).resolves.toBe(false);
  });

  it("is true on iOS, where no DND grant exists", async () => {
    jest.replaceProperty(Platform, "OS", "ios");

    await expect(alarmChannelBypassesDnd()).resolves.toBe(true);
  });

  it("is true below Android 8, where channels do not exist", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    Object.defineProperty(Platform, "Version", {
      value: 25,
      configurable: true,
    });

    await expect(alarmChannelBypassesDnd()).resolves.toBe(true);
  });

  it("is true when expo-notifications is unavailable (Expo Go)", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetNotifications.mockReturnValue(null);

    await expect(alarmChannelBypassesDnd()).resolves.toBe(true);
  });
});

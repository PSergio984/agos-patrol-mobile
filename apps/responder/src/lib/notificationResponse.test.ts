import { describe, expect, it } from "@jest/globals";
import {
  dispatchIdFromNotificationData,
  routeForNotificationResponse,
} from "./notificationResponse";

const responseWithData = (data: unknown) => ({
  notification: { request: { content: { data } } },
});

describe("dispatchIdFromNotificationData", () => {
  it("reads the dispatchId from data.alarm.id (backend #36 contract)", () => {
    const data = {
      type: "alarm",
      alarm: { id: 42, severity: "alarm", location_id: 1, issuedAt: "x" },
    };
    expect(dispatchIdFromNotificationData(data)).toBe(42);
  });

  it("accepts a numeric string id", () => {
    expect(dispatchIdFromNotificationData({ alarm: { id: "17" } })).toBe(17);
  });

  it("falls back to a flat dispatchId / dispatch_id on data", () => {
    expect(dispatchIdFromNotificationData({ dispatchId: 9 })).toBe(9);
    expect(dispatchIdFromNotificationData({ dispatch_id: 11 })).toBe(11);
  });

  it("returns null for missing or malformed payloads", () => {
    expect(dispatchIdFromNotificationData(undefined)).toBeNull();
    expect(dispatchIdFromNotificationData(null)).toBeNull();
    expect(dispatchIdFromNotificationData("alarm")).toBeNull();
    expect(dispatchIdFromNotificationData({ type: "alarm" })).toBeNull();
    expect(dispatchIdFromNotificationData({ alarm: { id: "abc" } })).toBeNull();
  });
});

describe("routeForNotificationResponse", () => {
  it("routes alarm pushes to the takeover screen with pass-through params", () => {
    expect(
      routeForNotificationResponse({
        notification: {
          request: {
            content: {
              title: "FLOOD ALARM",
              body: "Evacuate the area",
              data: {
                type: "alarm",
                alarm: {
                  id: 42,
                  severity: "alarm",
                  location_id: 1,
                  issuedAt: "2026-10-15T00:00:00Z",
                },
              },
            },
          },
        },
      })
    ).toEqual({
      pathname: "/alarm",
      params: {
        dispatchId: "42",
        title: "FLOOD ALARM",
        message: "Evacuate the area",
        issuedAt: "2026-10-15T00:00:00Z",
        locationId: "1",
      },
    });
  });

  it("routes an alarm push without a dispatchId to the bare takeover screen", () => {
    expect(
      routeForNotificationResponse(responseWithData({ type: "alarm" }))
    ).toEqual({ pathname: "/alarm", params: {} });
  });

  it("deep-links non-alarm pushes to alerts with the dispatchId param", () => {
    // An alarm-shaped payload without type "alarm" keeps the old behavior.
    expect(
      routeForNotificationResponse(responseWithData({ alarm: { id: 42 } }))
    ).toEqual({
      pathname: "/(tabs)/alerts",
      params: { dispatchId: "42" },
    });
  });

  it("falls back to the bare alerts list when no dispatchId resolves", () => {
    expect(
      routeForNotificationResponse(responseWithData({ type: "announcement" }))
    ).toEqual({ pathname: "/(tabs)/alerts", params: {} });
  });
});

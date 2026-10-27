import { describe, expect, it } from "@jest/globals";
import { isValidElement } from "react";
import { Siren } from "lucide-react-native";
import {
  getBadgeColor,
  getBadgeTextColor,
  getContainerBorderColor,
  getIcon,
} from "./getClasses";

// "alarm" is the newest NotificationType — every type-indexed map must
// resolve it to its own config, not silently fall back to warning.
describe("alarm type config", () => {
  it("maps to alarm badge colors, not the warning fallback", () => {
    expect(getBadgeColor("alarm")).toContain("bg-red-200");
    expect(getBadgeTextColor("alarm")).toContain("text-red-900");
    expect(getBadgeColor("alarm")).not.toBe(getBadgeColor("warning"));
  });

  it("maps to the alarm card border", () => {
    expect(getContainerBorderColor("alarm")).toBe("border-red-700");
  });

  it("renders the siren icon", () => {
    const icon = getIcon("alarm");
    expect(isValidElement(icon)).toBe(true);
    expect(icon!.type).toBe(Siren);
  });
});

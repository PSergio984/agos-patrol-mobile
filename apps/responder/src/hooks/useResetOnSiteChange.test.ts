import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useResetOnSiteChange } from "./useResetOnSiteChange";

const mockCore = { effectiveLocationId: 1 as number | null };

jest.mock("../context/CoreContext", () => ({
  useCoreHook: () => mockCore,
}));

describe("useResetOnSiteChange", () => {
  it("does not fire on mount", async () => {
    const reset = jest.fn();
    await renderHook(() => useResetOnSiteChange(reset));
    expect(reset).not.toHaveBeenCalled();
  });

  it("fires when the effective site changes", async () => {
    const reset = jest.fn();
    const { rerender } = await renderHook(() => useResetOnSiteChange(reset));

    mockCore.effectiveLocationId = 2;
    await act(async () => {
      rerender({});
    });

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not fire again when an unrelated render happens", async () => {
    const reset = jest.fn();
    const { rerender } = await renderHook(() => useResetOnSiteChange(reset));

    await act(async () => {
      rerender({});
      rerender({});
    });

    expect(reset).not.toHaveBeenCalled();
  });
});

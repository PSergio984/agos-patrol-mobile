import { describe, expect, it } from "@jest/globals";
import {
  getEffectiveSiteId,
  getEffectiveSiteName,
  getEligibleSites,
  isMultiSite,
} from "./sites";
import type { Responder } from "../../types/responder";

const baseResponder: Responder = {
  id: "r1",
  firstName: "Danny",
  lastName: "Cleaner",
  status: "active",
  phoneNumber: "09171234567",
  locationId: 1,
  locationName: "Home Site",
  activeLocationId: null,
  activeLocationName: null,
  deployments: [],
  createdAt: "2026-01-01T00:00:00Z",
  activatedAt: "2026-01-01T00:00:00Z",
};

const openDeployment = {
  id: 10,
  locationId: 2,
  locationName: "Deployment Site",
  startsAt: "2026-10-01T00:00:00Z",
  endsAt: null,
  plannedEndsAt: null,
  createdBy: "admin-1",
};

describe("getEligibleSites", () => {
  it("returns home site only when there are no deployments", () => {
    expect(getEligibleSites(baseResponder)).toEqual([
      { locationId: 1, locationName: "Home Site", kind: "home" },
    ]);
  });

  it("includes open, started deployments after the home site", () => {
    const sites = getEligibleSites({
      ...baseResponder,
      deployments: [openDeployment],
    });
    expect(sites).toEqual([
      { locationId: 1, locationName: "Home Site", kind: "home" },
      { locationId: 2, locationName: "Deployment Site", kind: "deployment" },
    ]);
  });

  it("excludes ended deployments", () => {
    const sites = getEligibleSites({
      ...baseResponder,
      deployments: [{ ...openDeployment, endsAt: "2026-10-10T00:00:00Z" }],
    });
    expect(sites).toHaveLength(1);
  });

  it("excludes deployments that have not started yet", () => {
    const sites = getEligibleSites({
      ...baseResponder,
      deployments: [{ ...openDeployment, startsAt: "2999-01-01T00:00:00Z" }],
    });
    expect(sites).toHaveLength(1);
  });

  it("dedupes a deployment that points at the home site", () => {
    const sites = getEligibleSites({
      ...baseResponder,
      deployments: [{ ...openDeployment, locationId: 1 }],
    });
    expect(sites).toHaveLength(1);
  });

  it("tolerates a missing deployments field", () => {
    const { deployments: _dropped, ...without } = baseResponder;
    expect(getEligibleSites(without as Responder)).toHaveLength(1);
  });

  it("returns [] for a null responder", () => {
    expect(getEligibleSites(null)).toEqual([]);
  });
});

describe("isMultiSite", () => {
  it("is false for a home-only responder", () => {
    expect(isMultiSite(baseResponder)).toBe(false);
  });

  it("is true with an open deployment", () => {
    expect(
      isMultiSite({ ...baseResponder, deployments: [openDeployment] })
    ).toBe(true);
  });
});

describe("effective site", () => {
  it("falls back to the home site when no presence is set", () => {
    expect(getEffectiveSiteId(baseResponder)).toBe(1);
    expect(getEffectiveSiteName(baseResponder)).toBe("Home Site");
  });

  it("prefers active_location over home", () => {
    const deployed = {
      ...baseResponder,
      activeLocationId: 2,
      activeLocationName: "Deployment Site",
    };
    expect(getEffectiveSiteId(deployed)).toBe(2);
    expect(getEffectiveSiteName(deployed)).toBe("Deployment Site");
  });

  it("returns nulls for a null responder", () => {
    expect(getEffectiveSiteId(null)).toBeNull();
    expect(getEffectiveSiteName(null)).toBeNull();
  });
});

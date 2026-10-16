import type { Responder } from "../../types/responder";

export interface SiteOption {
  locationId: number;
  locationName: string;
  kind: "home" | "deployment";
}

// Effective site = the responder's presence override, else their home site.
// Mirrors the backend's `active_location_id ?? location_id`.
export function getEffectiveSiteId(responder: Responder | null): number | null {
  if (!responder) return null;
  return responder.activeLocationId ?? responder.locationId;
}

export function getEffectiveSiteName(
  responder: Responder | null
): string | null {
  if (!responder) return null;
  return responder.activeLocationId != null
    ? (responder.activeLocationName ?? responder.locationName)
    : responder.locationName;
}

// Sites the responder may mark presence on: home site + every deployment that
// is open (no ends_at) and already started. Mirrors the backend's eligibility
// rule for POST /responder/active-site.
export function getEligibleSites(responder: Responder | null): SiteOption[] {
  if (!responder) return [];
  const now = Date.now();
  const open = (responder.deployments ?? []).filter(
    (d) =>
      d.endsAt === null &&
      new Date(d.startsAt).getTime() <= now &&
      d.locationId !== responder.locationId
  );
  return [
    {
      locationId: responder.locationId,
      locationName: responder.locationName,
      kind: "home",
    },
    ...open.map((d): SiteOption => ({
      locationId: d.locationId,
      locationName: d.locationName,
      kind: "deployment",
    })),
  ];
}

export function isMultiSite(responder: Responder | null): boolean {
  return getEligibleSites(responder).length > 1;
}

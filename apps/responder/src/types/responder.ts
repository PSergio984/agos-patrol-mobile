export interface ResponderDeployment {
  id: number;
  locationId: number;
  locationName: string;
  startsAt: string;
  endsAt: string | null;
  plannedEndsAt: string | null;
  createdBy: string;
}

export interface Responder {
  id: string;
  firstName: string;
  lastName: string;
  status: "pending" | "active";
  phoneNumber: string;
  locationId: number;
  locationName: string;
  // Presence: which eligible site the responder marked themselves on.
  // Null → home site. deployments is optional — older backends may omit it.
  activeLocationId: number | null;
  activeLocationName: string | null;
  deployments?: ResponderDeployment[];
  createdAt: string;
  activatedAt: string;
}

export interface NotificationPreferences {
  warning: boolean;
  critical: boolean;
  blockage: boolean;
  announcement: boolean;
}

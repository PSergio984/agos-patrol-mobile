export interface Responder {
  id: string;
  firstName: string;
  lastName: string;
  status: "pending" | "active";
  phoneNumber: string;
  locationId: number;
  locationName: string;
  createdAt: string;
  activatedAt: string;
}

export interface NotificationPreferences {
  warning: boolean;
  critical: boolean;
  blockage: boolean;
  announcement: boolean;
}

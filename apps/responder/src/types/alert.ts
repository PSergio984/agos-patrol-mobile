export type NotificationType =
  | "alarm"
  | "warning"
  | "critical"
  | "blockage"
  | "announcement"
  | "maintenance";

export interface Alert {
  id: string;
  dispatchId: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgeMessage: string | null;
  claimedBy: string | null;
  claimedByName: string | null;
  claimedAt: string | null;
}

export interface ClaimResponse {
  dispatchId: number;
  claimedBy: string;
  claimedByName: string;
  claimedAt: string;
}

export interface AlertPaginatedResponse {
  items: Alert[];
  hasMore: boolean;
}

export interface AcknowledgeNotificationPayload {
  message: string | null;
  deliveryId: string;
  responderId: string;
}

export interface AcknowledgeNotificationResponse {
  acknowledgedAt: string;
  acknowledgeMessage: string | null;
}

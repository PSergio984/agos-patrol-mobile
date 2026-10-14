export type NotificationType =
  "warning" | "critical" | "blockage" | "announcement" | "maintenance";

export interface Alert {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgeMessage: string | null;
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

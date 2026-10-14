import type {
  AcknowledgeNotificationPayload,
  AlertPaginatedResponse,
  AcknowledgeNotificationResponse,
} from "../../types/alert";
import apiClient from "./client";

export const alertsAPI = {
  getUnreadAlertsCount: async (responderId: string): Promise<number> => {
    const res = await apiClient.get(
      `/responder/unread-alerts-count/${responderId}`
    );
    return res.data;
  },

  acknowledgeNotification: async (
    payload: AcknowledgeNotificationPayload
  ): Promise<AcknowledgeNotificationResponse> => {
    const res = await apiClient.post("/responder/acknowledge-alert", payload);
    return res.data;
  },

  getAlerts: async (
    responderId: string,
    page: number = 1,
    type?: string
  ): Promise<AlertPaginatedResponse> => {
    const res = await apiClient.get(`/responder/alerts/${responderId}`, {
      params: { page, ...(type && type !== "all" ? { type } : {}) },
    });
    return res.data;
  },
};

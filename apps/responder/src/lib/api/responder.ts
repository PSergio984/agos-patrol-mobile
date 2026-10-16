import type { NotificationPreferences, Responder } from "../../types/responder";
import apiClient from "./client";

export const responderAPI = {
  getResponderDetails: async (responderId: string): Promise<Responder> => {
    try {
      const res = await apiClient.get(`/responder/${responderId}`);
      return res.data as Responder;
    } catch (error) {
      throw error;
    }
  },

  getResponderNotifPreferences: async (
    responderId: string
  ): Promise<NotificationPreferences> => {
    try {
      const res = await apiClient.get(
        `/responder/notif-preferences/${responderId}`
      );
      return res.data as NotificationPreferences;
    } catch (error) {
      throw error;
    }
  },

  // Presence: mark which eligible site (home or open deployment) the
  // responder is on. Server validates membership; 400 if ineligible.
  setActiveSite: async (
    locationId: number
  ): Promise<{ locationId: number; activeLocationId: number | null }> => {
    const res = await apiClient.post("/responder/active-site", { locationId });
    return res.data;
  },

  updateResponderProfile: async (
    responderId: string,
    payload: { firstName?: string; lastName?: string }
  ): Promise<Responder> => {
    const res = await apiClient.patch(
      `/responder/${responderId}/profile`,
      payload
    );
    return res.data as Responder;
  },

  updateResponderNotifPreferences: async (
    responderId: string,
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    try {
      const payload = {
        key: key,
        value: value,
      };

      const res = await apiClient.put(
        `/responder/notif-preferences/${responderId}`,
        payload
      );
      return res.data as NotificationPreferences;
    } catch (error) {
      throw error;
    }
  },
};

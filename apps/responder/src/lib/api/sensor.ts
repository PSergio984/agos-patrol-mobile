import type { SensorConfig } from "../../types/sensor";
import apiClient from "./client";

export interface WaterLevelTrendPoint {
  timestamp: string;
  waterLevelCm: number;
}

export const sensorAPI = {
  getSensorDeviceConfig: async (locationId: number): Promise<SensorConfig> => {
    const res = await apiClient.get(
      `/sensor-devices/${locationId}/config/by-location`
    );
    return res.data as SensorConfig;
  },

  getWaterLevelTrend: async (
    locationId: number
  ): Promise<WaterLevelTrendPoint[]> => {
    const res = await apiClient.get(
      `/responder/water-level-trend/${locationId}`
    );
    return res.data as WaterLevelTrendPoint[];
  },
};

import type { SummaryResponse } from "./readingResponse";

export interface SensorConfig {
  installation_height: number;
  warning_threshold: number;
  critical_threshold: number;
}

export interface SensorData {
  timestamp: string;
  water_level: WaterLevel;
  alert: Alert;
}

interface WaterLevel {
  current_cm: number;
  change_rate: number;
  trend: "rising" | "falling" | "stable";
}

interface Alert {
  level: "normal" | "warning" | "critical";
  distance_to_warning_cm: number;
  distance_to_critical_cm: number;
  distance_from_critical_cm: number;
  percentage_of_critical: number; // current_cm / critical_cm * 100 (can overflow 100%)
}

export interface SensorReadingSummaryResponse extends SummaryResponse {
  sensor_reading: SensorData;
}

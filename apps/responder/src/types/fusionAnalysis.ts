import type { SummaryResponse } from "./readingResponse";

export interface FusionAnalysisSummaryResponse extends SummaryResponse {
  fusion_analysis: FusionAnalysisData;
}

export const AnomalyType = {
  OBSTRUCTED_SENSOR: "OBSTRUCTED_SENSOR",
  BLIND_CAMERA: "BLIND_CAMERA",
  STALE_SENSOR: "STALE_SENSOR",
  GHOST_FLOOD: "GHOST_FLOOD",
  CONFIDENCE_THRASHING: "CONFIDENCE_THRASHING",
} as const;

export type AnomalyType = (typeof AnomalyType)[keyof typeof AnomalyType];

export interface FusionAnalysisData {
  fusion_data: FusionData;
  blockage_status: BlockageStatus | null;
  water_level_status: WaterLevelStatus | null;
  weather_status: WeatherStatus | null;
}

interface FusionData {
  alert_name: string;
  combined_risk_score: number;
  triggered_conditions: string[];
  anomalies: AnomalyType[];
}

interface StatusBase {
  timestamp: string;
}

interface BlockageStatus extends StatusBase {
  status: string;
  confidence?: {
    tier: "clear" | "possible" | "likely" | "confirmed";
    score: number;
    window_size: number;
    flagged_in_window: number;
  } | null;
}

interface WaterLevelStatus extends StatusBase {
  water_level_cm: number;
  change_rate: number;
  critical_percentage: number;
  trend: string;
}

interface WeatherStatus extends StatusBase {
  precipitation_mm: number;
  weather_condition: string;
}

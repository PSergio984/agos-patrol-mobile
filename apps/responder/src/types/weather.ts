import type { LucideIcon } from "lucide-react-native";
import type { SummaryResponse } from "./readingResponse";

export interface WeatherApiResponse {
  precipitation_mm: number;
  weather_code: number;
  condition: string; // e.g., "Sunny", "Rainy"
  description: string; // e.g., "Clear sky with lots of sunshine"
  timestamp: string;
}

export interface WeatherData extends WeatherApiResponse {
  icon: LucideIcon; // Proper type for Lucide icon component
  color: string; // For styling
}

export interface WeatherConditionSummaryResponse extends SummaryResponse {
  weather_condition: WeatherApiResponse;
}

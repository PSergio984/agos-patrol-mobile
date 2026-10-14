import type { LucideIcon } from "lucide-react-native";
import {
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  Sun,
} from "lucide-react-native";

export const getWeatherIcon = (weatherCode: number): LucideIcon => {
  if (weatherCode === 0 || weatherCode === 1) return Sun;

  if (weatherCode >= 2 && weatherCode <= 48) return Cloud; // cloudy or foggy

  if (weatherCode >= 51 && weatherCode <= 57) return CloudDrizzle;

  if (weatherCode >= 61 && weatherCode <= 67) return CloudRain;

  if (weatherCode >= 71 && weatherCode <= 77) return CloudSnow;

  if (weatherCode >= 80 && weatherCode <= 82) return CloudRain;

  if (weatherCode >= 85 && weatherCode <= 86) return CloudSnow;

  if (weatherCode >= 95 && weatherCode <= 99) return CloudLightning;

  return Cloud;
};

export const getWeatherColor = (precipitation: number): string => {
  if (precipitation === 0) {
    return "text-green-500";
  } else if (precipitation <= 2.5) {
    return "text-blue-400";
  } else if (precipitation <= 10) {
    return "text-yellow-500";
  } else if (precipitation <= 50) {
    return "text-orange-500";
  } else {
    return "text-red-500";
  }
};

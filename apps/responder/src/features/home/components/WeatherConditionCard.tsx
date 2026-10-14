import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useI18n, useWeather } from "../hooks";
import { getTimeAgo } from "../../../lib/utils/formatter";
import type { WeatherData } from "../../../types/weather";
import Card from "./common/Card";
import ErrorCard from "./common/ErrorCard";
import Skeleton from "./common/Skeleton";

// Maps the tailwind text-* color returned by the ported getWeatherColor()
// to a hex usable by lucide-react-native's `color` prop.
const WEATHER_ICON_COLORS: Record<string, string> = {
  "text-green-500": "#22c55e",
  "text-blue-400": "#60a5fa",
  "text-yellow-500": "#eab308",
  "text-orange-500": "#f97316",
  "text-red-500": "#ef4444",
};

type WeatherProps = {
  weather: WeatherData;
};

const WeatherCondition = ({ weather }: WeatherProps) => {
  return (
    <View className="flex-row gap-2 items-center my-3">
      <weather.icon
        size={40}
        color={WEATHER_ICON_COLORS[weather.color] ?? "#9ca3af"}
      />
      <View>
        <Text className={`font-semibold text-2xl ${weather.color}`}>
          {weather.condition}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {weather.description}
        </Text>
      </View>
    </View>
  );
};

const PrecipitationInfo = ({
  precipitation_mm,
}: {
  precipitation_mm: number;
}) => {
  const { warning } = useWeather();
  const { t } = useI18n();

  return (
    <View
      className={`rounded-lg p-2.5 border flex-1 ${warning ? "bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-700" : "bg-slate-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600"}`}
    >
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {t("home.precipitation")}
      </Text>
      <Text className="text-sm dark:text-gray-100">
        {`${precipitation_mm.toFixed(1)} mm/h`}
      </Text>
    </View>
  );
};

const LastUpdatedInfo = ({ timestamp }: { timestamp: string }) => {
  const { warning } = useWeather();
  const { t } = useI18n();

  const [timeAgo, setTimeAgo] = useState<string>(getTimeAgo(timestamp));

  // Refresh display value when a new timestamp arrives (adjust-during-render
  // replaces the PWA's synchronous setState-in-effect).
  const [prevTimestamp, setPrevTimestamp] = useState(timestamp);
  if (prevTimestamp !== timestamp) {
    setPrevTimestamp(timestamp);
    setTimeAgo(getTimeAgo(timestamp));
  }

  useEffect(() => {
    // Update every 60 seconds
    const intervalId = setInterval(() => {
      setTimeAgo(getTimeAgo(timestamp));
    }, 60 * 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [timestamp]);

  return (
    <View
      className={`rounded-lg p-2.5 border flex-1 ${warning ? "bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-700" : "bg-slate-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600"}`}
    >
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {t("home.lastUpdated")}
      </Text>
      <Text className="text-sm dark:text-gray-100">{timeAgo}</Text>
    </View>
  );
};

export default function WeatherConditionCard() {
  const { weatherData, isFetching, error } = useWeather();
  const { t } = useI18n();

  if (isFetching && !weatherData) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  if (!weatherData) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  return (
    <Card headerTitle={t("home.weatherCondition")} className="!p-3">
      <WeatherCondition weather={weatherData} />
      <View className="flex-row gap-2">
        <PrecipitationInfo precipitation_mm={weatherData.precipitation_mm} />
        <LastUpdatedInfo timestamp={weatherData.timestamp} />
      </View>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useWebSocket } from "./hooks";
import BlockageStatusCard from "./components/BlockageStatusCard";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner";
import FusionAnalysisCard from "./components/FusionAnalysisCard";
import LatestWaterwayFrame from "./components/LatestWaterwayFrame";
import WaterLevelStatusCard from "./components/WaterLevelStatusCard/WaterLevelStatusCard";
import WaterLevelSparkline from "./components/WaterLevelSparkline";
import WeatherConditionCard from "./components/WeatherConditionCard";

function getTimeSinceUpdate(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function Home() {
  const { connectionStatus, lastMessageAt } = useWebSocket();

  const [timeAgo, setTimeAgo] = useState("");
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const update = () => {
      setTimeAgo(getTimeSinceUpdate(lastMessageAt));
      setIsStale(
        Boolean(
          lastMessageAt && Date.now() - lastMessageAt.getTime() > 5 * 60 * 1000
        )
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [lastMessageAt]);

  return (
    <ScrollView
      className="flex-1 bg-[#F8F8F8] dark:bg-[#0f172a]"
      contentContainerClassName="p-4"
    >
      <View className="gap-3">
        <ConnectionStatusBanner status={connectionStatus} />
        <View className="flex-row items-center justify-between px-5 mb-2">
          {lastMessageAt && (
            <Text
              className={`text-xs ${isStale ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}
            >
              {isStale ? "\u26A0 " : ""}Last updated {timeAgo}
            </Text>
          )}
        </View>
        <FusionAnalysisCard />
        <BlockageStatusCard />
        <LatestWaterwayFrame />
        <WaterLevelStatusCard />
        <WaterLevelSparkline />
        <WeatherConditionCard />
      </View>
    </ScrollView>
  );
}

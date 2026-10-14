import { View } from "react-native";
import Card from "../common/Card";
import ErrorCard from "../common/ErrorCard";
import Skeleton from "../common/Skeleton";
import { useI18n, useWaterLevel } from "../../hooks";
import MainDisplay from "./components/MainDisplay";
import MetricCards from "./components/MetricCards";

export default function WaterLevelStatusCard() {
  const { isFetching, sensorData, error } = useWaterLevel();
  const { t } = useI18n();

  if (isFetching && !sensorData) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  return (
    <Card headerTitle={t("home.waterLevelStatus")} className="!p-3">
      <View className="flex-row justify-between">
        <MainDisplay />
        <MetricCards />
      </View>
    </Card>
  );
}

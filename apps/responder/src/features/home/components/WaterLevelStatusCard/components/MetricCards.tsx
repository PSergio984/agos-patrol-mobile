import { Text, View } from "react-native";
import { useI18n, useWaterLevel } from "../../../hooks";

type StatCardProps = {
  title: string;
  data: string | number;
  desc: string;
};

const StatCard = ({ title, data, desc }: StatCardProps) => {
  const { warning } = useWaterLevel();

  return (
    <View
      className={`border flex-1 flex-col justify-between rounded-md px-3 py-2 ${warning ? "bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-700" : "bg-slate-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600"}`}
    >
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </Text>
      <Text>
        <Text className="text-2xl font-semibold dark:text-white">{data}</Text>
        <Text className="text-xs text-gray-700 dark:text-gray-300">
          {" "}
          {desc}
        </Text>
      </Text>
    </View>
  );
};

export default function MetricCards() {
  const { sensorData } = useWaterLevel();
  const { t } = useI18n();

  const getTitleAndDesc = (): StatCardProps => {
    switch (sensorData?.alert.level) {
      case "normal":
        return {
          title: t("home.toWarning"),
          data: (sensorData?.alert.distance_to_warning_cm ?? 0).toFixed(1),
          desc: t("home.cmRemaining"),
        };
      case "warning":
        return {
          title: t("home.toCritical"),
          data: (sensorData?.alert.distance_to_critical_cm ?? 0).toFixed(1),
          desc: t("home.cmRemaining"),
        };
      case "critical":
        return {
          title: t("home.aboveCritical"),
          data: (sensorData?.alert.distance_from_critical_cm ?? 0).toFixed(1),
          desc: t("home.cmOver"),
        };
      default:
        return {
          title: t("home.toWarning"),
          data: (sensorData?.alert.distance_to_warning_cm ?? 0).toFixed(1),
          desc: t("home.cmRemaining"),
        };
    }
  };

  const titleAndDesc = getTitleAndDesc();

  const changeRateData = sensorData?.water_level.change_rate ?? 0;
  const changeRateDisplay =
    changeRateData > 0 ? `+${changeRateData}` : `${changeRateData}`;

  return (
    <View className="flex-col justify-between ml-10 gap-3 flex-1">
      <StatCard
        title={t("home.changeRate")}
        data={changeRateDisplay}
        desc="cm/min"
      />
      <StatCard
        title={titleAndDesc.title}
        data={titleAndDesc.data}
        desc={titleAndDesc.desc}
      />
    </View>
  );
}

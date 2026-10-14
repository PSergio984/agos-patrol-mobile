import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  type LucideIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";
import { useFusionAnalysis } from "../hooks";
import { getMostRecentDate, getTimeAgo } from "../../../lib/utils/formatter";
import Card from "./common/Card";
import ErrorCard from "./common/ErrorCard";
import Skeleton from "./common/Skeleton";

interface TierConfig {
  [key: string]: TierDetails;
}

interface TierDetails {
  color: string;
  iconColor: { light: string; dark: string };
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

const tierConfig: TierConfig = {
  normal: {
    color: "text-emerald-600 dark:text-emerald-400",
    iconColor: { light: "#059669", dark: "#34d399" },
    bgColor: "!bg-emerald-50 dark:!bg-emerald-950/50",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    icon: CheckCircle,
  },
  warning: {
    color: "text-yellow-600 dark:text-yellow-400",
    iconColor: { light: "#ca8a04", dark: "#facc15" },
    bgColor: "!bg-yellow-50 dark:!bg-yellow-950/50",
    borderColor: "border-yellow-400 dark:border-yellow-700",
    icon: AlertTriangle,
  },
  critical: {
    color: "text-red-600 dark:text-red-400",
    iconColor: { light: "#dc2626", dark: "#f87171" },
    bgColor: "!bg-red-50 dark:!bg-red-950/50",
    borderColor: "border-red-400 dark:border-red-700",
    icon: AlertCircle,
  },
  unavailable: {
    color: "text-gray-600 dark:text-gray-400",
    iconColor: { light: "#4b5563", dark: "#9ca3af" },
    bgColor: "!bg-gray-50 dark:!bg-slate-800",
    borderColor: "border-gray-300 dark:border-slate-600",
    icon: AlertCircle,
  },
  "n/a": {
    color: "text-gray-600 dark:text-gray-400",
    iconColor: { light: "#4b5563", dark: "#9ca3af" },
    bgColor: "!bg-gray-50 dark:!bg-slate-800",
    borderColor: "border-gray-300 dark:border-slate-600",
    icon: CheckCircle,
  },
};

const TimeAgoDisplay = () => {
  const { fusionAnalysis } = useFusionAnalysis();

  const mostRecent = getMostRecentDate(
    [
      fusionAnalysis?.blockage_status?.timestamp,
      fusionAnalysis?.water_level_status?.timestamp,
      fusionAnalysis?.weather_status?.timestamp,
    ].filter((d): d is string => d != null)
  );

  return (
    <Text className="text-gray-600 dark:text-gray-400 text-xs absolute bottom-2 left-2.5">
      {mostRecent ? getTimeAgo(mostRecent) : "No data"}
    </Text>
  );
};

const TriggeredConditionList = ({
  conditions,
}: {
  conditions: string[] | undefined;
}) => {
  if (!conditions || conditions.length === 0) return null;

  return (
    <View className="gap-1">
      {conditions.map((condition, index) => (
        <View key={index} className="flex-row gap-1.5">
          <Text
            className="text-gray-700 dark:text-gray-300"
            style={{ fontSize: 12.8 }}
          >
            {"\u2022"}
          </Text>
          <Text
            className="flex-1 text-gray-700 dark:text-gray-300"
            style={{ fontSize: 12.8 }}
          >
            {condition}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function FusionAnalysisCard() {
  const { fusionAnalysis, isFetching, error } = useFusionAnalysis();
  const isDark = useColorScheme().colorScheme === "dark";

  const tier =
    tierConfig[fusionAnalysis?.fusion_data.alert_name.toLowerCase() || "n/a"] ||
    tierConfig["n/a"];

  if (error) {
    return <ErrorCard message={error} />;
  }

  if (isFetching && !fusionAnalysis) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  return (
    <Card
      className={`${tier.bgColor} ${tier.borderColor} border-l-4 !pb-8 !py-3 !pl-3 relative`}
    >
      <View className="flex-row gap-3">
        <tier.icon
          size={32}
          color={isDark ? tier.iconColor.dark : tier.iconColor.light}
        />
        <View className="gap-1 flex-1">
          <Text className={`font-semibold ${tier.color}`}>
            {fusionAnalysis?.fusion_data.alert_name || "N/A"}
          </Text>

          <TriggeredConditionList
            conditions={fusionAnalysis?.fusion_data.triggered_conditions}
          />
        </View>
      </View>
      <TimeAgoDisplay />
    </Card>
  );
}

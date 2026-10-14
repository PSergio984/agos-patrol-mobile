import { Pressable, Text, View } from "react-native";
import type { Alert } from "../../../types/alert";
import { getContainerBorderColor } from "../utils/getClasses";
import { formatTimestamp } from "../../../lib/utils/formatter";
import { ChevronRight } from "lucide-react-native";
import { useAlertsPageHook } from "../context/AlertsPageContext";
import { AcknowledgeBadge, AlertTypeBadge } from "./badges";

const TimeStamp = ({ timestamp }: { timestamp: string }) => {
  return (
    <Text className="text-xs text-gray-500 dark:text-gray-400">
      {formatTimestamp(timestamp)}
    </Text>
  );
};

const AlertBody = ({ title, message }: { title: string; message: string }) => {
  return (
    <View className="my-3 gap-1">
      <Text className="text-sm font-semibold dark:text-white">{title}</Text>
      <Text className="text-sm text-gray-700 dark:text-gray-300">
        {message}
      </Text>
    </View>
  );
};

export default function AlertCard({ alert }: { alert: Alert }) {
  const { handleSetChosenAlert } = useAlertsPageHook();

  return (
    <Pressable onPress={() => handleSetChosenAlert(alert.id)}>
      {/* PWA Card: rounded-xl bg-white dark:bg-slate-800 dark:border
                dark:border-slate-700, overridden to px-3 py-4 border-l-4 */}
      <View
        className={`rounded-xl bg-white dark:bg-slate-800 dark:border dark:border-slate-700 px-3 py-4 border-l-4 ${getContainerBorderColor(alert.type)}`}
      >
        <View className="flex-row justify-between items-center">
          <AlertTypeBadge type={alert.type} />
          <TimeStamp timestamp={alert.timestamp} />
        </View>

        <AlertBody title={alert.title} message={alert.message} />

        <View className="flex-row items-center justify-between">
          <AcknowledgeBadge isAcknowledged={alert.isAcknowledged} />
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </View>
    </Pressable>
  );
}

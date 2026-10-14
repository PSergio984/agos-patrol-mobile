import { Pressable, Text, View } from "react-native";
import type { Alert, NotificationType } from "../../../types/alert";
import {
  getBadgeColor,
  getBadgeTextColor,
  getContainerBorderColor,
  getIcon,
} from "../utils/getClasses";
import { formatTimestamp } from "../../../lib/utils/formatter";
import { ChevronRight } from "lucide-react-native";
import { useAlertsPageHook } from "../context/AlertsPageContext";
import { useI18n } from "../../../context/I18nContext";

const AlertTypeBadge = ({ type }: { type: NotificationType }) => {
  const { t } = useI18n();
  const label =
    type === "blockage" ? t("alerts.surfaceObstruction") : type.toUpperCase();

  return (
    <View
      className={`${getBadgeColor(type)} self-start px-2 py-1 flex-row items-center gap-1 rounded-md`}
    >
      {getIcon(type)}
      <Text className={`text-xs font-medium ${getBadgeTextColor(type)}`}>
        {label}
      </Text>
    </View>
  );
};

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

const AcknowledgeBadge = ({ isAcknowledged }: { isAcknowledged: boolean }) => {
  const { t } = useI18n();
  const message = isAcknowledged
    ? t("alerts.acknowledged")
    : t("alerts.unacknowledged");

  const badgeColor = isAcknowledged
    ? "bg-green-100 border-green-400 dark:bg-green-950/50 dark:border-green-700"
    : "bg-amber-100 border-amber-400 dark:bg-amber-950/50 dark:border-amber-700";
  const textColor = isAcknowledged
    ? "text-green-700 dark:text-green-400"
    : "text-amber-700 dark:text-amber-400";

  return (
    <View className={`rounded-lg border ${badgeColor} px-2`}>
      <Text className={`text-[0.800rem] ${textColor}`}>{message}</Text>
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

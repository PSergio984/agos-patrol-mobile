import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { CircleCheck } from "lucide-react-native";
import type {
  AcknowledgeNotificationPayload,
  NotificationType,
} from "../../../../../types/alert";
import {
  getBadgeColor,
  getBadgeTextColor,
  getIcon,
} from "../../../utils/getClasses";
import { formatDate } from "../../../../../lib/utils/formatter";
import { useCoreHook } from "../../../../../context/CoreContext";
import { useAlertsPageHook } from "../../../context/AlertsPageContext";
import { alertsAPI } from "../../../../../lib/api/alerts";
import { enqueueAcknowledgement } from "../../../utils/offlineQueue";
import { useNotificationHook } from "../../../../../context/NotificationContext";
import { useI18n } from "../../../../../context/I18nContext";

export const Header = ({
  type,
  title,
  isAcknowledged,
}: {
  type: NotificationType;
  title: string;
  isAcknowledged: boolean;
}) => {
  return (
    <View className="items-center gap-2.5">
      <AlertTypeBadge type={type} />
      <Text className="font-semibold text-[1.120rem] text-center dark:text-white">
        {title}
      </Text>
      <AcknowledgeBadge isAcknowledged={isAcknowledged} />
    </View>
  );
};

export const NotificationDetails = ({
  message,
  timestamp,
}: {
  message: string;
  timestamp: string;
}) => {
  return (
    <View className="bg-gray-100 dark:bg-slate-700 p-3 rounded-xl gap-1.5">
      <Text className="text-sm dark:text-gray-200">{message}</Text>
      <Text className="text-[0.800rem] text-gray-500 dark:text-gray-400">
        {timestamp ? formatDate(timestamp) : "N/A"}
      </Text>
    </View>
  );
};

export const AcknowledgeNotification = () => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { responderId } = useCoreHook();
  const { chosenAlert, acknowledgeAlert } = useAlertsPageHook();
  const { reduceUnreadCount } = useNotificationHook();
  const { t } = useI18n();

  const handleSubmitAcknowledgement = async () => {
    if (isSubmitting || !chosenAlert || !responderId) return;

    try {
      setIsSubmitting(true);

      const payload: AcknowledgeNotificationPayload = {
        message: message || null,
        responderId: responderId,
        deliveryId: chosenAlert.id,
      };
      const res = await alertsAPI.acknowledgeNotification(payload);

      acknowledgeAlert(
        chosenAlert.id,
        res.acknowledgeMessage,
        res.acknowledgedAt
      );
      reduceUnreadCount(1);
    } catch {
      // Queue for retry when back online
      await enqueueAcknowledgement({
        message: message || null,
        responderId: responderId,
        deliveryId: chosenAlert.id,
      });
      // Optimistically mark as acknowledged locally
      acknowledgeAlert(
        chosenAlert.id,
        message || null,
        new Date().toISOString()
      );
      reduceUnreadCount(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-[0.800rem] text-gray-700 dark:text-gray-300 -mb-1">
        {t("alerts.leaveMessage")}
      </Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        className="text-sm p-2 border border-gray-400 dark:border-slate-600 rounded-lg dark:text-gray-200"
        style={{ minHeight: 72, textAlignVertical: "top" }}
        multiline
        numberOfLines={3}
        placeholder={t("alerts.placeholder")}
        placeholderTextColor="#9ca3af"
      />
      <Pressable
        onPress={() => handleSubmitAcknowledgement()}
        disabled={isSubmitting}
        className="bg-accent rounded-lg py-3 flex-row items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <ActivityIndicator size="small" color="#ffffff" />}
        <Text className="text-white">{t("alerts.acknowledge")}</Text>
      </Pressable>
    </View>
  );
};

export const AcknowledgementDetails = ({
  acknowledgeMessage,
  acknowledgedAt,
}: {
  acknowledgeMessage: string | null;
  acknowledgedAt: string;
}) => {
  const { t } = useI18n();

  return (
    <View className="gap-3">
      <View className="bg-green-100 dark:bg-green-950/50 border border-green-500 dark:border-green-700 p-2 rounded-lg flex-row gap-3 items-center">
        <CircleCheck size={24} color="#16a34a" />
        <View>
          <Text className="text-sm font-medium text-green-700 dark:text-green-400">
            {t("alerts.acknowledged")}
          </Text>
          <Text className="text-[0.800rem] text-green-700 dark:text-green-400">
            {acknowledgedAt ? formatDate(acknowledgedAt) : "N/A"}
          </Text>
        </View>
      </View>

      {acknowledgeMessage ? (
        <View>
          <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {t("alerts.notes")}
          </Text>
          <Text className="text-sm dark:text-gray-200">
            {acknowledgeMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export const AlertTypeBadge = ({ type }: { type: NotificationType }) => {
  const { t } = useI18n();
  const label =
    type === "blockage" ? t("alerts.surfaceObstruction") : type.toUpperCase();

  return (
    <View
      className={`${getBadgeColor(type)} border self-start px-4 py-1.5 flex-row items-center gap-1 rounded-full`}
    >
      {getIcon(type)}
      <Text className={`text-xs font-medium ${getBadgeTextColor(type)}`}>
        {label}
      </Text>
    </View>
  );
};

export const AcknowledgeBadge = ({
  isAcknowledged,
}: {
  isAcknowledged: boolean;
}) => {
  const { t } = useI18n();
  const message = isAcknowledged
    ? t("alerts.acknowledged").toUpperCase()
    : t("alerts.pendingAcknowledgement");

  return (
    <View className="flex-row items-center gap-2">
      {isAcknowledged ? (
        <CircleCheck size={16} color="#16a34a" />
      ) : (
        <View className="w-3 h-3 rounded-full bg-yellow-500" />
      )}
      <Text
        className={`text-[0.800rem] font-medium ${
          isAcknowledged
            ? "text-green-600 dark:text-green-400"
            : "text-yellow-500 dark:text-yellow-400"
        }`}
      >
        {message}
      </Text>
    </View>
  );
};

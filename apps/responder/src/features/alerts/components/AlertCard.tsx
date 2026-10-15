import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { isAxiosError } from "axios";
import type { Alert } from "../../../types/alert";
import { getContainerBorderColor } from "../utils/getClasses";
import { formatTimestamp } from "../../../lib/utils/formatter";
import { ChevronRight } from "lucide-react-native";
import { useAlertsPageHook } from "../context/AlertsPageContext";
import { AcknowledgeBadge, AlertTypeBadge, ClaimedBadge } from "./badges";
import { useI18n } from "../../../context/I18nContext";

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

// Compact "On it" for the list row — the detail sheet's ClaimNotification is
// the full-width version. A 409 means someone else got there first; anything
// else (offline included) is a connection failure — both surface inline.
const CardClaimButton = ({ alert }: { alert: Alert }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { claimAlert } = useAlertsPageHook();
  const { t } = useI18n();

  const handleClaim = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setClaimError(null);
      await claimAlert(alert);
    } catch (err) {
      setClaimError(
        isAxiosError(err) && err.response?.status === 409
          ? t("alerts.claimUnavailable")
          : t("alerts.claimFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="items-end gap-1">
      <Pressable
        onPress={handleClaim}
        disabled={isSubmitting}
        className="bg-blue-600 rounded-lg px-3 py-1.5 flex-row items-center gap-1.5 disabled:opacity-50"
      >
        {isSubmitting && <ActivityIndicator size="small" color="#ffffff" />}
        <Text className="text-white text-xs">{t("alerts.claim")}</Text>
      </Pressable>
      {claimError && (
        <Text className="text-[0.700rem] text-red-600 dark:text-red-400">
          {claimError}
        </Text>
      )}
    </View>
  );
};

export default function AlertCard({ alert }: { alert: Alert }) {
  const { handleSetChosenAlert } = useAlertsPageHook();
  const canClaim =
    alert.type === "blockage" && !alert.claimedBy && !alert.isAcknowledged;

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
          <View className="flex-row items-center gap-2">
            <AcknowledgeBadge isAcknowledged={alert.isAcknowledged} />
            <ClaimedBadge
              claimedBy={alert.claimedBy}
              claimedByName={alert.claimedByName}
            />
          </View>
          <View className="flex-row items-center gap-2">
            {canClaim && <CardClaimButton alert={alert} />}
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

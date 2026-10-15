import { Text, View } from "react-native";
import { CircleCheck, UserCheck } from "lucide-react-native";
import type { NotificationType } from "../../../types/alert";
import { getBadgeColor, getBadgeTextColor, getIcon } from "../utils/getClasses";
import { useI18n } from "../../../context/I18nContext";
import { useCoreHook } from "../../../context/CoreContext";

// Shared by AlertCard ("compact"/"badge" variants) and the AlertDetails sheet
// ("pill"/"status" variants). The two call sites render the same data with
// different chrome, so only the styling differs via the variant prop.
export const AlertTypeBadge = ({
  type,
  variant = "compact",
}: {
  type: NotificationType;
  variant?: "compact" | "pill";
}) => {
  const { t } = useI18n();
  const label =
    type === "blockage" ? t("alerts.surfaceObstruction") : type.toUpperCase();

  const variantClasses =
    variant === "pill"
      ? "border px-4 py-1.5 rounded-full"
      : "px-2 py-1 rounded-md";

  return (
    <View
      className={`${getBadgeColor(type)} self-start flex-row items-center gap-1 ${variantClasses}`}
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
  variant = "badge",
}: {
  isAcknowledged: boolean;
  variant?: "badge" | "status";
}) => {
  const { t } = useI18n();

  if (variant === "status") {
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
  }

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

// The claim lives on the shared dispatch — the badge renders who claimed it
// for every responder holding a delivery of that alert. Renders nothing when
// unclaimed (non-blockage alerts never carry claim fields). Own claims read
// "Claimed by you" so my state is unambiguous.
export const ClaimedBadge = ({
  claimedBy,
  claimedByName,
  variant = "badge",
}: {
  claimedBy: string | null;
  claimedByName: string | null;
  variant?: "badge" | "status";
}) => {
  const { t } = useI18n();
  const { responderId } = useCoreHook();

  if (!claimedBy) return null;

  const message =
    claimedBy === responderId
      ? t("alerts.claimedByYou")
      : t("alerts.claimedBy").replace("{name}", claimedByName ?? "");

  if (variant === "status") {
    return (
      <View className="flex-row items-center gap-2">
        <UserCheck size={16} color="#2563eb" />
        <Text className="text-[0.800rem] font-medium text-blue-600 dark:text-blue-400">
          {message}
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-lg border bg-blue-100 border-blue-400 dark:bg-blue-950/50 dark:border-blue-700 px-2">
      <Text className="text-[0.800rem] text-blue-700 dark:text-blue-400">
        {message}
      </Text>
    </View>
  );
};

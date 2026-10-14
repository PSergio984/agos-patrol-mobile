import {
  CircleAlert,
  Megaphone,
  TriangleAlert,
  Waves,
} from "lucide-react-native";
import { useEffect, useState, type ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import Card from "./common/Card";
import SectionLabel from "./common/SectionLabel";
import Skeleton from "./common/Skeleton";
import type { NotificationPreferences } from "../../../types/responder";
import { useCoreHook } from "../../../context/CoreContext";
import { useI18n } from "../../../context/I18nContext";
import { responderAPI } from "../../../lib/api/responder";

interface ToggleSectionProps {
  Icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  borderBottom?: boolean;
}

const ToggleSection = ({
  Icon,
  label,
  isActive,
  onToggle,
  borderBottom = true,
}: ToggleSectionProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex-row py-4 px-4 items-center justify-between ${borderBottom ? "border-b border-gray-300 dark:border-slate-600" : ""}`}
    >
      <View className="flex-row items-center gap-2">
        <Icon size={24} color={isDark ? "#9ca3af" : "#111827"} />
        <View>
          <Text className="text-sm font-medium dark:text-gray-200">
            {label}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => onToggle(!isActive)}
        accessibilityRole="switch"
        accessibilityState={{ checked: isActive }}
        className={`rounded-full w-12 h-7 justify-center ${isActive ? "bg-accent/80" : "bg-gray-300 dark:bg-slate-600"}`}
      >
        <View
          className={`rounded-full aspect-square bg-white absolute top-1 bottom-1 ${isActive ? "left-6" : "left-1"}`}
        />
      </Pressable>
    </View>
  );
};

/**
 * Port of PWA Profile/components/PushNotifications.tsx — per-category
 * notification preference toggles only. Expo push-token registration is
 * owned by the shared foundation (replaces the PWA's web-push
 * PushPermissionGate/usePushNotifications, which live outside this page).
 */
export default function PushNotifications() {
  const [notifPreferences, setNotifPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const { responder } = useCoreHook();
  const { t } = useI18n();

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!responder?.id) return;

      setIsFetching(true);
      try {
        const res = await responderAPI.getResponderNotifPreferences(
          responder.id
        );
        setNotifPreferences(res);
      } catch (error) {
        setError(t("profile.prefError"));
        if (__DEV__) console.log(error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchPreferences();
  }, [responder?.id, t]);

  const handleToggle = async (
    type: keyof NotificationPreferences,
    enabled: boolean
  ) => {
    const oldValue = notifPreferences?.[type];
    if (!responder?.id) return;

    try {
      setNotifPreferences((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: enabled,
        };
      });

      await responderAPI.updateResponderNotifPreferences(
        responder.id,
        type,
        enabled
      );
    } catch {
      setNotifPreferences((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: oldValue,
        };
      });
    }
  };

  if (isFetching) {
    return (
      <View className="gap-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </View>
    );
  }

  if (error || !notifPreferences) {
    return (
      <View className="items-center bg-red-50 dark:bg-red-950/50 border border-red-500 dark:border-red-700 py-4 rounded-lg">
        <Text className="text-red-500 dark:text-red-400 font-medium text-center">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <SectionLabel label={t("profile.pushNotifications")} />
      <Card>
        <ToggleSection
          Icon={TriangleAlert}
          label={t("profile.warningAlerts")}
          isActive={notifPreferences.warning}
          onToggle={(enabled) => handleToggle("warning", enabled)}
        />
        <ToggleSection
          Icon={CircleAlert}
          label={t("profile.criticalAlerts")}
          isActive={notifPreferences.critical}
          onToggle={(enabled) => handleToggle("critical", enabled)}
        />
        <ToggleSection
          Icon={Waves}
          label={t("profile.blockageDetections")}
          isActive={notifPreferences.blockage}
          onToggle={(enabled) => handleToggle("blockage", enabled)}
        />
        <ToggleSection
          Icon={Megaphone}
          label={t("profile.announcements")}
          isActive={notifPreferences.announcement}
          onToggle={(enabled) => handleToggle("announcement", enabled)}
        />
      </Card>
    </View>
  );
}

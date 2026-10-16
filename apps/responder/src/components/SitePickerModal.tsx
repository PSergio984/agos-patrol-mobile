import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Check, MapPin } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCoreHook } from "../context/CoreContext";
import { useI18n } from "../context/I18nContext";
import { getEligibleSites } from "../lib/utils/sites";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Presence picker — "which of my sites am I on". Writes active_location_id
// via POST /responder/active-site (inside setActiveSite); the responder
// object refresh then re-keys the WS channel, alerts, and sensor/camera data.
export default function SitePickerModal({ visible, onClose }: Props) {
  const { responder, effectiveLocationId, setActiveSite } = useCoreHook();
  const { t } = useI18n();
  const isDark = useColorScheme().colorScheme === "dark";
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sites = getEligibleSites(responder);

  const handlePick = async (locationId: number) => {
    if (isSwitching) return;
    if (locationId === effectiveLocationId) {
      onClose();
      return;
    }
    setIsSwitching(true);
    setError(null);
    try {
      await setActiveSite(locationId);
      onClose();
    } catch {
      setError(t("site.switchFailed"));
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
        accessibilityLabel={t("profile.cancel")}
      >
        {/* Inner Pressable absorbs taps so the sheet doesn't dismiss itself */}
        <Pressable
          className="rounded-t-2xl bg-white px-4 pb-8 pt-4 dark:bg-slate-800"
          onPress={() => {}}
        >
          <View className="mb-3 items-center">
            <View className="h-1 w-10 rounded-full bg-gray-300 dark:bg-slate-600" />
          </View>
          <Text className="mb-3 text-base font-semibold text-gray-950 dark:text-white">
            {t("site.pickerTitle")}
          </Text>

          <View className="gap-2">
            {sites.map((site) => {
              const isCurrent = site.locationId === effectiveLocationId;
              return (
                <Pressable
                  key={site.locationId}
                  onPress={() => handlePick(site.locationId)}
                  disabled={isSwitching}
                  className={`flex-row items-center gap-3 rounded-xl border px-3 py-3 ${
                    isCurrent
                      ? "border-accent bg-accent/10"
                      : "border-gray-200 active:bg-gray-50 dark:border-slate-600 dark:active:bg-slate-700"
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrent }}
                >
                  <MapPin
                    size={18}
                    color={
                      isCurrent ? "#1ABC9C" : isDark ? "#94a3b8" : "#6b7280"
                    }
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-sm font-medium text-gray-950 dark:text-white"
                      numberOfLines={1}
                    >
                      {site.locationName}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {site.kind === "home"
                        ? t("site.home")
                        : t("site.deployment")}
                    </Text>
                  </View>
                  {isCurrent && <Check size={18} color="#1ABC9C" />}
                </Pressable>
              );
            })}
          </View>

          {isSwitching && (
            <View className="mt-3 flex-row items-center justify-center gap-2">
              <ActivityIndicator color="#1ABC9C" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {t("site.switching")}
              </Text>
            </View>
          )}
          {error && (
            <Text className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
              {error}
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

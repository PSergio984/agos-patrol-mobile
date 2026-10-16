import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, MapPin } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import Card from "./common/Card";
import SectionLabel from "./common/SectionLabel";
import SitePickerModal from "../../../components/SitePickerModal";
import { useCoreHook } from "../../../context/CoreContext";
import { useI18n } from "../../../context/I18nContext";
import { isMultiSite } from "../../../lib/utils/sites";

// Profile section for presence — multi-site responders only. Single-site
// responders keep the pre-multi-site profile (no picker).
export default function SiteSection() {
  const { responder, effectiveLocationName } = useCoreHook();
  const { t } = useI18n();
  const isDark = useColorScheme().colorScheme === "dark";
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!isMultiSite(responder)) return null;

  return (
    <View>
      <SectionLabel label={t("site.section")} />
      <Card className="p-4">
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center justify-between"
          accessibilityRole="button"
          accessibilityLabel={t("site.change")}
        >
          <View className="flex-row items-center gap-3">
            <MapPin size={18} color={isDark ? "#1ABC9C" : "#0A3D62"} />
            <View>
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("site.current")}
              </Text>
              <Text className="text-sm font-semibold text-gray-950 dark:text-white">
                {effectiveLocationName}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#9ca3af" />
        </Pressable>
      </Card>
      <SitePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

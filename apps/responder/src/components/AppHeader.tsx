import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useCoreHook } from "../context/CoreContext";
import { useI18n } from "../context/I18nContext";
import { isMultiSite } from "../lib/utils/sites";
import SitePickerModal from "./SitePickerModal";

const MapPinFilled = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      fill={color}
    />
    <Circle cx={12} cy={10} r={2} fill="white" />
  </Svg>
);

export default function AppHeader() {
  const { responder, effectiveLocationName } = useCoreHook();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSwitchSite = isMultiSite(responder);

  return (
    <View
      className="flex-row items-center justify-between bg-white dark:bg-slate-900 pb-4 px-4"
      style={[
        { paddingTop: Math.max(insets.top, 20) },
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 4,
        },
      ]}
    >
      <View className="flex-row items-center gap-1">
        <Image
          source={require("../../assets/patrol.png")}
          className="w-8 h-8"
          resizeMode="contain"
        />
        <Text className="font-poppins-black text-xl text-primary dark:text-accent">
          Patrol
        </Text>
      </View>
      <Pressable
        className="flex-row items-center gap-1"
        onPress={canSwitchSite ? () => setPickerOpen(true) : undefined}
        accessibilityRole={canSwitchSite ? "button" : undefined}
        accessibilityLabel={canSwitchSite ? t("site.change") : undefined}
        disabled={!canSwitchSite}
      >
        <MapPinFilled color="#ef4444" />
        <Text className="font-poppins-semibold mt-1 dark:text-white">
          {effectiveLocationName}
        </Text>
        {canSwitchSite && <ChevronDown size={14} color="#9ca3af" />}
      </Pressable>
      <SitePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

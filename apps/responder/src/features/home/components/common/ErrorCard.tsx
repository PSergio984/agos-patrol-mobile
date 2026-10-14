import { CircleAlert } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";
import { useI18n } from "../../hooks";
import { cardShadow } from "../../../../styles/shadow";

export default function ErrorCard({ message }: { message: string }) {
  const { t } = useI18n();
  const isDark = useColorScheme().colorScheme === "dark";

  return (
    <View
      className="rounded-xl p-3 flex-row gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800"
      style={cardShadow}
    >
      <CircleAlert
        size={20}
        color={isDark ? "#f87171" : "#ef4444"}
        style={{ marginTop: 2 }}
      />
      <View className="gap-0.5 flex-1">
        <Text className="font-medium text-sm text-red-800 dark:text-red-300">
          {t("home.errorLoadingData")}
        </Text>
        <Text className="text-xs text-red-500 dark:text-red-400">
          {message}
        </Text>
      </View>
    </View>
  );
}

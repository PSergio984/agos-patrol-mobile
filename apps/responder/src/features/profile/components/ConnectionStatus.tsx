import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { useWebSocket } from "../../../context/WebsocketContext";
import { useI18n } from "../../../context/I18nContext";

type StatusLabelKey =
  "profile.connecting" | "profile.online" | "profile.offline";

const statusConfig: Record<
  string,
  { labelKey: StatusLabelKey; dotColor: string; textColor: string }
> = {
  connecting: {
    labelKey: "profile.connecting",
    dotColor: "bg-yellow-400",
    textColor: "text-yellow-600 dark:text-yellow-400",
  },
  connected: {
    labelKey: "profile.online",
    dotColor: "bg-emerald-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  disconnected: {
    labelKey: "profile.offline",
    dotColor: "bg-red-400",
    textColor: "text-red-600 dark:text-red-400",
  },
};

export default function ConnectionStatus() {
  const { connectionStatus, reconnect } = useWebSocket();
  const { t } = useI18n();
  const { labelKey, dotColor, textColor } = statusConfig[connectionStatus];

  // PWA animate-pulse on the "connecting" dot
  const [pulse] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (connectionStatus !== "connecting") {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [connectionStatus, pulse]);

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-row items-center gap-1.5">
        <Animated.View
          className={`w-2 h-2 rounded-full ${dotColor}`}
          style={{
            opacity: connectionStatus === "connecting" ? pulse : 1,
          }}
        />
        <Text className={`text-sm font-medium ${textColor}`}>
          {t(labelKey)}
        </Text>
      </View>

      {connectionStatus === "disconnected" && (
        <Pressable
          onPress={reconnect}
          accessibilityLabel="Reconnect"
          className="p-1 rounded-md active:bg-gray-200 dark:active:bg-slate-600"
        >
          <RefreshCw size={14} color="#6b7280" />
        </Pressable>
      )}
    </View>
  );
}

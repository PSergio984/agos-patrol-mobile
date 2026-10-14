import { Wifi, WifiOff, Loader2, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import { Animated, Easing, Text, View } from "react-native";
import { useI18n } from "../hooks";
import type { TranslationKey } from "../../../lib/i18n";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const config: Record<
  ConnectionStatus,
  {
    icon: LucideIcon;
    spin: boolean;
    textKey: TranslationKey;
    iconColor: { light: string; dark: string };
    bg: string;
  }
> = {
  connecting: {
    icon: Loader2,
    spin: true,
    textKey: "home.connecting",
    iconColor: { light: "#a16207", dark: "#facc15" }, // yellow-700 / yellow-400
    bg: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/50 dark:border-yellow-700",
  },
  connected: {
    icon: Wifi,
    spin: false,
    textKey: "home.connected",
    iconColor: { light: "#047857", dark: "#34d399" }, // emerald-700 / emerald-400
    bg: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700",
  },
  disconnected: {
    icon: WifiOff,
    spin: false,
    textKey: "home.disconnected",
    iconColor: { light: "#b91c1c", dark: "#f87171" }, // red-700 / red-400
    bg: "bg-red-50 border-red-300 dark:bg-red-950/50 dark:border-red-700",
  },
};

const textColor: Record<ConnectionStatus, string> = {
  connecting: "text-yellow-700 dark:text-yellow-400",
  connected: "text-emerald-700 dark:text-emerald-400",
  disconnected: "text-red-700 dark:text-red-400",
};

export default function ConnectionStatusBanner({
  status,
}: {
  status: ConnectionStatus;
}) {
  const [visible, setVisible] = useState(true);
  const { t } = useI18n();
  const isDark = useColorScheme().colorScheme === "dark";
  const [spin] = useState(() => new Animated.Value(0));

  // Re-show the banner whenever the status changes (PWA resets `visible`
  // synchronously in an effect; the adjust-during-render pattern is the
  // React-endorsed equivalent).
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    setVisible(true);
  }

  // Auto-hide after 3 seconds when connected
  useEffect(() => {
    if (status === "connected") {
      const timeout = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Replicates `animate-spin` on the connecting icon
  useEffect(() => {
    if (status !== "connecting") return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [status, spin]);

  if (!visible) return null;

  const {
    icon: Icon,
    spin: shouldSpin,
    textKey,
    iconColor,
    bg,
  } = config[status];
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${bg}`}
    >
      <Animated.View
        style={shouldSpin ? { transform: [{ rotate }] } : undefined}
      >
        <Icon size={16} color={isDark ? iconColor.dark : iconColor.light} />
      </Animated.View>
      <Text className={`text-sm font-medium ${textColor[status]}`}>
        {t(textKey)}
      </Text>
    </View>
  );
}

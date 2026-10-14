import { LogOut } from "lucide-react-native";
import { Alert, Pressable, Text } from "react-native";
import { useColorScheme } from "nativewind";
import { useCoreHook } from "../../../context/CoreContext";
import { useI18n } from "../../../context/I18nContext";

export default function Logout() {
  const { logOut } = useCoreHook();
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // CoreContext.logOut clears the responder session (incl. cached axios
  // token and the offline ack queue) and routes to /verify — same flow as
  // the PWA. Native adds a confirm dialog first.
  const confirmLogout = () => {
    Alert.alert(t("profile.logout"), undefined, [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: () => logOut(),
      },
    ]);
  };

  return (
    <Pressable
      onPress={confirmLogout}
      className="px-4 py-3 w-full active:bg-red-50 dark:active:bg-red-950/50 rounded-xl bg-white dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 flex-row items-center gap-2 justify-center"
    >
      <LogOut size={24} color={isDark ? "#f87171" : "#ef4444"} />
      <Text className="text-red-500 dark:text-red-400 font-medium">
        {t("profile.logout")}
      </Text>
    </Pressable>
  );
}

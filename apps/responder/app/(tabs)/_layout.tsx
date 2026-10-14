import type { ReactNode } from "react";
import { Image, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Bell, Home, User } from "lucide-react-native";

import { WebSocketProvider } from "../../src/context/WebsocketContext";
import { CoreProvider, useCoreHook } from "../../src/context/CoreContext";
import { FusionAnalysisProvider } from "../../src/context/FusionAnalysisContext";
import { BlockageProvider } from "../../src/context/BlockageContext";
import { WaterLevelProvider } from "../../src/context/WaterLevelContext";
import { WeatherProvider } from "../../src/context/WeatherContext";
import {
  NotificationProvider,
  useNotificationHook,
} from "../../src/context/NotificationContext";
import { useI18n } from "../../src/context/I18nContext";
import { useTheme } from "../../src/context/ThemeContext";
import AppHeader from "../../src/components/AppHeader";
import PushPermissionGate from "../../src/components/PushPermissionGate";

function CoreGate({ children }: { children: ReactNode }) {
  const { isLoading, hydrated, responderId } = useCoreHook();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <Image
          source={require("../../assets/patrol.png")}
          className="w-32 h-32"
          resizeMode="contain"
        />
      </View>
    );
  }

  // AuthGuard parity — no stored session after hydration means re-verify
  if (hydrated && !responderId) {
    return <Redirect href="/(auth)/verify" />;
  }

  return <>{children}</>;
}

function ResponderTabs() {
  const { unreadCount } = useNotificationHook();
  const { t } = useI18n();
  const { isDark } = useTheme();

  return (
    <>
      <PushPermissionGate />
      <Tabs
        screenOptions={{
          header: () => <AppHeader />,
          tabBarActiveTintColor: "#1ABC9C",
          tabBarInactiveTintColor: isDark ? "#9ca3af" : "#4b5563",
          tabBarStyle: {
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            borderTopColor: isDark ? "#334155" : "#e5e7eb",
          },
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("nav.home"),
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: t("nav.alerts"),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("nav.profile"),
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}

export default function TabsLayout() {
  return (
    <CoreProvider>
      <CoreGate>
        <WebSocketProvider>
          <FusionAnalysisProvider>
            <BlockageProvider>
              <WaterLevelProvider>
                <WeatherProvider>
                  <NotificationProvider>
                    <ResponderTabs />
                  </NotificationProvider>
                </WeatherProvider>
              </WaterLevelProvider>
            </BlockageProvider>
          </FusionAnalysisProvider>
        </WebSocketProvider>
      </CoreGate>
    </CoreProvider>
  );
}

import "../src/styles/global.css";

import { useEffect } from "react";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";

import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { I18nProvider } from "../src/context/I18nContext";
import { setUnauthorizedHandler } from "../src/lib/api/client";
import {
  clearResponderSession,
  getResponderId,
  getResponderToken,
} from "../src/lib/storage";

function RootStack() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  // 401s in the axios layer route back to verification
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearResponderSession();
      router.replace("/verify");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Auth bootstrap — no stored session means the responder must verify
  const isNavigationReady = useRootNavigationState()?.key != null;
  useEffect(() => {
    if (!isNavigationReady) return;
    void (async () => {
      const [token, id] = await Promise.all([
        getResponderToken(),
        getResponderId(),
      ]);
      if (!token || !id) {
        router.replace("/(auth)/verify");
      }
    })();
  }, [isNavigationReady]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <RootStack />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

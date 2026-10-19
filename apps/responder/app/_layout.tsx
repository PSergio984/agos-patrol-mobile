import "../src/styles/global.css";

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, router } from "expo-router";
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

import ErrorBoundary from "../src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { I18nProvider } from "../src/context/I18nContext";
import { setUnauthorizedHandler } from "../src/lib/api/client";
import { clearResponderSession } from "../src/lib/storage";

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
  const [fatal, setFatal] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  // Surface uncaught JS errors that bypass the boundary (async bootstrap etc.)
  useEffect(() => {
    const errorUtils = (globalThis as { ErrorUtils?: any }).ErrorUtils;
    if (!errorUtils?.getGlobalHandler) return;
    const prev = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      setFatal(
        `[${isFatal ? "fatal" : "non-fatal"}] ${String(
          (error as { message?: string })?.message ?? error,
        )}`,
      );
      prev?.(error, isFatal);
    });
    return () => errorUtils.setGlobalHandler(prev);
  }, []);

  // 401s in the axios layer route back to verification
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearResponderSession();
      router.replace("/verify");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Auth bootstrap lives in app/index.tsx (declarative Redirect). An
  // imperative router.replace here raced that Redirect and could leave the
  // root Stack with no matched route — the white screen seen on device.

  if (fontError && !fatal) {
    setFatal(`font load failed: ${String(fontError?.message ?? fontError)}`);
  }

  if (!fontsLoaded && !fatal) return null;

  if (fatal) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#fff",
        }}
      >
        <Text selectable style={{ color: "#b91c1c", fontSize: 13 }}>
          {fatal}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <ErrorBoundary>
            <RootStack />
          </ErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

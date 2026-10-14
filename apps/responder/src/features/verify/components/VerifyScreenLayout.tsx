import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Port of PWA src/layouts/VerifyLayout.tsx — centered max-w-sm column on the
 * verify background. Light is flat #F8F8F8 (`bg-background`); dark is the
 * PWA's radial gradient (ellipse at 50% 20%, #162544 → #0f172a) drawn with
 * react-native-svg since RN has no CSS gradients.
 *
 * KeyboardAvoidingView keeps the card clear of the keyboard — the PWA
 * relies on the browser scrolling inputs into view.
 */
export default function VerifyScreenLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
      edges={["top", "bottom"]}
    >
      {isDark && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient
              id="verify-bg"
              cx="50%"
              cy="20%"
              rx="90%"
              ry="90%"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor="#162544" />
              <Stop offset="0.6" stopColor="#0f172a" />
              <Stop offset="1" stopColor="#0f172a" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#verify-bg)" />
        </Svg>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-full max-w-sm">{children}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
